const { run, get, all } = require('../lib/db');
const { createId } = require('../lib/ids');

// ================= GET ALL =================
exports.getAll = async (req, res) => {
  try {
    const rows = await all(
      `SELECT * FROM raw_materials ORDER BY name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ RAW MATERIALS getAll ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET BY ID =================
exports.getById = async (req, res) => {
  try {
    const row = await get(
      `SELECT * FROM raw_materials WHERE id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('❌ RAW MATERIALS getById ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= CREATE =================
exports.create = async (req, res) => {
  try {
    const { name, price, stock_quantity, stock_unit } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const id = createId();
    await run(
      `INSERT INTO raw_materials (id, name, price, stock_quantity, stock_unit)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        parseFloat(price) || 0,
        parseFloat(stock_quantity) || 0,
        (stock_unit || 'pieces').trim(),
      ]
    );

    const created = await get(`SELECT * FROM raw_materials WHERE id = ?`, [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'A raw material with this name already exists.' });
    }
    console.error('❌ RAW MATERIALS create ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { name, price, stock_quantity, stock_unit } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existing = await get(`SELECT * FROM raw_materials WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await run(
      `UPDATE raw_materials
       SET name = ?, price = ?, stock_quantity = ?, stock_unit = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name.trim(),
        parseFloat(price) || 0,
        parseFloat(stock_quantity) !== undefined ? parseFloat(stock_quantity) : existing.stock_quantity,
        (stock_unit || existing.stock_unit || 'pieces').trim(),
        req.params.id,
      ]
    );

    const updated = await get(`SELECT * FROM raw_materials WHERE id = ?`, [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'A raw material with this name already exists.' });
    }
    console.error('❌ RAW MATERIALS update ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    const existing = await get(`SELECT * FROM raw_materials WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await run(`DELETE FROM raw_materials WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('❌ RAW MATERIALS delete ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE STOCK =================
exports.updateStock = async (req, res) => {
  try {
    const { stock_quantity } = req.body;
    if (stock_quantity === undefined || stock_quantity === null) {
      return res.status(400).json({ message: 'stock_quantity is required' });
    }

    const existing = await get(`SELECT * FROM raw_materials WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await run(
      `UPDATE raw_materials SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [parseFloat(stock_quantity), req.params.id]
    );

    const updated = await get(`SELECT * FROM raw_materials WHERE id = ?`, [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('❌ RAW MATERIALS updateStock ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};
