require('dotenv').config();
const mongoose = require('mongoose');
const Envelope = require('./models/Envelope');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';

// ============ PREDEFINED PRODUCT DATA ============

const ENVELOPE_SIZES = [
  "6.25x4.25",
  "7.25x5.25",
  "7.25x4.25",
  "9x4",
  "9.25x4.25",
  "10.25x4.25",
  "11x5",
  "9x6",
  "12x5",
  "9x7",
  "9x6.25",
  "10x8",
  "10.25x8.25",
  "11.25x8.25",
  "12x9.25",
  "12x10",
  "13x10",
  "15x11",
  "16x12",
  "18x14",
  "20x16"
];

const MATERIAL_TYPES = [
  "Maplitho 80 GSM",
  "Maplitho 90 GSM",
  "Maplitho 120 GSM",
  "Buff 80 GSM",
  "Buff 100 GSM",
  "Kraft 90 GSM",
  "Colour 80 GSM",
  "Cloth Cover",
  "Vibothi Cover White",
  "Vibothi Cover Color"
];

// Helper to extract GSM from material type
const extractGSM = (materialType) => {
  const gsmMatch = materialType.match(/(\d+)\s*GSM/i);
  return gsmMatch ? parseInt(gsmMatch[1], 10) : null;
};

// Helper to extract color from material type
const getColor = (materialType) => {
  if (materialType.includes("Vibothi")) {
    if (materialType.includes("White")) return "White";
    if (materialType.includes("Color")) return "Color";
  }
  return null;
};

// ============ GENERATE ALL PRODUCT COMBINATIONS ============

const generateProducts = () => {
  const products = [];
  const seen = new Set();

  for (const size of ENVELOPE_SIZES) {
    for (const materialType of MATERIAL_TYPES) {
      const gsm = extractGSM(materialType);
      const color = getColor(materialType);
      
      // Create unique key to prevent duplicates
      const key = `${size}|${materialType}`;
      
      if (seen.has(key)) {
        console.log(`⚠️  Skipping duplicate: ${key}`);
        continue;
      }
      
      seen.add(key);
      
      products.push({
        size,
        materialType,
        gsm,
        color,
        price: 0,        // IMPORTANT: Initialize to 0
        quantity: 0,     // IMPORTANT: Initialize to 0
        isActive: true
      });
    }
  }
  
  return products;
};

// ============ SEED DATABASE ============

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Generate all product combinations
    const products = generateProducts();
    console.log(`\n📦 Generated ${products.length} product combinations`);
    console.log(`   Sizes: ${ENVELOPE_SIZES.length}`);
    console.log(`   Materials: ${MATERIAL_TYPES.length}`);
    console.log(`   Expected combinations: ${ENVELOPE_SIZES.length * MATERIAL_TYPES.length}`);

    // Option 1: Drop existing collection and start fresh
    console.log('\n🗑️  Clearing existing products...');
    await Envelope.deleteMany({});
    console.log('✅ Cleared existing products');

    // Option 2: Insert with error handling for duplicates
    console.log('\n📥 Inserting products...');
    let inserted = 0;
    let duplicates = 0;

    for (const product of products) {
      try {
        // Check if product already exists
        const exists = await Envelope.findOne({
          size: product.size,
          materialType: product.materialType
        });

        if (!exists) {
          await Envelope.create(product);
          inserted++;
        } else {
          duplicates++;
        }
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error
          duplicates++;
        } else {
          console.error(`❌ Error inserting product ${product.size} | ${product.materialType}:`, err.message);
        }
      }
    }

    console.log(`✅ Seeding complete:`);
    console.log(`   Inserted: ${inserted} new products`);
    console.log(`   Duplicates skipped: ${duplicates}`);
    console.log(`   Total in database: ${await Envelope.countDocuments()}`);

    // Verify unique index
    console.log('\n🔍 Verifying unique index...');
    const duplicateCheck = await Envelope.aggregate([
      {
        $group: {
          _id: { size: '$size', materialType: '$materialType' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateCheck.length === 0) {
      console.log('✅ No duplicates found (Index is working!)');
    } else {
      console.log(`⚠️  ${duplicateCheck.length} duplicates found:`);
      duplicateCheck.forEach(dup => {
        console.log(`   ${dup._id.size} | ${dup._id.materialType}: ${dup.count} copies`);
      });
    }

    // Show sample of seeded products
    console.log('\n📋 Sample Products:');
    const samples = await Envelope.find().limit(10);
    samples.forEach((prod, idx) => {
      console.log(`   ${idx + 1}. ${prod.size} | ${prod.materialType} (GSM: ${prod.gsm || 'N/A'}, Color: ${prod.color || 'N/A'}, Price: ₹${prod.price}, Qty: ${prod.quantity})`);
    });

    mongoose.connection.close();
    console.log('\n✅ Database seeded successfully and connection closed');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

// Run seed
seedDB();
