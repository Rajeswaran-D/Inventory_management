const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkAndCreateDb() {
  const dbUrl = process.env.DATABASE_URL;
  const dbName = 'inventory_management';
  
  // Connect to the 'postgres' default database first
  const baseConnectionString = dbUrl.replace(/\/[^/]+$/, '/postgres');
  
  const client = new Client({
    connectionString: baseConnectionString,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL (postgres)');
    
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err.message);
  } finally {
    await client.end();
  }
}

checkAndCreateDb();
