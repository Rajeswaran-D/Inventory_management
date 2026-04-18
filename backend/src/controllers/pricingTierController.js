const { query, withTransaction } = require('../lib/db');
const { createId } = require('../lib/ids');

function calculatePriceForTier(basePrice, tier) {
  if (!tier) {
    return basePrice;
  }
  if (tier.discountType === 'percentage') {
    return basePrice * (1 - (tier.discountValue / 100));
  }
  if (tier.discountType === 'fixed') {
    return Math.max(0, basePrice - tier.discountValue);
  }
  return basePrice;
}

async function getTierRelations(tierId) {
  const [products, variants] = await Promise.all([
    query(
      `
        SELECT p.id, p.name
        FROM pricing_tier_products t
        JOIN product_masters p ON p.id = t.product_id
        WHERE t.tier_id = $1
      `,
      [tierId]
    ),
    query(
      `
        SELECT v.id, v.display_name, v.sku
        FROM pricing_tier_variants t
        JOIN product_variants v ON v.id = t.variant_id
        WHERE t.tier_id = $1
      `,
      [tierId]
    ),
  ]);

  return {
    applicableProducts: products.rows.map((row) => ({ _id: row.id, name: row.name })),
    applicableVariants: variants.rows.map((row) => ({ _id: row.id, displayName: row.display_name, sku: row.sku })),
  };
}

async function mapTier(row) {
  const relations = await getTierRelations(row.id);
  return {
    _id: row.id,
    name: row.name,
    description: row.description,
    tierType: row.tier_type,
    minQuantity: row.min_quantity,
    maxQuantity: row.max_quantity,
    customerType: row.customer_type,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    markup: Number(row.markup),
    startDate: row.start_date,
    endDate: row.end_date,
    priority: row.priority,
    isActive: row.is_active,
    appliedCount: row.applied_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...relations,
  };
}

async function getApplicableTierRow({ quantity = 0, customerType = null, productId = null, variantId = null }) {
  const rows = await query(
    `
      SELECT *
      FROM pricing_tiers
      WHERE is_active = TRUE
      ORDER BY priority DESC, created_at DESC
    `
  );

  for (const row of rows.rows) {
    const startOk = !row.start_date || new Date(row.start_date) <= new Date();
    const endOk = !row.end_date || new Date(row.end_date) >= new Date();
    if (!startOk || !endOk) {
      continue;
    }

    if (row.tier_type === 'volume') {
      const minOk = quantity >= row.min_quantity;
      const maxOk = row.max_quantity === null || quantity <= row.max_quantity;
      if (minOk && maxOk) {
        return row;
      }
    }

    if (row.tier_type === 'customer' && customerType && row.customer_type === customerType) {
      return row;
    }

    if (row.tier_type === 'product') {
      const products = await query('SELECT product_id FROM pricing_tier_products WHERE tier_id = $1', [row.id]);
      const variants = await query('SELECT variant_id FROM pricing_tier_variants WHERE tier_id = $1', [row.id]);
      const productIds = products.rows.map((item) => item.product_id);
      const variantIds = variants.rows.map((item) => item.variant_id);

      if ((productIds.length === 0 && variantIds.length === 0) ||
        (productId && productIds.includes(productId)) ||
        (variantId && variantIds.includes(variantId))) {
        return row;
      }
    }
  }

  return null;
}

async function syncTierRelations(client, tierId, productIds = [], variantIds = []) {
  await query('DELETE FROM pricing_tier_products WHERE tier_id = $1', [tierId], client);
  await query('DELETE FROM pricing_tier_variants WHERE tier_id = $1', [tierId], client);

  for (const productId of productIds) {
    await query(
      'INSERT INTO pricing_tier_products (tier_id, product_id) VALUES ($1, $2)',
      [tierId, productId],
      client
    );
  }
  for (const variantId of variantIds) {
    await query(
      'INSERT INTO pricing_tier_variants (tier_id, variant_id) VALUES ($1, $2)',
      [tierId, variantId],
      client
    );
  }
}

