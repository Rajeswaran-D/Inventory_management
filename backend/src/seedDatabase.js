/**
 * SEED SCRIPT - SIMPLIFIED PRODUCT & INVENTORY SYSTEM
 * 
 * Generates all product combinations (variants) based on:
 * - Product type
 * - GSM (if applicable)
 * - Size (if applicable)
 * - Color (if applicable)
 * 
 * Then creates inventory records with quantity=0, price=0
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const { generateAllCombinations, getProductByName } = require('./data/productDefinitions');

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing products and inventory...');
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    console.log('✅ Database cleared');

    // Generate all combinations
    console.log('\n📦 Generating product combinations...');
    const combinations = generateAllCombinations();
    console.log(`✅ Generated ${combinations.length} combinations\n`);

    // Create products and inventory
    let totalCreated = 0;
    let totalSkipped = 0;
    const createdProducts = {};

    for (const combo of combinations) {
      try {
        // Get product details
        const productDef = getProductByName(combo.productName);
        const sku = generateSKU(combo);

        // Check if product already exists
        const existing = await Product.findOne({
          productId: combo.productId,
          gsm: combo.gsm,
          size: combo.size,
          color: combo.color
        });

        if (existing) {
          totalSkipped++;
          continue;
        }

        // Create product document
        const product = new Product({
          productId: combo.productId,
          productName: combo.productName,
          gsm: combo.gsm,
          size: combo.size,
          color: combo.color,
          displayName: combo.displayName,
          sku: sku,
          isActive: true
        });

        const savedProduct = await product.save();
        createdProducts[combo.productId] = savedProduct;

        // Create inventory record
        const inventory = new Inventory({
          productId: savedProduct._id,
          quantity: 0,
          price: 0,
          minimumStockLevel: 50,
          isActive: true
        });

        await inventory.save();
        totalCreated++;

        // Print progress
        if (totalCreated % 20 === 0) {
          console.log(`📝 Created ${totalCreated}/${combinations.length} products...`);
        }
      } catch (err) {
        if (err.code === 11000) {
          totalSkipped++;
        } else {
          console.error(`❌ Error creating product:`, err.message);
        }
      }
    }

    console.log(`\n✅ Successfully created ${totalCreated} products with inventory records`);
    console.log(`⚠️  Skipped ${totalSkipped} duplicates`);

    // Print summary
    printSummary(combinations);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate SKU for a product combination
 * Format: PROD-GSM-SIZE-COLOR
 * Example: MAP-80-614-W (Maplitho, 80GSM, 6.25x4.25, White)
 */
function generateSKU(combo) {
  const productCode = getProductCode(combo.productId);
  const gsmPart = combo.gsm ? `${combo.gsm}` : 'XX';
  const sizePart = combo.size ? combo.size.replace(/x/, '') : 'XX';
  const colorPart = combo.color ? combo.color.charAt(0) : 'X';

  return `${productCode}-${gsmPart}-${sizePart}-${colorPart}`.toUpperCase();
}

/**
 * Get 3-letter product code
 */
function getProductCode(productId) {
  const codes = {
    maplitho: 'MAP',
    buff: 'BUF',
    kraft: 'KRA',
    cloth_cover: 'CLO',
    vibhoothi: 'VIB'
  };
  return codes[productId] || 'UNK';
}

/**
 * Print summary of created products
 */
function printSummary(combinations) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 PRODUCT SUMMARY');
  console.log('='.repeat(70));

  const byProduct = {};
  for (const combo of combinations) {
    if (!byProduct[combo.productName]) {
      byProduct[combo.productName] = [];
    }
    byProduct[combo.productName].push(combo);
  }

  for (const [productName, items] of Object.entries(byProduct)) {
    console.log(`\n${productName}:`);
    console.log(`  Total variants: ${items.length}`);

    const gsms = [...new Set(items.map(i => i.gsm).filter(g => g))];
    const sizes = [...new Set(items.map(i => i.size).filter(s => s))];
    const colors = [...new Set(items.map(i => i.color).filter(c => c))];

    if (gsms.length > 0) console.log(`  GSM options: ${gsms.join(', ')}`);
    if (sizes.length > 0) console.log(`  Size options: ${sizes.length} sizes`);
    if (colors.length > 0) console.log(`  Color options: ${colors.join(', ')}`);
  }

  console.log('\n' + '='.repeat(70));
}

// ============================================================================
// RUN SEED
// ============================================================================

seedDatabase();
