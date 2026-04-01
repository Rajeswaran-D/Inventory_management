#!/usr/bin/env node

/**
 * INVENTORY FIX - MIGRATION SCRIPT
 * Drops problematic indexes and resets collections
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';
    console.log(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(mongoURL);
    console.log('✅ Connected\n');

    // Get the database
    const db = mongoose.connection.db;

    // Drop indexes on Inventory collection
    console.log('🔧 Removing problematic indexes...');
    try {
      const indexInfo = await db.collection('inventories').getIndexes();
      console.log('  Current indexes:', Object.keys(indexInfo));
      
      // Drop productId index if it exists
      if (indexInfo['productId_1']) {
        await db.collection('inventories').dropIndex('productId_1');
        console.log('  ✓ Dropped productId index');
      }
      
      // Drop all indexes except _id
      for (const indexName in indexInfo) {
        if (indexName !== '_id_') {
          try {
            await db.collection('inventories').dropIndex(indexName);
            console.log(`  ✓ Dropped ${indexName}`);
          } catch (e) {
            // Ignore errors for non-existent indexes
          }
        }
      }
    } catch (err) {
      console.log('  (No indexes to drop or collection doesn\'t exist yet)');
    }

    // Drop collections
    console.log('\n🗑️  Dropping collections...');
    try {
      await db.collection('inventories').drop();
      console.log('  ✓ Dropped inventories');
    } catch (e) {
      console.log('  (inventories collection doesn\'t exist)');
    }

    try {
      await db.collection('productvariants').drop();
      console.log('  ✓ Dropped productvariants');
    } catch (e) {
      console.log('  (productvariants collection doesn\'t exist)');
    }

    try {
      await db.collection('productmasters').drop();
      console.log('  ✓ Dropped productmasters');
    } catch (e) {
      console.log('  (productmasters collection doesn\'t exist)');
    }

    console.log('\n✅ Database reset complete!\n');
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  }
}

fixDatabase();
