require('dotenv').config();
const mongoose = require('mongoose');

const Inventory = require('./src/models/Inventory');

async function analyzeInventory() {
  try {
    console.log('🔍 Analyzing Inventory Database...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope');
    
    // Total inventory items
    const totalItems = await Inventory.countDocuments({});
    console.log(`📦 Total Inventory Items: ${totalItems}`);
    
    // Items with quantity < 50 (low stock)
    const lowStockItems = await Inventory.countDocuments({ quantity: { $lt: 50 } });
    console.log(`⚠️  Items with quantity < 50: ${lowStockItems}`);
    
    // Items with quantity = 0 (out of stock)
    const outOfStockItems = await Inventory.countDocuments({ quantity: 0 });
    console.log(`❌ Items with quantity = 0: ${outOfStockItems}`);
    
    // Items with quantity > 50 (good stock)
    const goodStockItems = await Inventory.countDocuments({ quantity: { $gte: 50 } });
    console.log(`✅ Items with quantity >= 50: ${goodStockItems}`);
    
    // Check for duplicates (same variantId)
    const duplicateVariants = await Inventory.aggregate([
      { $group: { _id: '$variantId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log(`\n🔄 Duplicate Variants Found: ${duplicateVariants.length}`);
    if (duplicateVariants.length > 0) {
      console.log('   Duplicate variant IDs:', duplicateVariants.slice(0, 5));
    }
    
    // Check price issues
    const zeroPriceItems = await Inventory.countDocuments({ price: 0 });
    console.log(`\n💰 Items with price = 0: ${zeroPriceItems}`);
    
    // Inactive items
    const inactiveItems = await Inventory.countDocuments({ isActive: false });
    console.log(`🔒 Inactive Items: ${inactiveItems}`);
    
    // Sample low stock items
    console.log('\n📋 Sample Low Stock Items (first 5):');
    const samples = await Inventory.find({ quantity: { $lt: 50 } })
      .populate('variantId')
      .limit(5);
    
    samples.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.variantId?.displayName || 'N/A'} - Qty: ${item.quantity}, Price: ₹${item.price}`);
    });
    
    // Suggest cleanup action
    console.log('\n🛠️  RECOMMENDATION:');
    if (lowStockItems > 100) {
      console.log('   ⚠️  Too many low-stock items. Possible data issue.');
      console.log('   Consider clearing and re-seeding the database.');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

analyzeInventory();
