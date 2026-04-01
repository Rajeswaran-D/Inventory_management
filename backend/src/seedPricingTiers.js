/**
 * Seed Pricing Tiers
 * Creates example pricing tiers for bulk orders, wholesale, and seasonal sales
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PricingTier = require('./models/PricingTier');

async function seedPricingTiers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope');
    console.log('✅ Connected to MongoDB');

    // Clear existing tiers (optional)
    // await PricingTier.deleteMany({});
    // console.log('🗑️  Cleared existing pricing tiers');

    const exampleTiers = [
      // Volume-based tiers
      {
        name: 'Bulk Order 500+',
        description: 'Discount for orders of 500-999 units',
        tierType: 'volume',
        minQuantity: 500,
        maxQuantity: 999,
        discountType: 'percentage',
        discountValue: 5,
        priority: 100,
        isActive: true
      },
      {
        name: 'Bulk Order 1000+',
        description: 'Discount for orders of 1000-4999 units',
        tierType: 'volume',
        minQuantity: 1000,
        maxQuantity: 4999,
        discountType: 'percentage',
        discountValue: 10,
        priority: 110,
        isActive: true
      },
      {
        name: 'Mega Order 5000+',
        description: 'Discount for orders of 5000+ units',
        tierType: 'volume',
        minQuantity: 5000,
        maxQuantity: null,
        discountType: 'percentage',
        discountValue: 15,
        priority: 120,
        isActive: true
      },

      // Customer-based tiers
      {
        name: 'Wholesale Customer',
        description: 'Special pricing for wholesale partners',
        tierType: 'customer',
        customerType: 'wholesale',
        discountType: 'percentage',
        discountValue: 12,
        priority: 105,
        isActive: true
      },
      {
        name: 'Distributor Price',
        description: 'Exclusive pricing for authorized distributors',
        tierType: 'customer',
        customerType: 'distributors',
        discountType: 'percentage',
        discountValue: 20,
        priority: 130,
        isActive: true
      },

      // Seasonal/Promotional tiers
      {
        name: 'New Year Sale 2024',
        description: 'Limited time New Year promotion',
        tierType: 'seasonal',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        discountType: 'percentage',
        discountValue: 8,
        priority: 90,
        isActive: false  // Expired
      },

      // Fixed discount tier
      {
        name: 'Fixed ₹50 Discount',
        description: 'Flat ₹50 discount on all products',
        tierType: 'volume',
        minQuantity: 1000,
        discountType: 'fixed',
        discountValue: 50,
        priority: 80,
        isActive: true
      }
    ];

    // Insert or update tiers
    for (const tierData of exampleTiers) {
      const existing = await PricingTier.findOne({ name: tierData.name });
      if (!existing) {
        await PricingTier.create(tierData);
        console.log(`✅ Created tier: ${tierData.name}`);
      } else {
        console.log(`⏭️  Tier already exists: ${tierData.name}`);
      }
    }

    console.log('\n📈 Pricing Tier Seed Complete!');
    console.log(`
    Created/Updated Example Tiers:
    ✓ Bulk Order 500+ (5% discount on 500-999 units)
    ✓ Bulk Order 1000+ (10% discount on 1000-4999 units)
    ✓ Mega Order 5000+ (15% discount on 5000+ units)
    ✓ Wholesale Customer (12% discount for wholesale customers)
    ✓ Distributor Price (20% discount for distributors)
    ✓ New Year Sale 2024 (8% seasonal discount - expired)
    ✓ Fixed ₹50 Discount (Fixed amount discount on 1000+ units)
    `);

    // Display all active tiers
    const activeTiers = await PricingTier.find({ isActive: true });
    console.log(`\n💰 Active Tiers Summary:`);
    activeTiers.forEach(tier => {
      const discount = tier.discountType === 'percentage' 
        ? `${tier.discountValue}%` 
        : `₹${tier.discountValue}`;
      console.log(`   • ${tier.name}: ${discount} (Priority: ${tier.priority})`);
    });

  } catch (error) {
    console.error('❌ Error seeding pricing tiers:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run seed
seedPricingTiers();
