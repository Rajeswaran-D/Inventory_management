/**
 * Seed script to initialize ProductMaster with product configurations
 * Run with: node src/seedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ProductMaster = require('./models/ProductMaster');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';

const productData = [
  {
    name: 'Maplitho',
    hasGSM: true,
    hasSize: true,
    hasColor: true,
    category: 'Standard Envelope',
    description: 'Standard Maplitho envelope',
    gsmOptions: [60, 70, 80, 90, 100, 110, 120],
    sizeOptions: [
      '6.25x4.25',
      '7.5x4.5',
      '7.25x5.25',
      '9x4',
      '9.5x4.25',
      '10.5x4.5',
      '11x5',
      '9x6',
      '12x5',
      '9x7',
      '9x6.5',
      '10x8',
      '10.25x8.25',
      '11.5x8.75',
      '12x9.5',
      '12x10',
      '13x10',
      '15x11',
      '16x12',
      '18x14',
      '20x16'
    ],
    colorOptions: ['White', 'Color']
  },
  {
    name: 'Buff',
    hasGSM: true,
    hasSize: true,
    hasColor: true,
    category: 'Standard Envelope',
    description: 'Buff colored envelope',
    gsmOptions: [60, 70, 80, 90, 100, 110, 120],
    sizeOptions: [
      '6.25x4.25',
      '7.5x4.5',
      '7.25x5.25',
      '9x4',
      '9.5x4.25',
      '10.5x4.5',
      '11x5',
      '9x6',
      '12x5',
      '9x7',
      '9x6.5',
      '10x8',
      '10.25x8.25',
      '11.5x8.75',
      '12x9.5',
      '12x10',
      '13x10',
      '15x11',
      '16x12',
      '18x14',
      '20x16'
    ],
    colorOptions: ['White', 'Color']
  },
  {
    name: 'Kraft',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    category: 'Standard Envelope',
    description: 'Kraft paper envelope',
    gsmOptions: [75, 80, 90, 100],
    sizeOptions: [
      '6.25x4.25',
      '7.5x4.5',
      '9x4',
      '9x6',
      '10x8',
      '12x9.5'
    ],
    colorOptions: ['Natural']
  },
  {
    name: 'Cloth Cover',
    hasGSM: false,
    hasSize: true,
    hasColor: true,
    category: 'Specialty',
    description: 'Cloth fabric cover',
    gsmOptions: [],
    sizeOptions: [
      '10x8',
      '12x9',
      '15x11',
      '18x14'
    ],
    colorOptions: ['White', 'Color', 'Natural']
  },
  {
    name: 'Vibhoothi',
    hasGSM: false,
    hasSize: false, // No size selection - always Standard
    hasColor: false,
    category: 'Specialty',
    description: 'Vibhoothi ash packet (fixed size)',
    gsmOptions: [],
    sizeOptions: ['Standard'], // Fixed to Standard
    colorOptions: []
  },
  {
    name: 'Handmade Love',
    hasGSM: false,
    hasSize: true,
    hasColor: true,
    category: 'Specialty',
    description: 'Handmade specialty envelope',
    gsmOptions: [],
    sizeOptions: ['10x8', '12x9', '15x11'],
    colorOptions: ['White', 'Color', 'Mixed']
  },
  {
    name: 'Premium Metallic',
    hasGSM: true,
    hasSize: true,
    hasColor: true,
    category: 'Specialty',
    description: 'Premium metallic finish envelope',
    gsmOptions: [120, 150],
    sizeOptions: ['9.5x4.25', '12x9.5', '15x11'],
    colorOptions: ['White', 'Color']
  }
];

async function seedProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing ProductMaster data...');
    await ProductMaster.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('📦 Inserting product configurations...');
    const inserted = await ProductMaster.insertMany(productData);
    console.log(`✅ Inserted ${inserted.length} products:`);
    
    inserted.forEach(product => {
      console.log(`  ✓ ${product.name}`);
      console.log(`    - GSM: ${product.hasGSM ? 'Yes' : 'No'}`);
      console.log(`    - Size: ${product.hasSize ? 'Yes' : 'No'}`);
      console.log(`    - Color: ${product.hasColor ? 'Yes' : 'No'}`);
    });

    console.log('\n🎉 Product seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create variants for each product using /api/products/variants');
    console.log('2. Add inventory records for each variant');
    console.log('3. Start using the dynamic product system in Billing and Inventory');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
