#!/usr/bin/env node

/**
 * COMPREHENSIVE ONE-TIME SEED SCRIPT
 * Full system synchronization with Product Master, Product Variants, and Inventory
 * 
 * Purpose: Initialize the database with all required products in a synchronized way
 * Safety: Can be run multiple times safely - checks for existing data
 * 
 * Flow:
 * 1. Connect to MongoDB
 * 2. Clear collections (first run only)
 * 3. Create ProductMaster entries
 * 4. Generate ProductVariant combinations
 * 5. Auto-create Inventory entries
 * 6. Verify data integrity
 * 7. Output detailed logging
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ProductMaster = require('./models/ProductMaster');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');

// ============================================================
// CONFIGURATION
// ============================================================

const PRODUCT_CONFIG = {
  maplitho: {
    name: 'Maplitho',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 90, 120],
    category: 'Standard Envelope',
    description: 'Maplitho paper - High quality printing medium'
  },
  buff: {
    name: 'Buff',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 100],
    category: 'Standard Envelope',
    description: 'Buff paper - Durable and economical'
  },
  kraft: {
    name: 'Kraft',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [50],
    category: 'Standard Envelope',
    description: 'Kraft paper - Strong and natural'
  },
  cloth: {
    name: 'Cloth Cover',
    hasGSM: false,
    hasSize: true,
    hasColor: false,
    gsmOptions: [],
    category: 'Cloth Cover',
    description: 'Cloth covers for premium envelopes'
  },
  vibhoothi: {
    name: 'Vibhoothi',
    hasGSM: false,
    hasSize: false,
    hasColor: true,
    gsmOptions: [],
    colorOptions: ['White', 'Colour'],
    category: 'Specialty',
    description: 'Vibhoothi specialized covers'
  }
};

const SIZES = [
  '6.25x4.25',
  '7.25x5.25',
  '7.25x4.25',
  '9x4',
  '9.25x4.25',
  '10.25x4.25',
  '11x5',
  '9x6',
  '12x5',
  '9x7',
  '9x6.25',
  '10x8',
  '10.25x8.25',
  '11.25x8.25',
  '12x9.25',
  '12x10',
  '13x10',
  '15x11',
  '16x12',
  '18x14',
  '20x16'
];

// ============================================================
// LOGGING UTILITIES
// ============================================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  header: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
  subheader: (msg) => console.log(`\n── ${msg}`)
};

// ============================================================
// MAIN SEED PROCESS
// ============================================================

async function seedComprehensive() {
  let session;
  let stats = {
    productsCreated: 0,
    variantsCreated: 0,
    inventoryCreated: 0,
    duplicatesSkipped: 0,
    errors: 0
  };

  try {
    // ===== STEP 1: Connect to MongoDB =====
    log.header('STEP 1: Connecting to MongoDB');
    
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/swamy-envelopes';
    log.info(`Connecting to: ${mongoUrl}`);

    await mongoose.connect(mongoUrl);
    log.success('Connected to MongoDB');

    // ===== STEP 2: Check for existing data =====
    log.header('STEP 2: Checking Existing Data');
    
    const existingProducts = await ProductMaster.countDocuments();
    const existingVariants = await ProductVariant.countDocuments();
    const existingInventory = await Inventory.countDocuments();

    log.info(`Existing ProductMasters: ${existingProducts}`);
    log.info(`Existing ProductVariants: ${existingVariants}`);
    log.info(`Existing Inventory entries: ${existingInventory}`);

    // If data exists, verify integrity instead of recreating
    if (existingProducts > 0) {
      log.warning('Data already exists - running in VERIFY mode');
      await verifyDataIntegrity();
      return;
    }

    // ===== STEP 3: Create ProductMaster entries =====
    log.header('STEP 3: Creating ProductMaster Entries');

    const productMasters = {};

    for (const [key, config] of Object.entries(PRODUCT_CONFIG)) {
      try {
        // Check if product already exists
        const existing = await ProductMaster.findOne({ name: config.name });
        if (existing) {
          log.warning(`Product '${config.name}' already exists, skipping...`);
          productMasters[key] = existing;
          continue;
        }

        // Create new product
        const product = new ProductMaster({
          name: config.name,
          hasGSM: config.hasGSM,
          hasSize: config.hasSize,
          hasColor: config.hasColor,
          gsmOptions: config.gsmOptions || [],
          sizeOptions: config.hasSize ? SIZES : [],
          colorOptions: config.colorOptions || [],
          category: config.category,
          description: config.description,
          isActive: true
        });

        await product.save();
        productMasters[key] = product;
        stats.productsCreated++;
        log.success(`Created: ${config.name} (ID: ${product._id})`);
      } catch (err) {
        log.error(`Failed to create ${config.name}: ${err.message}`);
        stats.errors++;
      }
    }

    if (stats.productsCreated === 0) {
      throw new Error('No products were created');
    }

    // ===== STEP 4: Generate ProductVariants =====
    log.header('STEP 4: Generating ProductVariants');

    // Note: Using direct saves without transaction (for standalone MongoDB)
    // Session still created for future replica set support

    // Maplitho variants
    log.subheader('Generating Maplitho variants...');
    stats.variantsCreated += await generateVariants(
      productMasters.maplitho,
      SIZES,
      [80, 90, 120],
      undefined,
      null,
      stats
    );

    // Buff variants
    log.subheader('Generating Buff variants...');
    stats.variantsCreated += await generateVariants(
      productMasters.buff,
      SIZES,
      [80, 100],
      undefined,
      null,
      stats
    );

    // Kraft variants
    log.subheader('Generating Kraft variants...');
    stats.variantsCreated += await generateVariants(
      productMasters.kraft,
      SIZES,
      [50],
      undefined,
      null,
      stats
    );

    // Cloth Cover variants
    log.subheader('Generating Cloth Cover variants...');
    stats.variantsCreated += await generateVariants(
      productMasters.cloth,
      SIZES,
      undefined,
      undefined,
      null,
      stats
    );

    // Vibhoothi variants
    log.subheader('Generating Vibhoothi variants...');
    stats.variantsCreated += await generateVariants(
      productMasters.vibhoothi,
      undefined,
      undefined,
      ['White', 'Colour'],
      null,
      stats
    );

    log.success('All variants generated successfully');

    // ===== STEP 5: Verify System Integrity =====
    log.header('STEP 5: Verifying System Integrity');

    await verifyDataIntegrity();

    // ===== STEP 6: Final Report =====
    log.header('SEEDING COMPLETE - FINAL REPORT');
    console.table({
      'Products Created': stats.productsCreated,
      'Variants Created': stats.variantsCreated,
      'Inventory Entries': stats.inventoryCreated,
      'Duplicates Skipped': stats.duplicatesSkipped,
      'Errors': stats.errors
    });

    const totalMasters = await ProductMaster.countDocuments();
    const totalVariants = await ProductVariant.countDocuments();
    const totalInventory = await Inventory.countDocuments();

    log.success(`Total ProductMasters: ${totalMasters}`);
    log.success(`Total ProductVariants: ${totalVariants}`);
    log.success(`Total Inventory Entries: ${totalInventory}`);

    if (totalVariants === totalInventory && stats.errors === 0) {
      log.success('🎉 SYSTEM PERFECTLY SYNCHRONIZED!');
    } else {
      log.warning(`⚠️  Sync issue: ${totalVariants} variants vs ${totalInventory} inventory entries`);
    }

    log.info('\n✨ Seed completed successfully! Your system is ready to use.');

  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    if (session) {
      session.endSession();
    }
    await mongoose.disconnect();
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate variants for a product with combinations
 */
