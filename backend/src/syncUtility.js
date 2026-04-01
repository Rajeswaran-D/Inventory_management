#!/usr/bin/env node

/**
 * SYSTEM VERIFICATION & SYNC UTILITY
 * 
 * Purpose: Check system health and fix any sync issues
 * Usage: npm run sync:verify
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ProductMaster = require('./models/ProductMaster');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  header: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`)
};

async function runVerification() {
  let issues = [];

  try {
    log.header('SYSTEM VERIFICATION & SYNC CHECK');

    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/swamy-envelopes';
    await mongoose.connect(mongoUrl);
    log.success('Connected to MongoDB');

    // ===== CHECK 1: Collection Counts =====
    log.header('CHECK 1: Collection Counts');
    
    const productCount = await ProductMaster.countDocuments({ isActive: true });
    const variantCount = await ProductVariant.countDocuments({ isActive: true });
    const inventoryCount = await Inventory.countDocuments({ isActive: true });

    console.table({
      'ProductMasters': productCount,
      'ProductVariants': variantCount,
      'Inventory Entries': inventoryCount
    });

    // ===== CHECK 2: Orphaned Variants =====
    log.header('CHECK 2: Checking for Orphaned Variants');

    const orphanedVariants = await ProductVariant.find({ isActive: true }).lean();
    let orphanCount = 0;

    for (const variant of orphanedVariants) {
      const inv = await Inventory.findOne({ variantId: variant._id });
      if (!inv) {
        log.warning(`Orphaned variant found: ${variant._id} (${variant.displayName})`);
        issues.push({
          type: 'ORPHANED_VARIANT',
          variantId: variant._id,
          displayName: variant.displayName
        });
        orphanCount++;
      }
    }

    if (orphanCount === 0) {
      log.success(`✓ All ${variantCount} variants have inventory entries`);
    } else {
      log.error(`✗ Found ${orphanCount} variants without inventory`);
    }

    // ===== CHECK 3: Inventory without Variants =====
    log.header('CHECK 3: Checking for Invalid Inventory Entries');

    const inventories = await Inventory.find({ isActive: true }).lean();
    let invalidCount = 0;

    for (const inv of inventories) {
      const variant = await ProductVariant.findById(inv.variantId);
      if (!variant) {
        log.warning(`Invalid inventory entry: ${inv._id} (variant ${inv.variantId} not found)`);
        issues.push({
          type: 'INVALID_INVENTORY',
          inventoryId: inv._id,
          variantId: inv.variantId
        });
        invalidCount++;
      }
    }

    if (invalidCount === 0) {
      log.success(`✓ All ${inventoryCount} inventory entries have valid variants`);
    } else {
      log.error(`✗ Found ${invalidCount} invalid inventory entries`);
    }

    // ===== CHECK 4: Duplicates =====
    log.header('CHECK 4: Checking for Duplicate Variants');

    const pipeline = [
      {
        $group: {
          _id: {
            productId: '$productId',
            size: '$size',
            gsm: '$gsm',
            color: '$color'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ];

    const duplicates = await ProductVariant.aggregate(pipeline);

    if (duplicates.length === 0) {
      log.success('✓ No duplicate variants found');
    } else {
      log.error(`✗ Found ${duplicates.length} duplicate variant combinations`);
      for (const dup of duplicates.slice(0, 5)) {
        log.warning(`  Duplicates: ${JSON.stringify(dup._id)} (${dup.count} copies)`);
        issues.push({
          type: 'DUPLICATE_VARIANT',
          key: dup._id,
          copies: dup.count
        });
      }
    }

    // ===== CHECK 5: Product Distribution =====
    log.header('CHECK 5: Product Distribution');

    const products = await ProductMaster.find({ isActive: true });
    let totalVariants = 0;
    let totalInventory = 0;

    for (const product of products) {
      const varCount = await ProductVariant.countDocuments({ 
        productId: product._id, 
        isActive: true 
      });
      const invIds = (await ProductVariant.find({ 
        productId: product._id, 
        isActive: true 
      }).select('_id')).map(v => v._id);
      const invCount = await Inventory.countDocuments({ 
        variantId: { $in: invIds },
        isActive: true
      });

      log.info(`${product.name}: ${varCount} variants, ${invCount} inventory`);
      totalVariants += varCount;
      totalInventory += invCount;

      if (varCount !== invCount) {
        issues.push({
          type: 'PRODUCT_MISMATCH',
          product: product.name,
          variants: varCount,
          inventory: invCount
        });
      }
    }

    // ===== FINAL REPORT =====
    log.header('FINAL REPORT');

    console.table({
      'Total Variants': totalVariants,
      'Total Inventory': totalInventory,
      'Match': totalVariants === totalInventory ? '✅ YES' : '❌ NO',
      'Issues Found': issues.length
    });

    if (issues.length === 0) {
      log.success('🎉 SYSTEM IS PERFECTLY SYNCHRONIZED!');
    } else {
      log.warning(`\n${issues.length} issues detected:\n`);
      for (const issue of issues) {
        console.log(`  • ${JSON.stringify(issue)}`);
      }
    }

    // ===== FIX SUGGESTIONS =====
    if (issues.length > 0) {
      log.header('FIX SUGGESTIONS');

      const orphanedIssues = issues.filter(i => i.type === 'ORPHANED_VARIANT');
      if (orphanedIssues.length > 0) {
        log.warning(`Create missing inventory for ${orphanedIssues.length} variants:`);
        log.info('npm run fix:sync');
      }

      const invalidIssues = issues.filter(i => i.type === 'INVALID_INVENTORY');
      if (invalidIssues.length > 0) {
        log.warning(`Delete ${invalidIssues.length} invalid inventory entries:`);
        log.info('npm run fix:cleanup');
      }

      const dupIssues = issues.filter(i => i.type === 'DUPLICATE_VARIANT');
      if (dupIssues.length > 0) {
        log.warning(`Remove ${dupIssues.length} duplicate variants:`);
        log.info('npm run fix:duplicates');
      }
    }

  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Fix orphaned variants by creating missing inventory
 */
