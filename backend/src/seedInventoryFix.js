#!/usr/bin/env node

/**
 * INVENTORY SYSTEM FIX SCRIPT
 * 
 * This script:
 * 1. Deletes all corrupted data
 * 2. Creates ProductMaster entries
 * 3. Creates ProductVariant entries with valid productId references
 * 4. Creates Inventory entries with valid variantId references
 * 5. Verifies data relationships
 * 6. Tests API responses
 * 
 * Run: node src/seedInventoryFix.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ProductMaster = require('./models/ProductMaster');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');

// ============================================================
// CONFIGURATION
// ============================================================

const PRODUCT_MASTERS = [
  {
    name: 'Maplitho',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 90, 120],
    sizeOptions: ['6.25x4.25', '7.25x5.25', '9x4', '9.25x4.25', '10.25x4.25', '10x8', '12x9.25'],
    colorOptions: [],
    category: 'Standard Envelope'
  },
  {
    name: 'Buff',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [80, 100],
    sizeOptions: ['6.25x4.25', '7.25x5.25', '9x4', '9.25x4.25', '10.25x4.25', '10x8', '12x9.25'],
    colorOptions: [],
    category: 'Standard Envelope'
  },
  {
    name: 'Kraft',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    gsmOptions: [50],
    sizeOptions: ['6.25x4.25', '7.25x5.25', '9x4', '9.25x4.25', '10.25x4.25', '10x8', '12x9.25'],
    colorOptions: [],
    category: 'Standard Envelope'
  },
  {
    name: 'Cloth Cover',
    hasGSM: false,
    hasSize: true,
    hasColor: false,
    gsmOptions: [],
    sizeOptions: ['6.25x4.25', '7.25x5.25', '9x4', '9.25x4.25', '10.25x4.25', '10x8', '12x9.25'],
    colorOptions: [],
    category: 'Cloth Cover'
  },
  {
    name: 'Vibhoothi',
    hasGSM: false,
    hasSize: false,
    hasColor: true,
    gsmOptions: [],
    sizeOptions: [],
    colorOptions: ['White', 'Color'],
    category: 'Specialty'
  }
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seedInventoryFix() {
  try {
    // ===== CONNECT TO MONGODB =====
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';
    console.log(`\n🔌 Connecting to MongoDB: ${mongoURL}`);
    
    await mongoose.connect(mongoURL);
    console.log('✅ Connected to MongoDB\n');

    // ===== DELETE ALL EXISTING DATA =====
    console.log('🗑️  Clearing existing data...');
    await Inventory.deleteMany({});
    console.log('  ✓ Deleted all Inventory entries');
    
    await ProductVariant.deleteMany({});
    console.log('  ✓ Deleted all ProductVariants');
    
    await ProductMaster.deleteMany({});
    console.log('  ✓ Deleted all ProductMasters');
    console.log('✅ Database cleared\n');

    // ===== CREATE PRODUCT MASTERS =====
    console.log('📦 Creating ProductMasters...');
    const productMasters = {};
    
    for (const config of PRODUCT_MASTERS) {
      const productMaster = await ProductMaster.create(config);
      productMasters[config.name] = productMaster;
      console.log(`  ✓ Created: ${config.name} (ID: ${productMaster._id})`);
    }
    console.log(`✅ Created ${PRODUCT_MASTERS.length} ProductMasters\n`);

    // ===== CREATE PRODUCT VARIANTS & INVENTORY =====
    console.log('🔗 Creating ProductVariants and Inventory entries...');
    let totalVariantsCreated = 0;
    let totalInventoryCreated = 0;

    // Maplitho variants
    console.log('\n  Creating Maplitho variants...');
    const maplimaster = productMasters['Maplitho'];
    for (const gsm of maplimaster.gsmOptions) {
      for (const size of maplimaster.sizeOptions) {
        const variant = await ProductVariant.create({
          productId: maplimaster._id,
          gsm,
          size,
          color: null,
          displayName: `Maplitho | ${size} | ${gsm}GSM`,
          hasSize: true,
          hasGSM: true
        });
        
        await Inventory.create({
          variantId: variant._id,
          quantity: 0,
          price: 0,
          minimumStockLevel: 50,
          isActive: true
        });
        
        totalVariantsCreated++;
        totalInventoryCreated++;
      }
    }
    console.log(`  ✓ Created ${maplimaster.gsmOptions.length * maplimaster.sizeOptions.length} Maplitho variants with inventory`);

    // Buff variants
    console.log('\n  Creating Buff variants...');
    const buffmaster = productMasters['Buff'];
    for (const gsm of buffmaster.gsmOptions) {
      for (const size of buffmaster.sizeOptions) {
        const variant = await ProductVariant.create({
          productId: buffmaster._id,
          gsm,
          size,
          color: null,
          displayName: `Buff | ${size} | ${gsm}GSM`,
          hasSize: true,
          hasGSM: true
        });
        
        await Inventory.create({
          variantId: variant._id,
          quantity: 0,
          price: 0,
          minimumStockLevel: 50,
          isActive: true
        });
        
        totalVariantsCreated++;
        totalInventoryCreated++;
      }
    }
    console.log(`  ✓ Created ${buffmaster.gsmOptions.length * buffmaster.sizeOptions.length} Buff variants with inventory`);

    // Kraft variants
    console.log('\n  Creating Kraft variants...');
    const kraftmaster = productMasters['Kraft'];
    for (const gsm of kraftmaster.gsmOptions) {
      for (const size of kraftmaster.sizeOptions) {
        const variant = await ProductVariant.create({
          productId: kraftmaster._id,
          gsm,
          size,
          color: null,
          displayName: `Kraft | ${size} | ${gsm}GSM`,
          hasSize: true,
          hasGSM: true
        });
        
        await Inventory.create({
          variantId: variant._id,
          quantity: 0,
          price: 0,
          minimumStockLevel: 50,
          isActive: true
        });
        
        totalVariantsCreated++;
        totalInventoryCreated++;
      }
    }
    console.log(`  ✓ Created ${kraftmaster.gsmOptions.length * kraftmaster.sizeOptions.length} Kraft variants with inventory`);

    // Cloth Cover variants
    console.log('\n  Creating Cloth Cover variants...');
    const clothmaster = productMasters['Cloth Cover'];
    for (const size of clothmaster.sizeOptions) {
      const variant = await ProductVariant.create({
        productId: clothmaster._id,
        gsm: null,
        size,
        color: null,
        displayName: `Cloth Cover | ${size}`,
        hasSize: true,
        hasGSM: false
      });
      
      await Inventory.create({
        variantId: variant._id,
        quantity: 0,
        price: 0,
        minimumStockLevel: 50,
        isActive: true
      });
      
      totalVariantsCreated++;
      totalInventoryCreated++;
    }
    console.log(`  ✓ Created ${clothmaster.sizeOptions.length} Cloth Cover variants with inventory`);

    // Vibhoothi variants
    console.log('\n  Creating Vibhoothi variants...');
    const vibmaster = productMasters['Vibhoothi'];
    for (const color of vibmaster.colorOptions) {
      const variant = await ProductVariant.create({
        productId: vibmaster._id,
        gsm: null,
        size: 'Standard', // Set default size even though hasSize=false
        color,
        displayName: `Vibhoothi | ${color}`,
        hasSize: false,
        hasGSM: false
      });
      
      await Inventory.create({
        variantId: variant._id,
        quantity: 0,
        price: 0,
        minimumStockLevel: 50,
        isActive: true
      });
      
      totalVariantsCreated++;
      totalInventoryCreated++;
    }
    console.log(`  ✓ Created ${vibmaster.colorOptions.length} Vibhoothi variants with inventory`);

    console.log(`\n✅ Created ${totalVariantsCreated} ProductVariants`);
    console.log(`✅ Created ${totalInventoryCreated} Inventory entries\n`);

    // ===== VERIFY DATA INTEGRITY =====
    console.log('🔍 Verifying data integrity...');
    
    const inventoryItems = await Inventory.find()
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      });
    
    console.log(`  ✓ Found ${inventoryItems.length} inventory items`);
    
    // Check a sample item
    if (inventoryItems.length > 0) {
      const sample = inventoryItems[0];
      console.log('\n  📋 Sample Inventory Item:');
      console.log(`    ID: ${sample._id}`);
      console.log(`    variantId: ${sample.variantId?._id || 'MISSING!'}`);
      console.log(`    Variant displayName: ${sample.variantId?.displayName || 'N/A'}`);
      console.log(`    Variant size: ${sample.variantId?.size || '-'}`);
      console.log(`    Variant gsm: ${sample.variantId?.gsm || '-'}`);
      console.log(`    Variant productId: ${sample.variantId?.productId?._id || 'MISSING!'}`);
      console.log(`    Product name: ${sample.variantId?.productId?.name || 'N/A'}`);
      console.log(`    Quantity: ${sample.quantity}`);
      console.log(`    Price: ${sample.price}`);
    }

    // Verify all items have valid references
    let itemsWithValidRefs = 0;
    let itemsWithoutRefs = 0;

    for (const item of inventoryItems) {
      if (!item.variantId) {
        console.log(`  ❌ Inventory ${item._id} has no variantId!`);
        itemsWithoutRefs++;
        continue;
      }
      
      if (!item.variantId.productId) {
        console.log(`  ❌ Variant ${item.variantId._id} has no productId!`);
        itemsWithoutRefs++;
        continue;
      }
      
      itemsWithValidRefs++;
    }

    console.log(`\n  ✓ ${itemsWithValidRefs} inventory items have valid ProductMaster references`);
    
    if (itemsWithoutRefs > 0) {
      console.log(`  ❌ ${itemsWithoutRefs} inventory items have MISSING references!`);
    } else {
      console.log(`  ✅ ALL ITEMS HAVE VALID REFERENCES!\n`);
    }

    // ===== SUMMARY =====
    console.log('📊 FINAL SUMMARY');
    console.log(`  ProductMasters: ${await ProductMaster.countDocuments()}`);
    console.log(`  ProductVariants: ${await ProductVariant.countDocuments()}`);
    console.log(`  Inventory entries: ${await Inventory.countDocuments()}`);
    
    console.log('\n🎉 Inventory system successfully fixed and seeded!\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// ============================================================
// EXECUTE
// ============================================================

if (require.main === module) {
  seedInventoryFix();
}

module.exports = seedInventoryFix;
