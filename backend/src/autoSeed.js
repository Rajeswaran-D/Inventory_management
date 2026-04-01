/**
 * AUTO-SEEDING UTILITY
 * Runs automatically on server startup if database is empty
 * Populates ProductMaster, ProductVariant, and Inventory collections
 */

const ProductMaster = require('./models/ProductMaster');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');
const PricingTier = require('./models/PricingTier');

// ============ PREDEFINED PRODUCT DATA ============

const ENVELOPE_SIZES = [
  "6.25x4.25", "7.25x5.25", "7.25x4.25", "9x4", "9.25x4.25",
  "10.25x4.25", "11x5", "9x6", "12x5", "9x7", "9x6.25",
  "10x8", "10.25x8.25", "11.25x8.25", "12x9.25", "12x10",
  "13x10", "15x11", "16x12", "18x14", "20x16"
];

const MATERIAL_TYPES = [
  "Maplitho 80 GSM", "Maplitho 90 GSM", "Maplitho 120 GSM",
  "Buff 80 GSM", "Buff 100 GSM", "Kraft 90 GSM",
  "Colour 80 GSM", "Cloth Cover", "Vibothi Cover White", "Vibothi Cover Color"
];

// Helper to extract GSM from material type
const extractGSM = (materialType) => {
  const gsmMatch = materialType.match(/(\d+)\s*GSM/i);
  return gsmMatch ? parseInt(gsmMatch[1], 10) : null;
};

// Helper to extract color from material type
const getColor = (materialType) => {
  if (materialType.includes("Vibothi")) {
    return materialType.includes("White") ? "White" : "Color";
  }
  return null;
};

// ============ SEED PRODUCT MASTER ============

const seedProductMaster = async () => {
  console.log('\n📦 Seeding ProductMaster...');
  
  const productMaster = await ProductMaster.create({
    name: 'Envelopes',
    hasGSM: true,
    hasSize: true,
    hasColor: false,
    description: 'Standard envelopes in various sizes and materials',
    category: 'Standard Envelope',
    gsmOptions: [80, 90, 100, 120],
    sizeOptions: ENVELOPE_SIZES,
    colorOptions: [],
    isActive: true
  });
  
  console.log(`✅ ProductMaster created: ${productMaster.name}`);
  return productMaster;
};

// ============ SEED PRODUCT VARIANTS ============

const seedProductVariants = async (productMaster) => {
  console.log(`\n📦 Seeding ProductVariants (${ENVELOPE_SIZES.length * MATERIAL_TYPES.length} combinations)...`);
  
  const variants = [];
  const seen = new Set();
  
  for (const size of ENVELOPE_SIZES) {
    for (const materialType of MATERIAL_TYPES) {
      const gsm = extractGSM(materialType);
      const color = getColor(materialType);
      
      const key = `${size}|${materialType}`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      const sku = `ENV-${size}-${gsm || 'N/A'}-${color || 'STD'}`.replace(/[x\s]/g, '-');
      
      variants.push({
        productId: productMaster._id,
        gsm,
        size,
        color: color || null,
        hasSize: true,
        hasGSM: true,
        sku,
        displayName: `${size} | ${materialType}`,
        isActive: true
      });
    }
  }
  
  const inserted = await ProductVariant.insertMany(variants);
  console.log(`✅ Created ${inserted.length} product variants`);
  return inserted;
};

// ============ SEED INVENTORY ============

const seedInventory = async (variants) => {
  console.log(`\n📦 Seeding Inventory (${variants.length} items)...`);
  
  const inventoryItems = variants.map(variant => ({
    variantId: variant._id,
    quantity: 0,
    price: 0,
    minimumStockLevel: 50,
    isActive: true
  }));
  
  const inserted = await Inventory.insertMany(inventoryItems);
  console.log(`✅ Created ${inserted.length} inventory records`);
  return inserted;
};

// ============ SEED PRICING TIERS ============

const seedPricingTiers = async () => {
  console.log('\n💰 Seeding Pricing Tiers...');
  
  const tiers = [
    {
      name: 'Bulk 100 Units',
      type: 'volume',
      minQuantity: 100,
      maxQuantity: 499,
      discountPercentage: 5,
      isActive: true
    },
    {
      name: 'Bulk 500 Units',
      type: 'volume',
      minQuantity: 500,
      maxQuantity: 999,
      discountPercentage: 10,
      isActive: true
    },
    {
      name: 'Bulk 1000 Units',
      type: 'volume',
      minQuantity: 1000,
      maxQuantity: null,
      discountPercentage: 15,
      isActive: true
    },
    {
      name: 'VIP Customer',
      type: 'customer',
      customerType: 'vip',
      discountPercentage: 8,
      isActive: true
    },
    {
      name: 'Seasonal Summer',
      type: 'seasonal',
      season: 'summer',
      discountPercentage: 12,
      isActive: true
    },
    {
      name: 'Seasonal Winter',
      type: 'seasonal',
      season: 'winter',
      discountPercentage: 10,
      isActive: true
    }
  ];
  
  const inserted = await PricingTier.insertMany(tiers);
  console.log(`✅ Created ${inserted.length} pricing tiers`);
  return inserted;
};

// ============ AUTO-SEED ON SERVER STARTUP ============

const autoSeed = async () => {
  try {
    // Check if ProductMaster already exists
    const productCount = await ProductMaster.countDocuments();
    
    if (productCount > 0) {
      console.log('✅ Database already seeded, skipping auto-seed');
      return;
    }
    
    console.log('\n🌱 AUTO-SEEDING DATABASE ON STARTUP...');
    
    // Seed ProductMaster
    const productMaster = await seedProductMaster();
    
    // Seed ProductVariants
    const variants = await seedProductVariants(productMaster);
    
    // Seed Inventory
    await seedInventory(variants);
    
    // Seed Pricing Tiers
    await seedPricingTiers();
    
    console.log('\n✅ DATABASE AUTO-SEEDING COMPLETE!');
    console.log(`   - ProductMaster: 1 record`);
    console.log(`   - ProductVariants: ${variants.length} records`);
    console.log(`   - Inventory: ${variants.length} records`);
    console.log(`   - PricingTiers: 6 records`);
    
  } catch (err) {
    console.error('⚠️  Auto-seeding error:', err.message);
    // Don't throw - let server continue even if seeding partially fails
  }
};

module.exports = { autoSeed };
