const { run, get, all, query } = require('../lib/db');
const { PRODUCTS } = require('../data/productDefinitions');
const { getInventoryItems } = require('../lib/store');

exports.getProductDefinitions = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: PRODUCTS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProductOptions = async (req, res) => {
  try {
    const product = PRODUCTS[req.params.productId.toUpperCase()];
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        gsmOptions: product.gsmOptions,
        sizeOptions: product.sizeOptions,
        colorOptions: product.colorOptions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllInventory = async (req, res) => {
  try {
    const { search, limit = 1000 } = req.query;
    const items = await getInventoryItems({
      search: search || '',
      limit: parseInt(limit, 10),
      isActive: true,
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const [item] = await getInventoryItems({ inventoryId: req.params.inventoryId, isActive: null, limit: 1 });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { quantity, price } = req.body;
    if (quantity === undefined && price === undefined) {
      return res.status(400).json({ success: false, error: 'Provide at least quantity or price to update' });
    }

    const { changes } = await run(
      `
        UPDATE inventory
        SET
          quantity = COALESCE(?, quantity),
          price = COALESCE(?, price),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        quantity !== undefined ? Math.max(0, Number(quantity)) : null,
        price !== undefined ? Math.max(0, Number(price)) : null,
        req.params.inventoryId,
      ]
    );

    if (changes === 0) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    const [item] = await getInventoryItems({ inventoryId: req.params.inventoryId, isActive: null, limit: 1 });
    res.status(200).json({
      success: true,
      data: item,
      message: 'Inventory updated successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const { changes } = await run(
      `
        UPDATE inventory
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [req.params.inventoryId]
    );

    if (changes === 0) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.status(200).json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.searchInventory = async (req, res) => {
  try {
    const { productName, gsm, size, color } = req.query;
    const params = [];
    const clauses = ['i.is_active = TRUE', 'v.is_active = TRUE', 'p.is_active = TRUE'];

    if (productName) {
      params.push(productName);
      clauses.push(`p.name = ?`);
    }
    if (gsm && gsm !== 'null' && gsm !== '') {
      params.push(Number(gsm));
      clauses.push(`v.gsm = ?`);
    }
    if (size && size !== 'null' && size !== '') {
      params.push(size);
      clauses.push(`v.size = ?`);
    }
    if (color && color !== 'null' && color !== '') {
      params.push(color);
      clauses.push(`v.color = ?`);
    }

    const items = await all(
      `
        SELECT i.id
        FROM inventory i
        JOIN product_variants v ON v.id = i.variant_id
        JOIN product_masters p ON p.id = v.product_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY p.name ASC, v.gsm ASC NULLS LAST, v.size ASC NULLS LAST
      `,
      params
    );

    const ids = items.map((row) => row.id);
    const results = [];
    for (const id of ids) {
      const [item] = await getInventoryItems({ inventoryId: id, isActive: null, limit: 1 });
      if (item) {
        results.push(item);
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const items = await getInventoryItems({ limit: 1000, isActive: true });
    const filtered = items
      .filter((item) => Number(item.quantity) < Number(item.minimumStockLevel || 50))
      .sort((a, b) => a.quantity - b.quantity);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByProduct = async (req, res) => {
  try {
    const all = await getInventoryItems({ limit: 1000, isActive: true });
    const results = all.filter((item) => item.variant?.productId?.name === req.params.productName);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'updates must be an array' });
    }

    const results = [];
    for (const update of updates) {
      const { id, ...data } = update;
      await run(
        `
          UPDATE inventory
          SET
            quantity = COALESCE(?, quantity),
            price = COALESCE(?, price),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          data.quantity !== undefined ? Number(data.quantity) : null,
          data.price !== undefined ? Number(data.price) : null,
          id,
        ]
      );
      const [item] = await getInventoryItems({ inventoryId: id, isActive: null, limit: 1 });
      if (item) {
        results.push(item);
      }
    }

    res.status(200).json({
      success: true,
      updated: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    if (!quantity || isNaN(quantity) || parseInt(quantity, 10) < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive number' });
    }

    const { changes } = await run(
      `
        UPDATE inventory
        SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [parseInt(quantity, 10), req.params.inventoryId]
    );

    if (changes === 0) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    const [item] = await getInventoryItems({ inventoryId: req.params.inventoryId, isActive: null, limit: 1 });
    const oldQuantity = item.quantity - parseInt(quantity, 10);

    res.status(200).json({
      success: true,
      message: `Added ${parseInt(quantity, 10)} units`,
      data: item,
      changeLog: {
        action: 'STOCK_IN',
        oldQuantity,
        newQuantity: item.quantity,
        change: parseInt(quantity, 10),
        reason: reason || 'Manual stock addition',
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.reduceStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    if (!quantity || isNaN(quantity) || parseInt(quantity, 10) < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive number' });
    }

    const [item] = await getInventoryItems({ inventoryId: req.params.inventoryId, isActive: null, limit: 1 });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    const reduceQty = parseInt(quantity, 10);
    if (item.quantity < reduceQty) {
      return res.status(400).json({
        success: false,
        error: `Not enough stock. Available: ${item.quantity}, Requested: ${reduceQty}`,
      });
    }

    await run(
      `
        UPDATE inventory
        SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [reduceQty, req.params.inventoryId]
    );

    const [updatedItem] = await getInventoryItems({ inventoryId: req.params.inventoryId, isActive: null, limit: 1 });
    res.status(200).json({
      success: true,
      message: `Reduced ${reduceQty} units`,
      data: updatedItem,
      changeLog: {
        action: 'STOCK_OUT',
        oldQuantity: item.quantity,
        newQuantity: updatedItem.quantity,
        change: -reduceQty,
        reason: reason || 'Manual stock reduction',
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
