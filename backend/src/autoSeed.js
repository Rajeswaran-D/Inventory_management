const { query, withTransaction } = require('./lib/db');
const { createId } = require('./lib/ids');
const {
  buildVariantDisplayName,
  buildVariantKey,
  buildVariantSku,
} = require('./lib/productUtils');

const ENVELOPE_SIZES = [
  '6.25x4.25', '7.25x5.25', '7.25x4.25', '9x4', '9.25x4.25',
  '10.25x4.25', '11x5', '9x6', '12x5', '9x7', '9x6.25',
  '10x8', '10.25x8.25', '11.25x8.25', '12x9.25', '12x10',
  '13x10', '15x11', '16x12', '18x14', '20x16',
];

const MATERIAL_FAMILIES = [
  { name: 'Maplitho', gsmOptions: [80, 90, 120], hasColor: false, hasGSM: true },
  { name: 'Buff', gsmOptions: [80, 100], hasColor: false, hasGSM: true },
  { name: 'Kraft', gsmOptions: [90], hasColor: false, hasGSM: true },
  { name: 'Colour', gsmOptions: [80], hasColor: false, hasGSM: true },
  { name: 'Cloth Cover', gsmOptions: [], hasColor: false, hasGSM: false },
  { name: 'Vibothi Cover', gsmOptions: [], colorOptions: ['White', 'Color'], hasColor: true, hasGSM: false },
];

async function seedProductsAndVariants() {
  const variants = [];
  
  await withTransaction(async (client) => {
    for (const family of MATERIAL_FAMILIES) {
      const productId = createId();
      
      // Insert Product Master
      await query(
        `
          INSERT INTO product_masters (
            id, name, has_gsm, has_size, has_color, description, category,
            gsm_options, size_options, color_options, is_active, is_manual_product
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, false)
        `,
        [
          productId,
          family.name,
          family.hasGSM,
          true,
          family.hasColor,
          `Standard ${family.name} envelopes`,
          'Standard Envelope',
          JSON.stringify(family.gsmOptions || []),
          JSON.stringify(ENVELOPE_SIZES),
          JSON.stringify(family.colorOptions || []),
          true,
        ],
        client
      );

      // Create Variants
      const gsmList = family.hasGSM ? family.gsmOptions : [null];
      const colorList = family.hasColor ? family.colorOptions : [null];

      for (const size of ENVELOPE_SIZES) {
        for (const gsm of gsmList) {
          for (const color of colorList) {
            const variantId = createId();
            const variantData = { gsm, size, color };
            const displayName = buildVariantDisplayName({ name: family.name, hasGSM: family.hasGSM, hasSize: true, hasColor: family.hasColor }, variantData);
            const sku = buildVariantSku(family.name, gsm, size, color);
            const variantKey = buildVariantKey(productId, gsm, size, color);

            await query(
              `
                INSERT INTO product_variants (
                  id, product_id, gsm, size, color, has_size, has_gsm,
                  sku, display_name, variant_key, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              `,
              [
                variantId,
                productId,
                gsm,
                size,
                color,
                true,
                family.hasGSM,
                sku,
                displayName,
                variantKey,
                true,
              ],
              client
            );

            variants.push({ _id: variantId, productId });
          }
        }
      }
    }
  });

  return variants;
}

async function seedInventory(variants) {
  await withTransaction(async (client) => {
    for (const variant of variants) {
      await query(
        `
          INSERT INTO inventory (id, variant_id, quantity, price, minimum_stock_level, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [createId(), variant._id, 1000, 5.50, 50, true],
        client
      );
    }
  });
}

async function seedPricingTiers() {
  const tiers = [
    { name: 'Bulk 100 Units', type: 'volume', minQuantity: 100, maxQuantity: 499, discountPercentage: 5, isActive: true },
    { name: 'Bulk 500 Units', type: 'volume', minQuantity: 500, maxQuantity: 999, discountPercentage: 10, isActive: true },
    { name: 'Bulk 1000 Units', type: 'volume', minQuantity: 1000, maxQuantity: null, discountPercentage: 15, isActive: true },
    { name: 'VIP Customer', type: 'customer', minQuantity: 0, maxQuantity: null, customerType: 'vip', discountPercentage: 8, isActive: true },
    { name: 'Seasonal Summer', type: 'seasonal', minQuantity: 0, maxQuantity: null, discountPercentage: 12, isActive: true },
    { name: 'Seasonal Winter', type: 'seasonal', minQuantity: 0, maxQuantity: null, discountPercentage: 10, isActive: true },
  ];

  await withTransaction(async (client) => {
    for (const tier of tiers) {
      await query(
        `
          INSERT INTO pricing_tiers (
            id, name, description, tier_type, min_quantity, max_quantity,
            customer_type, discount_type, discount_value, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (name) DO NOTHING
        `,
        [
          createId(),
          tier.name,
          '',
          tier.type,
          tier.minQuantity,
          tier.maxQuantity,
          tier.customerType || null,
          'percentage',
          tier.discountPercentage,
          tier.isActive,
        ],
        client
      );
    }
  });
}

async function autoSeed() {
  try {
    const productCount = await query('SELECT COUNT(*)::int AS count FROM product_masters');
    if (productCount.rows[0].count > 0) {
      console.log('Database already seeded, skipping auto-seed');
      return;
    }

    console.log('Auto-seeding PostgreSQL database');
    const variants = await seedProductsAndVariants();
    await seedInventory(variants);
    await seedPricingTiers();
    console.log(`Seeded 1 product master, ${variants.length} variants, ${variants.length} inventory records`);
  } catch (error) {
    console.error('Auto-seeding error:', error.message);
  }
}

module.exports = { autoSeed };