async function fixOrphanedVariants() {
  try {
    log.header('FIXING ORPHANED VARIANTS');

    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/swamy-envelopes';
    await mongoose.connect(mongoUrl);

    const orphans = await ProductVariant.find({ isActive: true });
    let fixed = 0;

    for (const variant of orphans) {
      const inv = await Inventory.findOne({ variantId: variant._id });
      if (!inv) {
        const inventory = new Inventory({
          variantId: variant._id,
          quantity: 0,
          price: 0,
          minimumStockLevel: 50,
          isActive: true
        });
        await inventory.save();
        fixed++;
        log.success(`Created inventory for: ${variant.displayName}`);
      }
    }

    log.success(`✓ Fixed ${fixed} orphaned variants`);
  } catch (err) {
    log.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Clean up invalid inventory entries
 */
async function cleanupInvalidInventory() {
  try {
    log.header('CLEANING UP INVALID INVENTORY');

    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/swamy-envelopes';
    await mongoose.connect(mongoUrl);

    const inventories = await Inventory.find({ isActive: true });
    let removed = 0;

    for (const inv of inventories) {
      const variant = await ProductVariant.findById(inv.variantId);
      if (!variant) {
        await Inventory.findByIdAndDelete(inv._id);
        removed++;
        log.success(`Deleted invalid inventory: ${inv._id}`);
      }
    }

    log.success(`✓ Removed ${removed} invalid inventory entries`);
  } catch (err) {
    log.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// ============================================================
// EXECUTE
// ============================================================

if (require.main === module) {
  const command = process.argv[2] || 'verify';

  if (command === 'verify') {
    runVerification().then(() => process.exit(0));
  } else if (command === 'fix-orphans') {
    fixOrphanedVariants().then(() => process.exit(0));
  } else if (command === 'cleanup') {
    cleanupInvalidInventory().then(() => process.exit(0));
  } else {
    log.error(`Unknown command: ${command}`);
    log.info('Available commands: verify, fix-orphans, cleanup');
    process.exit(1);
  }
}

module.exports = { runVerification, fixOrphanedVariants, cleanupInvalidInventory };
