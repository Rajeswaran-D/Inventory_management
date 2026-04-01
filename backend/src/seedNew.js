/**
 * Seed Script - Reset and populate database with structured product data
 * Run: node src/seed.js
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import Envelope from "./models/Envelope.js";
import { generateAllProducts, formatProductName, MATERIAL_CONFIG } from "./config/productData.js";

config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/envelope_inventory";
    
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Step 1: Clear existing data
    console.log("\n🗑️  Clearing existing products...");
    const deletedCount = await Envelope.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.deletedCount} existing products`);

    // Step 2: Generate all products
    console.log("\n📦 Generating product combinations...");
    const products = generateAllProducts();
    console.log(`✅ Generated ${products.length} product combinations`);

    // Step 3: Insert products with error handling
    console.log("\n📥 Inserting products into database...");
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const created = await Envelope.create(product);
        inserted++;
        
        // Print progress every 50 products
        if (inserted % 50 === 0) {
          console.log(`   ✅ Inserted ${inserted} products...`);
        }
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          errors++;
          console.error(`❌ Error inserting product:`, err.message);
        }
      }
    }

    console.log(`\n📊 Insertion Results:`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Step 4: Verify unique index
    console.log("\n🔍 Verifying unique index...");
    const indexes = await Envelope.collection.getIndexes();
    const hasUniqueIndex = Object.values(indexes).some(
      (idx) => idx.unique && idx.key.size === 1 && idx.key.materialType === 1
    );
    
    if (hasUniqueIndex) {
      console.log("✅ Unique index verified");
    } else {
      console.log("⚠️  Creating unique index...");
      await Envelope.collection.createIndex({ size: 1, materialType: 1 }, { unique: true });
      console.log("✅ Unique index created");
    }

    // Step 5: Show statistics
    const totalCount = await Envelope.countDocuments();
    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total products: ${totalCount}`);

    // Count by material
    const materialStats = await Envelope.aggregate([
      { $group: { _id: "$materialType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log(`\n📋 Products by Material:`);
    materialStats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} products`);
    });

    // Step 6: Show sample products
    console.log("\n📦 Sample Products:");
    const samples = await Envelope.find().limit(5);
    samples.forEach((product, index) => {
      console.log(`   ${index + 1}. ${formatProductName(product)}`);
    });

    console.log("\n🎉 Seed script completed successfully!\n");

  } catch (error) {
    console.error("❌ Seed script failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run seed
seedDatabase();
