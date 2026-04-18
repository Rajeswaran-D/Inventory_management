const { query } = require('./db');

function mapInventoryRow(row) {
  const parseJson = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return val;
  };

  return {
    _id: row.inventory_id,
    quantity: Number(row.quantity),
    price: Number(row.price),
    minimumStockLevel: row.minimum_stock_level,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variant: {
      _id: row.variant_id,
      productId: {
        _id: row.product_id,
        name: row.product_name,
        hasGSM: Boolean(row.product_has_gsm),
        hasSize: Boolean(row.product_has_size),
        hasColor: Boolean(row.product_has_color),
        gsmOptions: parseJson(row.gsm_options),
        sizeOptions: parseJson(row.size_options),
        colorOptions: parseJson(row.color_options),
        category: row.category,
        description: row.description,
        isActive: Boolean(row.product_is_active),
      },
      gsm: row.gsm,
      size: row.size,
      color: row.color,
      hasSize: Boolean(row.variant_has_size),
      hasGSM: Boolean(row.variant_has_gsm),
      sku: row.sku,
      displayName: row.display_name,
      isActive: Boolean(row.variant_is_active),
      createdAt: row.variant_created_at,
      updatedAt: row.variant_updated_at,
    },
  };
}

async function getInventoryItems({ search = '', limit = 1000, isActive = true, inventoryId = null, variantId = null } = {}) {
  const params = [];
  const clauses = [];

  if (isActive !== null) {
    params.push(isActive ? 1 : 0);
    clauses.push(`i.is_active = $${params.length}`);
    if (isActive === true) {
      clauses.push(`v.is_active = 1`);
      clauses.push(`p.is_active = 1`);
    }
  }
  if (inventoryId) {
    params.push(inventoryId);
    clauses.push(`i.id = $${params.length}`);
  }
  if (variantId) {
    params.push(variantId);
    clauses.push(`v.id = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    clauses.push(`
      (
        LOWER(v.display_name) LIKE $${params.length}
        OR LOWER(COALESCE(v.sku, '')) LIKE $${params.length}
        OR LOWER(COALESCE(v.size, '')) LIKE $${params.length}
        OR LOWER(COALESCE(v.color, '')) LIKE $${params.length}
        OR LOWER(p.name) LIKE $${params.length}
      )
    `);
  }

  params.push(limit);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await query(
    `
      SELECT
        i.id AS inventory_id,
        i.quantity,
        i.price,
        i.minimum_stock_level,
        i.is_active,
        i.created_at,
        i.updated_at,
        v.id AS variant_id,
        v.gsm,
        v.size,
        v.color,
        v.has_size AS variant_has_size,
        v.has_gsm AS variant_has_gsm,
        v.sku,
        v.display_name,
        v.is_active AS variant_is_active,
        v.created_at AS variant_created_at,
        v.updated_at AS variant_updated_at,
        p.id AS product_id,
        p.name AS product_name,
        p.has_gsm AS product_has_gsm,
        p.has_size AS product_has_size,
        p.has_color AS product_has_color,
        p.gsm_options,
        p.size_options,
        p.color_options,
        p.category,
        p.description,
        p.is_active AS product_is_active
      FROM inventory i
      JOIN product_variants v ON v.id = i.variant_id
      JOIN product_masters p ON p.id = v.product_id
      ${where}
      ORDER BY i.updated_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapInventoryRow);
}

function mapSaleRow(row) {
  let items = [];
  if (row.items) {
    if (typeof row.items === 'string') {
      try { items = JSON.parse(row.items); } catch(e) {}
    } else if (Array.isArray(row.items)) {
      items = row.items;
    }
  }

  return {
    _id: row.id,
    billNumber: row.bill_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerGSTIN: row.customer_gstin,
    customerAddress: row.customer_address,
    customerId: row.customer_id
      ? {
          _id: row.customer_id,
          name: row.customer_ref_name,
          phone: row.customer_ref_phone,
          email: row.customer_ref_email,
          address: row.customer_ref_address,
        }
      : null,
    items: items.map((item) => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
      itemTotal: Number(item.itemTotal),
    })),
    subtotal: Number(row.subtotal),
    cgstRate: Number(row.cgst_rate),
    sgstRate: Number(row.sgst_rate),
    cgst: Number(row.cgst),
    sgst: Number(row.sgst),
    igst: Number(row.igst),
    roundOff: Number(row.round_off),
    grandTotal: Number(row.grand_total),
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getSales({ saleId = null, customerId = null, search = '', startDate = null, endDate = null, limit = 1000, skip = 0 } = {}) {
  const params = [];
  const clauses = [];

  if (saleId) {
    params.push(saleId);
    clauses.push(`s.id = $${params.length}`);
  }
  if (customerId) {
    params.push(customerId);
    clauses.push(`s.customer_id = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    clauses.push(`(LOWER(s.bill_number) LIKE $${params.length} OR LOWER(s.customer_name) LIKE $${params.length})`);
  }
  if (startDate) {
    const sd = startDate instanceof Date ? startDate.toISOString().replace('T', ' ').slice(0, 19) : startDate;
    params.push(sd);
    clauses.push(`s.date >= $${params.length}`);
  }
  if (endDate) {
    const ed = endDate instanceof Date ? endDate.toISOString().replace('T', ' ').slice(0, 19) : endDate;
    params.push(ed);
    clauses.push(`s.date <= $${params.length}`);
  }

  params.push(limit);
  params.push(skip);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await query(
    `
      SELECT
        s.*,
        c.name AS customer_ref_name,
        c.phone AS customer_ref_phone,
        c.email AS customer_ref_email,
        c.address AS customer_ref_address,
        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                '_id', si.id,
                'variantId', si.variant_id,
                'productId', si.product_id,
                'productName', si.product_name,
                'displayName', si.display_name,
                'gsm', si.gsm,
                'size', si.size,
                'color', si.color,
                'price', si.price,
                'quantity', si.quantity,
                'itemTotal', si.item_total
              )
            )
            FROM sale_items si
            WHERE si.sale_id = s.id
          ),
          '[]'
        ) AS items
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${where}
      GROUP BY s.id
      ORDER BY s.date DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );

  return result.rows.map(mapSaleRow);
}

async function getSaleCount({ customerId = null, startDate = null, endDate = null } = {}) {
  const params = [];
  const clauses = [];

  if (customerId) {
    params.push(customerId);
    clauses.push(`customer_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    clauses.push(`date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    clauses.push(`date <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(`SELECT COUNT(*) AS count FROM sales ${where}`, params);
  return result.rows[0].count;
}

module.exports = {
  getInventoryItems,
  mapInventoryRow,
  getSales,
  getSaleCount,
  mapSaleRow,
};
