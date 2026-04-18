const { run, get, all } = require('../lib/db');
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

    const existing = await get(
      `
        SELECT id
        FROM simple_inventory_items
        WHERE product_name = ? AND variant_type = ? AND variant_value = ?
        LIMIT 1
      `,
      [productName.trim().toLowerCase(), variantType.trim().toLowerCase(), variantValue.trim()]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${productName} - ${variantType}: ${variantValue} already exists in inventory`,
      });
    }

    const id = createId();
    await run(
      `
        INSERT INTO simple_inventory_items (id, product_name, variant_type, variant_value, price, stock)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id, productName.trim().toLowerCase(), variantType.trim().toLowerCase(), variantValue.trim(), Number(price), Number(stock)]
    );

    const created = await get(`SELECT * FROM simple_inventory_items WHERE id = ?`, [id]);

    res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully',
      data: mapItem(created),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding inventory item', error: error.message });
  }
};

exports.getAllSimpleInventoryItems = async (req, res) => {
  try {
    const items = await all(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        ORDER BY created_at DESC
      `
    );
    res.status(200).json({
      success: true,
      message: 'Inventory items retrieved',
      data: items.map(mapItem),
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving inventory items', error: error.message });
  }
};

exports.getSimpleProductNames = async (req, res) => {
  try {
    const products = await all('SELECT DISTINCT product_name FROM simple_inventory_items ORDER BY product_name ASC');
    res.status(200).json({ success: true, data: products.map((row) => row.product_name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product names', error: error.message });
  }
};

exports.getSimpleVariantsForProduct = async (req, res) => {
  try {
    const variants = await all(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        WHERE product_name = ?
      `,
      [req.params.productName.toLowerCase()]
    );

    res.status(200).json({ success: true, data: variants.map(mapItem) });
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
      clauses.push(`LOWER(product_name) LIKE ?`);
    }
    if (req.query.variantType) {
      params.push(`%${req.query.variantType.toLowerCase()}%`);
      clauses.push(`LOWER(variant_type) LIKE ?`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const items = await all(
      `
        SELECT id, product_name, variant_type, variant_value, price, stock, created_at, updated_at
        FROM simple_inventory_items
        ${where}
        ORDER BY created_at DESC
      `,
      params
    );

    res.status(200).json({ success: true, data: items.map(mapItem), count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching inventory', error: error.message });
  }
};

exports.deleteSimpleInventoryItem = async (req, res) => {
  try {
    const item = await get(`SELECT * FROM simple_inventory_items WHERE id = ?`, [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    await run(
      `
        DELETE FROM simple_inventory_items
        WHERE id = ?
      `,
      [req.params.id]
    );

    res.status(200).json({ success: true, message: 'Inventory item deleted successfully', data: mapItem(item) });
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

    const { changes } = await run(
      `
        UPDATE simple_inventory_items
        SET
          price = COALESCE(?, price),
          stock = COALESCE(?, stock),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [price !== undefined ? Number(price) : null, stock !== undefined ? Number(stock) : null, req.params.id]
    );

    if (changes === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const item = await get(`SELECT * FROM simple_inventory_items WHERE id = ?`, [req.params.id]);

    res.status(200).json({ success: true, message: 'Inventory item updated successfully', data: mapItem(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating inventory item', error: error.message });
  }
};
