/**
 * Migration Script: Envelope → ProductVariant + Inventory
 * 
 * This script migrates data from the old Envelope model to the new
 * ProductMaster + ProductVariant + Inventory architecture.
 * 
 * Usage: node src/migrateEnvelopeToInventory.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Models
const ProductMaster = require('./models/ProductMaster');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');
const Envelope = require('./models/Envelope'); // Old model

async function migrateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope');
    console.log('✅ Connected to MongoDB');

    // Get all Envelope documents
    const envelopes = await Envelope.find({ isActive: true });
    console.log(`📦 Found ${envelopes.length} envelope records to migrate`);

    if (envelopes.length === 0) {
      console.log('ℹ️  No envelopes to migrate');
      await mongoose.disconnect();
      return;
    }

    // Group by product to get unique master records needed
    const productMasters = {};
    
    // Map material types to valid ProductMaster names
    const materialNameMap = {
      'Maplitho': 'Maplitho',
      'Buff': 'Buff',
      'Kraft': 'Kraft',
      'Cloth Cover': 'Cloth Cover',
      'Cloth Covers': 'Cloth Cover',  // Handle variant spelling
      'Vibhoothi': 'Vibhoothi',
      'Vibhoothi Covers': 'Vibhoothi'  // Handle variant spelling
    };

    for (const env of envelopes) {
      const validName = materialNameMap[env.materialType] || env.materialType;
      const key = validName;
      if (!productMasters[key]) {
        const isClothCover = validName === 'Cloth Cover';
        productMasters[key] = {
          name: validName,
          description: `${validName} envelopes`,
          category: isClothCover ? 'Cloth Cover' : 'Standard Envelope',
          fields: {
            size: { required: true, type: 'number' },
            materialType: { required: true, type: 'text' },
            gsm: { required: !isClothCover, type: 'number' }
          },
          isActive: true
        };
      }
    }

    console.log(`🔄 Processing ${Object.keys(productMasters).length} unique product types`);

    // Create ProductMaster records for legacy products
    const masterMap = {}; // Map original name to _id
    for (const [key, config] of Object.entries(productMasters)) {
      try {
        let master = await ProductMaster.findOne({ name: key });
        if (!master) {
          master = await ProductMaster.create(config);
          console.log(`📝 Created ProductMaster: ${key}`);
        } else {
          console.log(`✓ ProductMaster already exists: ${key}`);
        }
        masterMap[key] = master._id;
      } catch (err) {
        console.warn(`⚠️  Could not create ProductMaster for ${key}:`, err.message.substring(0, 150));
      }
    }

    console.log(`\n🔄 Migrating ${envelopes.length} envelope records...`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each envelope to ProductVariant + Inventory
    for (const env of envelopes) {
      try {
        // Map the original material type to the valid name
        const validMaterialName = materialNameMap[env.materialType] || env.materialType;
        const masterId = masterMap[validMaterialName];
        if (!masterId) {
          console.warn(`⚠️  Skipping: No master found for ${env.materialType} (mapped to ${validMaterialName})`);
          skippedCount++;
          continue;
        }

        // Check if variant already exists
        let variant = await ProductVariant.findOne({
          productId: masterId,
          gsm: env.gsm || null,
          size: env.size,
          color: null,
          isActive: true
        });

        if (!variant) {
          // Create variant
          variant = await ProductVariant.create({
            productId: masterId,
            gsm: env.gsm,
            size: env.size,
            color: null,
            hasGSM: env.gsm !== null && env.gsm !== undefined,
            hasSize: true
          });
          console.log(`✓ Created variant: ${variant.displayName}`);
        }

        // Check if inventory record already exists
        let inventory = await Inventory.findOne({
          variantId: variant._id,
          isActive: true
        });

        if (!inventory) {
          // Create inventory record
          inventory = await Inventory.create({
            variantId: variant._id,
            quantity: env.quantity || 0,
            price: env.price || 0,
            costPrice: env.costPrice || 0,
            minimumStockLevel: 50,
            reorderQuantity: 500,
            lastRestockedDate: new Date(),
            lastSaleDate: null,
            legacyEnvelopeId: env._id,
            isActive: true
          });
          console.log(`✓ Created inventory for: ${variant.displayName}`);
        } else {
          // Update existing inventory with legacy data
          inventory.quantity = env.quantity || 0;
          inventory.price = env.price || 0;
          inventory.costPrice = env.costPrice || 0;
          inventory.legacyEnvelopeId = env._id;
          await inventory.save();
          console.log(`✓ Updated inventory for: ${variant.displayName}`);
        }

        migratedCount++;
      } catch (err) {
        console.warn(`⚠️  Error migrating envelope ${env._id}:`, err.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   📦 Migrated: ${migratedCount} records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} records`);
    console.log(`   📊 Total: ${migratedCount + skippedCount} records`);

    // Summary statistics
    const variantCount = await ProductVariant.countDocuments({ isActive: true });
    const inventoryCount = await Inventory.countDocuments({ isActive: true });
    const masterCount = await ProductMaster.countDocuments({ isActive: true });

    console.log(`\n📈 Database Statistics:`);
    console.log(`   ProductMaster: ${masterCount}`);
    console.log(`   ProductVariant: ${variantCount}`);
    console.log(`   Inventory: ${inventoryCount}`);

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run: npm start (to start server)`);
    console.log(`   2. Update frontend to use new Inventory API`);
    console.log(`   3. Test Inventory page with dynamic products`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
migrateData();
