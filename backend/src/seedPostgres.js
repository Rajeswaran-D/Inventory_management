require('dotenv').config();

const { initDb, pool } = require('./lib/db');
const { autoSeed } = require('./autoSeed');
const { autoSeedUsers } = require('./autoSeedUsers');

async function run() {
  try {
    await initDb();
    await autoSeed();
    await autoSeedUsers();
    console.log('PostgreSQL seed complete');
  } catch (error) {
    console.error('PostgreSQL seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