async function generateVariants(product, sizes, gsms, colors, session, stats) {
  let created = 0;

  try {
    // Vibhoothi case (colors only)
    if (colors && !sizes && !gsms) {
      for (const color of colors) {
        created += await createVariantAndInventory(
          product,
          null, // size
          null, // gsm
          color,
          session,
          stats
        );
      }
      return created;
    }

    // Standard case (sizes × gsms)
    if (sizes && gsms) {
      for (const size of sizes) {
        for (const gsm of gsms) {
          created += await createVariantAndInventory(
            product,
            size,
            gsm,
            null, // color
            session,
            stats
          );
        }
      }
      return created;
    }

    // Cloth case (sizes only)
    if (sizes && !gsms && !colors) {
      for (const size of sizes) {
        created += await createVariantAndInventory(
          product,
          size,
          null, // gsm
          null, // color
          session,
          stats
        );
      }
      return created;
    }

    return created;
  } catch (err) {
    log.error(`Error generating variants: ${err.message}`);
    stats.errors++;
    return 0;
  }
}

/**
 * Create a single variant and its inventory entry
 */
async function createVariantAndInventory(product, size, gsm, color, session, stats) {
  try {
    // Check if variant already exists
    let query = { productId: product._id };
    if (product.hasGSM && gsm !== null) query.gsm = gsm;
    if (product.hasSize && size !== null) query.size = size;
    if (product.hasColor && color !== null) query.color = color;

    const existing = await ProductVariant.findOne(query);
    if (existing) {
      stats.duplicatesSkipped++;
      return 0;
    }

    // Generate display name
    const displayParts = [product.name];
    if (size) displayParts.push(size);
    if (gsm) displayParts.push(`${gsm}GSM`);
    if (color) displayParts.push(color);
    const displayName = displayParts.join(' | ');

    // Create variant
    const variant = new ProductVariant({
      productId: product._id,
      gsm: gsm || null,
      size: size || null,
      color: color || null,
      hasGSM: product.hasGSM,
      hasSize: product.hasSize,
      displayName,
      isActive: true
    });

    await variant.save();

    // Auto-create Inventory entry
    const inventory = new Inventory({
      variantId: variant._id,
      quantity: 0,
      price: 0,
      minimumStockLevel: 50,
      isActive: true
    });

    await inventory.save();

    stats.inventoryCreated++;
    log.info(`  ✓ ${displayName}`);

    return 1;
  } catch (err) {
    log.error(`Error creating variant: ${err.message}`);
    stats.errors++;
    return 0;
  }
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity() {
  log.subheader('Data Integrity Verification');

  try {
    // Check 1: Each variant has inventory
    const variants = await ProductVariant.find({ isActive: true });
    let variantsWithoutInventory = 0;

    for (const variant of variants) {
      const inv = await Inventory.findOne({ variantId: variant._id });
      if (!inv) {
        log.warning(`Missing inventory for variant ${variant._id}`);
        variantsWithoutInventory++;
      }
    }

    if (variantsWithoutInventory === 0) {
      log.success(`✓ All ${variants.length} variants have inventory entries`);
    } else {
      log.error(`✗ ${variantsWithoutInventory} variants missing inventory`);
    }

    // Check 2: Duplic check
    const duplicates = await ProductVariant.aggregate([
      { $group: { _id: { productId: '$productId', size: '$size', gsm: '$gsm', color: '$color' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length === 0) {
      log.success('✓ No duplicate variants found');
    } else {
      log.error(`✗ Found ${duplicates.length} duplicate variant combinations`);
    }

    // Check 3: Count breakdown
    const products = await ProductMaster.find({ isActive: true });
    log.info('\nProduct breakdown:');
    for (const product of products) {
      const variantCount = await ProductVariant.countDocuments({ productId: product._id, isActive: true });
      const inventoryCount = await Inventory.countDocuments({ 
        variantId: { $in: (await ProductVariant.find({ productId: product._id, isActive: true }).select('_id')).map(v => v._id) }
      });
      log.info(`  ${product.name}: ${variantCount} variants, ${inventoryCount} inventory`);
    }

  } catch (err) {
    log.error(`Error during verification: ${err.message}`);
  }
}

// ============================================================
// EXECUTE
// ============================================================

if (require.main === module) {
  seedComprehensive().then(() => {
    process.exit(0);
  }).catch(err => {
    log.error(`Seed failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = seedComprehensive;
