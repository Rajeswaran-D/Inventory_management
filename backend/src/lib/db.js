const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

let dbInstance = null;

// Database Connection Factory
async function initDbConnection() {
  if (dbInstance) return dbInstance;
  
  // Use environment variable provided by Electron, fallback to local path
  const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../database.sqlite');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Explicitly enable foreign key constraints 
  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

function processQueryAndParams(text, params) {
  let sqliteText = text.replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP");
  let newParams = params;

  // Convert array parameters to named parameters if the query uses positional $1, $2
  if (Array.isArray(params) && /\$[0-9]+/.test(sqliteText)) {
    newParams = {};
    params.forEach((val, idx) => {
      newParams[`$${idx+1}`] = val;
    });
  }

  return { sqliteText, newParams };
}

// -------------------------------------------------------------
// Core Database Wrapper 
// -------------------------------------------------------------

async function run(text, params = [], client = null) {
  const db = client || await initDbConnection();
  const { sqliteText, newParams } = processQueryAndParams(text, params);
  const result = await db.run(sqliteText, newParams);
  return { lastID: result.lastID, changes: result.changes };
}

async function get(text, params = [], client = null) {
  const db = client || await initDbConnection();
  const { sqliteText, newParams } = processQueryAndParams(text, params);
  return await db.get(sqliteText, newParams);
}

async function all(text, params = [], client = null) {
  const db = client || await initDbConnection();
  const { sqliteText, newParams } = processQueryAndParams(text, params);
  return await db.all(sqliteText, newParams);
}

// Legacy postgresql-compatible function for untouched controllers
async function query(text, params = [], client = null) {
  const db = client || await initDbConnection();
  const { sqliteText, newParams } = processQueryAndParams(text, params);
  
  try {
    const isSelect = /^\s*SELECT/i.test(sqliteText);
    const hasReturning = /\bRETURNING\b/i.test(sqliteText);

    if (isSelect || hasReturning) {
      const rows = await db.all(sqliteText, newParams);
      return { rows, rowCount: rows.length };
    } else {
      const result = await db.run(sqliteText, newParams);
      return { rows: [], rowCount: result.changes || 0 };
    }
  } catch (error) {
    if (error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
       error.code = '23505'; 
    }
    throw error;
  }
}

// -------------------------------------------------------------
// Transaction Management (Mimics Postgres withTransaction)
// -------------------------------------------------------------

async function withTransaction(work) {
  const db = await initDbConnection();
  await db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const result = await work(db); 
    await db.exec('COMMIT TRANSACTION');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK TRANSACTION');
    console.error("❌ Transaction Error:", error.message);
    throw error;
  }
}

// -------------------------------------------------------------
// Schema Initialization
// -------------------------------------------------------------

async function initDb() {
  const db = await initDbConnection();
  try {
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await db.exec(schemaSql);
    console.log("✅ DB Init: Connected to SQLite and verified tables.");
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// Healthcheck & Legacy Support
// -------------------------------------------------------------

async function testConnection() {
  try {
    await initDbConnection();
    console.log("✅ Connected to SQLite database successfully");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
}

module.exports = {
  // Mock 'pool' for any legacy PG calls expecting it
  get pool() { 
    return {
      query: (text, params) => query(text, params)
    };
  },
  query,
  run,
  get,
  all,
  withTransaction,
  initDb,
  testConnection,
};