exports.getAllTiers = async (req, res) => {
  try {
    const params = [];
    const clauses = [];
    if (req.query.tierType) {
      params.push(req.query.tierType);
      clauses.push(`tier_type = $${params.length}`);
    }
    if (req.query.customerType) {
      params.push(req.query.customerType);
      clauses.push(`customer_type = $${params.length}`);
    }
    if (req.query.isActive !== undefined) {
      params.push(req.query.isActive === 'true');
      clauses.push(`is_active = $${params.length}`);
    }
    if (req.query.search) {
      params.push(`%${req.query.search.toLowerCase()}%`);
      clauses.push(`LOWER(name) LIKE $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const tiers = await query(
      `
        SELECT *
        FROM pricing_tiers
        ${where}
        ORDER BY tier_type ASC, priority DESC
      `,
      params
    );

    const data = [];
    for (const row of tiers.rows) {
      data.push(await mapTier(row));
    }

    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierById = async (req, res) => {
  try {
    const tier = await query('SELECT * FROM pricing_tiers WHERE id = $1 LIMIT 1', [req.params.id]);
    if (tier.rowCount === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }
    res.json({ data: await mapTier(tier.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicableTier = async (req, res) => {
  try {
    const row = await getApplicableTierRow({
      quantity: parseInt(req.query.quantity || 0, 10),
      customerType: req.query.customerType || null,
      productId: req.query.productId || null,
      variantId: req.query.variantId || null,
    });
    res.json({ data: row ? await mapTier(row) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculateTieredPrice = async (req, res) => {
  try {
    const basePrice = Number(req.body.basePrice);
    if (!basePrice) {
      return res.status(400).json({ error: 'basePrice is required' });
    }

    const row = await getApplicableTierRow({
      quantity: parseInt(req.body.quantity || 0, 10),
      customerType: req.body.customerType || null,
      productId: req.body.productId || null,
      variantId: req.body.variantId || null,
    });
    const tier = row ? await mapTier(row) : null;
    const finalPrice = calculatePriceForTier(basePrice, tier);
    const savings = basePrice - finalPrice;

    res.json({
      data: {
        basePrice,
        tier: tier ? {
          id: tier._id,
          name: tier.name,
          discountType: tier.discountType,
          discountValue: tier.discountValue,
        } : null,
        finalPrice,
        savings,
        savingsPercentage: basePrice > 0 ? ((savings / basePrice) * 100).toFixed(2) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTier = async (req, res) => {
  try {
    const tierId = createId();
    await withTransaction(async (client) => {
      await query(
        `
          INSERT INTO pricing_tiers (
            id, name, description, tier_type, min_quantity, max_quantity, customer_type,
            discount_type, discount_value, markup, start_date, end_date, priority, is_active, applied_count
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
        `,
        [
          tierId,
          req.body.name,
          req.body.description || '',
          req.body.tierType || 'volume',
          Number(req.body.minQuantity || 0),
          req.body.maxQuantity ?? null,
          req.body.customerType || null,
          req.body.discountType || 'percentage',
          Number(req.body.discountValue || 0),
          Number(req.body.markup || 0),
          req.body.startDate || null,
          req.body.endDate || null,
          Number(req.body.priority || 100),
          req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        ],
        client
      );

      await syncTierRelations(client, tierId, req.body.applicableProducts || [], req.body.applicableVariants || []);
    });

    const tier = await query('SELECT * FROM pricing_tiers WHERE id = $1 LIMIT 1', [tierId]);
    res.status(201).json({ data: await mapTier(tier.rows[0]), message: 'Pricing tier created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createBulkTiers = async (req, res) => {
  try {
    const tiers = req.body.tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ error: 'tiers array is required' });
    }

    const created = [];
    for (const tier of tiers) {
      const tierId = createId();
      await query(
        `
          INSERT INTO pricing_tiers (
            id, name, description, tier_type, min_quantity, max_quantity, customer_type,
            discount_type, discount_value, markup, start_date, end_date, priority, is_active, applied_count
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
        `,
        [
          tierId,
          tier.name,
          tier.description || '',
          tier.tierType || 'volume',
          Number(tier.minQuantity || 0),
          tier.maxQuantity ?? null,
          tier.customerType || null,
          tier.discountType || 'percentage',
          Number(tier.discountValue || 0),
          Number(tier.markup || 0),
          tier.startDate || null,
          tier.endDate || null,
          Number(tier.priority || 100),
          tier.isActive !== undefined ? Boolean(tier.isActive) : true,
        ]
      );
      const row = await query('SELECT * FROM pricing_tiers WHERE id = $1 LIMIT 1', [tierId]);
      created.push(await mapTier(row.rows[0]));
    }

    res.status(201).json({ data: created, message: `${created.length} pricing tiers created successfully` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTier = async (req, res) => {
  try {
    await withTransaction(async (client) => {
      const existing = await query('SELECT * FROM pricing_tiers WHERE id = $1 LIMIT 1', [req.params.id], client);
      if (existing.rowCount === 0) {
        throw new Error('Tier not found');
      }
      const current = existing.rows[0];

      await query(
        `
          UPDATE pricing_tiers
          SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            tier_type = COALESCE($3, tier_type),
            min_quantity = COALESCE($4, min_quantity),
            max_quantity = $5,
            customer_type = $6,
            discount_type = COALESCE($7, discount_type),
            discount_value = COALESCE($8, discount_value),
            markup = COALESCE($9, markup),
            start_date = $10,
            end_date = $11,
            priority = COALESCE($12, priority),
            is_active = COALESCE($13, is_active),
            updated_at = NOW()
          WHERE id = $14
        `,
        [
          req.body.name || null,
          req.body.description || null,
          req.body.tierType || null,
          req.body.minQuantity !== undefined ? Number(req.body.minQuantity) : null,
          req.body.maxQuantity !== undefined ? req.body.maxQuantity : current.max_quantity,
          req.body.customerType !== undefined ? req.body.customerType : current.customer_type,
          req.body.discountType || null,
          req.body.discountValue !== undefined ? Number(req.body.discountValue) : null,
          req.body.markup !== undefined ? Number(req.body.markup) : null,
          req.body.startDate !== undefined ? req.body.startDate : current.start_date,
          req.body.endDate !== undefined ? req.body.endDate : current.end_date,
          req.body.priority !== undefined ? Number(req.body.priority) : null,
          req.body.isActive !== undefined ? Boolean(req.body.isActive) : null,
          req.params.id,
        ],
        client
      );

      if (req.body.applicableProducts || req.body.applicableVariants) {
        await syncTierRelations(client, req.params.id, req.body.applicableProducts || [], req.body.applicableVariants || []);
      }
    });

    const tier = await query('SELECT * FROM pricing_tiers WHERE id = $1 LIMIT 1', [req.params.id]);
    res.json({ data: await mapTier(tier.rows[0]), message: 'Pricing tier updated successfully' });
  } catch (err) {
    res.status(err.message === 'Tier not found' ? 404 : 400).json({ error: err.message });
  }
};

exports.toggleTierStatus = async (req, res) => {
  try {
    const tier = await query(
      `
        UPDATE pricing_tiers
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [Boolean(req.body.isActive), req.params.id]
    );

    if (tier.rowCount === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    res.json({
      data: await mapTier(tier.rows[0]),
      message: `Pricing tier ${req.body.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTier = async (req, res) => {
  try {
    const tier = await query('DELETE FROM pricing_tiers WHERE id = $1 RETURNING *', [req.params.id]);
    if (tier.rowCount === 0) {
      return res.status(404).json({ error: 'Tier not found' });
    }
    res.json({ message: 'Pricing tier deleted successfully', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierStats = async (req, res) => {
  try {
    const tiers = await query('SELECT * FROM pricing_tiers WHERE is_active = TRUE');
    const stats = {
      totalTiers: tiers.rowCount,
      byType: {},
      byDiscountType: {},
      averageDiscount: 0,
      maxDiscount: 0,
    };

    let totalDiscount = 0;
    for (const tier of tiers.rows) {
      stats.byType[tier.tier_type] = (stats.byType[tier.tier_type] || 0) + 1;
      stats.byDiscountType[tier.discount_type] = (stats.byDiscountType[tier.discount_type] || 0) + 1;
      if (tier.discount_type === 'percentage') {
        totalDiscount += Number(tier.discount_value);
        stats.maxDiscount = Math.max(stats.maxDiscount, Number(tier.discount_value));
      }
    }

    stats.averageDiscount = tiers.rowCount > 0 ? (totalDiscount / tiers.rowCount).toFixed(2) : 0;
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierUsageReport = async (req, res) => {
  try {
    const tiers = await query('SELECT * FROM pricing_tiers ORDER BY applied_count DESC, priority DESC');
    const report = {
      totalTiers: tiers.rowCount,
      activeTiers: tiers.rows.filter((tier) => tier.is_active).length,
      totalApplications: tiers.rows.reduce((sum, tier) => sum + tier.applied_count, 0),
      tiersByUsage: tiers.rows.map((tier) => ({
        name: tier.name,
        tierType: tier.tier_type,
        appliedCount: tier.applied_count,
        discount: `${tier.discount_value}${tier.discount_type === 'percentage' ? '%' : 'INR'}`,
        isActive: tier.is_active,
      })),
    };
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
