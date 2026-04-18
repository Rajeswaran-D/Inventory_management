const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT current_database()');
    console.log('Current DB:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed!');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}
check();
