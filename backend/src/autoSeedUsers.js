const { query } = require('./lib/db');
const { createId } = require('./lib/ids');
const { hashPassword } = require('./lib/auth');

async function autoSeedUsers() {
  try {
    const adminExists = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['admin@swamy.com']
    );

    if (adminExists.rowCount > 0) {
      console.log('Admin user already exists');
      return;
    }

    await query(
      `
        INSERT INTO users (id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [createId(), 'Admin User', 'admin@swamy.com', await hashPassword('admin@123'), 'admin', true]
    );
    console.log('Admin user created (admin@swamy.com / admin@123)');

    await query(
      `
        INSERT INTO users (id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [createId(), 'Employee User', 'employee@swamy.com', await hashPassword('employee@123'), 'employee', true]
    );
    console.log('Employee user created (employee@swamy.com / employee@123)');
  } catch (error) {
    console.error('Error auto-seeding users:', error.message);
  }
}

module.exports = { autoSeedUsers };
