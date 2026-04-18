const { query } = require('../lib/db');
const { createId } = require('../lib/ids');

function mapEnvelope(row) {
  return {
    _id: row.id,
    size: row.size,
    materialType: row.material_type,
    gsm: row.gsm,
    color: row.color,
    price: Number(row.price),
    quantity: row.quantity,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.getAllEnvelopes = async (req, res, next) => {
  try {
    const { search, materialType, size, gsm } = req.query;
    const params = [];
    const clauses = ['is_active = TRUE'];

    if (materialType) {
      params.push(materialType);
      clauses.push(`material_type = $${params.length}`);
    }
    if (size) {
      params.push(size);
      clauses.push(`size = $${params.length}`);
    }
    if (gsm) {
      params.push(Number(gsm));
      clauses.push(`gsm = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      clauses.push(`(LOWER(size) LIKE $${params.length} OR LOWER(material_type) LIKE $${params.length})`);
    }

    const envelopes = await query(
      `
        SELECT id, size, material_type, gsm, color, price, quantity, is_active, created_at, updated_at
        FROM envelopes
        WHERE ${clauses.join(' AND ')}
        ORDER BY size ASC, material_type ASC
      `,
      params
    );
    res.status(200).json(envelopes.rows.map(mapEnvelope));
  } catch (err) {
    next(err);
  }
};

exports.getEnvelopeById = async (req, res, next) => {
  try {
    const envelope = await query(
      `
        SELECT id, size, material_type, gsm, color, price, quantity, is_active, created_at, updated_at
        FROM envelopes
        WHERE id = $1
        LIMIT 1
      `,
      [req.params.id]
    );
    if (envelope.rowCount === 0) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    res.status(200).json(mapEnvelope(envelope.rows[0]));
  } catch (err) {
    next(err);
  }
};

exports.createEnvelope = async (req, res, next) => {
  try {
    const { size, materialType, gsm, color, price } = req.body;

    const existing = await query(
      `
        SELECT id
        FROM envelopes
        WHERE size = $1
          AND material_type = $2
          AND COALESCE(gsm, -1) = COALESCE($3, -1)
          AND COALESCE(color, '') = COALESCE($4, '')
        LIMIT 1
      `,
      [size, materialType, gsm ?? null, color || null]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'A similar product already exists.' });
    }

    const created = await query(
      `
        INSERT INTO envelopes (id, size, material_type, gsm, color, price, quantity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, 0, TRUE)
        RETURNING id, size, material_type, gsm, color, price, quantity, is_active, created_at, updated_at
      `,
      [createId(), size, materialType, gsm ?? null, color || null, Number(price || 0)]
    );

    res.status(201).json(mapEnvelope(created.rows[0]));
  } catch (err) {
    next(err);
  }
};

exports.updateEnvelope = async (req, res, next) => {
  try {
    const { size, materialType, gsm, color, price, quantity, isActive } = req.body;
    const updated = await query(
      `
        UPDATE envelopes
        SET
          size = COALESCE($1, size),
          material_type = COALESCE($2, material_type),
          gsm = COALESCE($3, gsm),
          color = COALESCE($4, color),
          price = COALESCE($5, price),
          quantity = COALESCE($6, quantity),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
        WHERE id = $8
        RETURNING id, size, material_type, gsm, color, price, quantity, is_active, created_at, updated_at
      `,
      [
        size || null,
        materialType || null,
        gsm ?? null,
        color || null,
        price !== undefined ? Number(price) : null,
        quantity !== undefined ? Number(quantity) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        req.params.id,
      ]
    );
    if (updated.rowCount === 0) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    res.status(200).json(mapEnvelope(updated.rows[0]));
  } catch (err) {
    next(err);
  }
};

exports.deleteEnvelope = async (req, res, next) => {
  try {
    const deleted = await query(
      `
        UPDATE envelopes
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [req.params.id]
    );
    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    res.status(200).json({ message: 'Envelope deleted successfully' });
  } catch (err) {
    next(err);
  }
};
