const { query } = require('../lib/db');
const { createId } = require('../lib/ids');

function mapCustomer(row) {
  return {
    _id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const params = [];
    let where = '';

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      where = `WHERE LOWER(name) LIKE $1 OR LOWER(COALESCE(phone, '')) LIKE $1`;
    }

    const customers = await query(
      `
        SELECT id, name, phone, email, address, created_at, updated_at
        FROM customers
        ${where}
        ORDER BY name ASC
      `,
      params
    );

    res.status(200).json(customers.rows.map(mapCustomer));
  } catch (err) {
    next(err);
  }
};

exports.getOrCreateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    let customer = null;

    if (phone && !String(phone).includes('-')) {
      const existing = await query(
        `
          SELECT id, name, phone, email, address, created_at, updated_at
          FROM customers
          WHERE phone = $1
          LIMIT 1
        `,
        [phone]
      );
      customer = existing.rows[0] || null;
    }

    if (!customer) {
      const created = await query(
        `
          INSERT INTO customers (id, name, phone, address, email)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, phone, email, address, created_at, updated_at
        `,
        [createId(), name, phone || null, address || null, email || null]
      );
      customer = created.rows[0];
    } else {
      const updated = await query(
        `
          UPDATE customers
          SET
            name = COALESCE($1, name),
            address = COALESCE($2, address),
            email = COALESCE($3, email),
            updated_at = NOW()
          WHERE id = $4
          RETURNING id, name, phone, email, address, created_at, updated_at
        `,
        [name || null, address || null, email || null, customer.id]
      );
      customer = updated.rows[0];
    }

    res.status(200).json(mapCustomer(customer));
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await query(
      `
        SELECT id, name, phone, email, address, created_at, updated_at
        FROM customers
        WHERE id = $1
        LIMIT 1
      `,
      [req.params.id]
    );
    if (customer.rowCount === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(mapCustomer(customer.rows[0]));
  } catch (err) {
    next(err);
  }
};
