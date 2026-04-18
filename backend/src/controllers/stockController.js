const { query, withTransaction } = require('../lib/db');
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
  };
}

function mapTransaction(row) {
  return {
    _id: row.id,
    variantId: row.variant_id,
    productId: row.product_id,
    envelopeId: row.envelope_id,
    type: row.type,
    quantity: row.quantity,
    reference: row.reference,
    reason: row.reason,
    date: row.date,
    envelope: row.size
      ? {
          _id: row.envelope_id,
          size: row.size,
          materialType: row.material_type,
          gsm: row.gsm,
          color: row.color,
        }
      : null,
  };
}

exports.recordStockIn = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;

    const result = await withTransaction(async (client) => {
      const transaction = await query(
        `
          INSERT INTO stock_transactions (id, envelope_id, quantity, type, date)
          VALUES ($1, $2, $3, 'IN', COALESCE($4, NOW()))
          RETURNING id, variant_id, product_id, envelope_id, type, quantity, reference, reason, date
        `,
        [createId(), envelopeId, Number(quantity), date || null],
        client
      );

      const updated = await query(
        `
          UPDATE envelopes
          SET quantity = quantity + $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, size, material_type, gsm, color, price, quantity, is_active
        `,
        [Number(quantity), envelopeId],
        client
      );

      if (updated.rowCount === 0) {
        throw new Error('Envelope not found');
      }

      return {
        transaction: transaction.rows[0],
        envelope: updated.rows[0],
      };
    });

    res.status(201).json({
      message: 'Stock added successfully',
      transaction: mapTransaction(result.transaction),
      updatedEnvelope: mapEnvelope(result.envelope),
    });
  } catch (err) {
    next(err);
  }
};

exports.recordStockOut = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;

    const result = await withTransaction(async (client) => {
      const envelopeResult = await query(
        `
          SELECT id, size, material_type, gsm, color, price, quantity, is_active
          FROM envelopes
          WHERE id = $1 AND is_active = TRUE
          LIMIT 1
        `,
        [envelopeId],
        client
      );

      if (envelopeResult.rowCount === 0) {
        throw new Error('Envelope not found or deactivated.');
      }

      const envelope = envelopeResult.rows[0];
      if (Number(envelope.quantity) < Number(quantity)) {
        throw new Error(`Insufficient stock. Current: ${envelope.quantity}`);
      }

      const transaction = await query(
        `
          INSERT INTO stock_transactions (id, envelope_id, quantity, type, date)
          VALUES ($1, $2, $3, 'OUT', COALESCE($4, NOW()))
          RETURNING id, variant_id, product_id, envelope_id, type, quantity, reference, reason, date
        `,
        [createId(), envelopeId, Number(quantity), date || null],
        client
      );

      const updated = await query(
        `
          UPDATE envelopes
          SET quantity = quantity - $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, size, material_type, gsm, color, price, quantity, is_active
        `,
        [Number(quantity), envelopeId],
        client
      );

      return {
        transaction: transaction.rows[0],
        envelope: updated.rows[0],
      };
    });

    res.status(201).json({
      message: 'Stock removed successfully',
      transaction: mapTransaction(result.transaction),
      updatedEnvelope: mapEnvelope(result.envelope),
    });
  } catch (err) {
    next(err);
  }
};

exports.getStockHistory = async (req, res, next) => {
  try {
    const { envelopeId, type, startDate, endDate } = req.query;
    const params = [];
    const clauses = [];

    if (envelopeId) {
      params.push(envelopeId);
      clauses.push(`st.envelope_id = $${params.length}`);
    }
    if (type) {
      params.push(type);
      clauses.push(`st.type = $${params.length}`);
    }
    if (startDate && endDate) {
      params.push(startDate);
      params.push(endDate);
      clauses.push(`st.date BETWEEN $${params.length - 1} AND $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const history = await query(
      `
        SELECT
          st.id, st.variant_id, st.product_id, st.envelope_id, st.type, st.quantity, st.reference, st.reason, st.date,
          e.size, e.material_type, e.gsm, e.color
        FROM stock_transactions st
        LEFT JOIN envelopes e ON e.id = st.envelope_id
        ${where}
        ORDER BY st.date DESC
      `,
      params
    );

    res.status(200).json(history.rows.map(mapTransaction));
  } catch (err) {
    next(err);
  }
};
