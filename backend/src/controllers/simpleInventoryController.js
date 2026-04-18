const { query } = require('../lib/db');
const { createId } = require('../lib/ids');

function mapItem(row) {
  return {
    _id: row.id,
    productName: row.product_name,
    variantType: row.variant_type,
    variantValue: row.variant_value,
    price: Number(row.price),
    stock: Number(row.stock),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.addSimpleInventoryItem = async (req, res) => {
  try {
    const { productName, variantType, variantValue, price, stock } = req.body;
    if (!productName || !variantType || !variantValue) {
      return res.status(400).json({ success: false, message: 'Product name, variant type, and variant value are required' });
    }
    if (price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Price and stock are required' });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }
    if (Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    const existing = await query(
      `
        SELECT id
        FROM simple_inventory_items
        WHERE product_name = $1 AND variant_type = $2 AND variant_value = $3
        LIMIT 1
      `,
      [productName.trim().toLowerCase(), variantType.trim().toLowerCase(), variantValue.trim()]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: `${productName} - ${variantType}: ${variantValue} already exists in inventory`,
      });
    }

    const created = await query(
      `
        INSERT INTO simple_inventory_items (id, product_name, variant_type, variant_value, price, stock)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
      `,
      [createId(), productName.trim().toLowerCase(), variantType.trim().toLowerCase(), variantValue.trim(), Number(price), Number(stock)]
    );

    res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully',
      data: mapItem(created.rows[0]),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding inventory item', error: error.message });
  }
};

exports.getAllSimpleInventoryItems = async (req, res) => {
  try {
    const items = await query(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        ORDER BY created_at DESC
      `
    );
    res.status(200).json({
      success: true,
      message: 'Inventory items retrieved',
      data: items.rows.map(mapItem),
      count: items.rowCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving inventory items', error: error.message });
  }
};

exports.getSimpleProductNames = async (req, res) => {
  try {
    const products = await query('SELECT DISTINCT product_name FROM simple_inventory_items ORDER BY product_name ASC');
    res.status(200).json({ success: true, data: products.rows.map((row) => row.product_name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product names', error: error.message });
  }
};

exports.getSimpleVariantsForProduct = async (req, res) => {
  try {
    const variants = await query(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        WHERE product_name = $1
      `,
      [req.params.productName.toLowerCase()]
    );

    res.status(200).json({ success: true, data: variants.rows.map(mapItem) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving variants', error: error.message });
  }
};

exports.searchSimpleInventory = async (req, res) => {
  try {
    const params = [];
    const clauses = [];
    if (req.query.query) {
      params.push(`%${req.query.query.toLowerCase()}%`);
      clauses.push(`LOWER(product_name) LIKE $${params.length}`);
    }
    if (req.query.variantType) {
      params.push(`%${req.query.variantType.toLowerCase()}%`);
      clauses.push(`LOWER(variant_type) LIKE $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const items = await query(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        ${where}
        ORDER BY created_at DESC
      `,
      params
    );

    res.status(200).json({ success: true, data: items.rows.map(mapItem), count: items.rowCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching inventory', error: error.message });
  }
};

exports.deleteSimpleInventoryItem = async (req, res) => {
  try {
    const item = await query(
      `
        DELETE FROM simple_inventory_items
        WHERE id = $1
        RETURNING id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
      `,
      [req.params.id]
    );

    if (item.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.status(200).json({ success: true, message: 'Inventory item deleted successfully', data: mapItem(item.rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting inventory item', error: error.message });
  }
};

exports.updateSimpleInventoryItem = async (req, res) => {
  try {
    const { price, stock } = req.body;
    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }
    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    const item = await query(
      `
        UPDATE simple_inventory_items
        SET
          price = COALESCE($1, price),
          stock = COALESCE($2, stock),
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
      `,
      [price !== undefined ? Number(price) : null, stock !== undefined ? Number(stock) : null, req.params.id]
    );

    if (item.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.status(200).json({ success: true, message: 'Inventory item updated successfully', data: mapItem(item.rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating inventory item', error: error.message });
  }
};
