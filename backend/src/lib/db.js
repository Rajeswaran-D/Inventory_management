const { Pool } = require('pg');
require('dotenv').config();

// ✅ Connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:pradeepan5525@localhost:5432/inventory_management';

const pool = new Pool({
  connectionString,
  ssl: false,
});

// ✅ Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
}

// ✅ Query helper
async function query(text, params = [], client = null) {
  const executor = client || pool;
  return executor.query(text, params);
}

// ✅ Transaction helper
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Transaction Error:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// ✅ Initialize DB
async function initDb() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_masters (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        has_gsm BOOLEAN DEFAULT TRUE,
        has_size BOOLEAN DEFAULT TRUE,
        has_color BOOLEAN DEFAULT FALSE,
        description TEXT,
        category TEXT DEFAULT 'Standard Envelope',
        gsm_options JSONB DEFAULT '[]'::jsonb,
        size_options JSONB DEFAULT '[]'::jsonb,
        color_options JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        is_manual_product BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT REFERENCES product_masters(id) ON DELETE CASCADE,
        gsm INTEGER,
        size TEXT,
        color TEXT,
        sku TEXT UNIQUE,
        display_name TEXT NOT NULL,
        variant_key TEXT UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        variant_id TEXT UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
        product_id TEXT,
        quantity INTEGER DEFAULT 0,
        price NUMERIC(12,2) DEFAULT 0,
        minimum_stock_level INTEGER DEFAULT 50,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        description TEXT,
        tier_type TEXT,
        min_quantity INTEGER,
        max_quantity INTEGER,
        customer_type TEXT,
        discount_type TEXT,
        discount_value NUMERIC(12,2),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        bill_number TEXT UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        customer_gstin TEXT,
        subtotal NUMERIC(12,2),
        cgst NUMERIC(12,2),
        sgst NUMERIC(12,2),
        grand_total NUMERIC(12,2),
        date TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
        variant_id TEXT,
        product_name TEXT,
        gsm TEXT,
        size TEXT,
        color TEXT,
        quantity INTEGER,
        price NUMERIC(12,2),
        item_total NUMERIC(12,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ✅ Ensure missing columns (safe update)
    await query(`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_address TEXT;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_gstin TEXT;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 6;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 6;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS igst NUMERIC(12,2) DEFAULT 0;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS round_off NUMERIC(12,2) DEFAULT 0;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE product_masters ADD COLUMN IF NOT EXISTS is_manual_product BOOLEAN DEFAULT FALSE;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS gsm INTEGER;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS size TEXT;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color TEXT;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku TEXT;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS has_gsm BOOLEAN DEFAULT TRUE;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS has_size BOOLEAN DEFAULT TRUE;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_id TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS display_name TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS gsm TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS size TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS color TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name TEXT;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS quantity INTEGER;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS item_total NUMERIC(12,2);
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);

    console.log("✅ Tables created / verified (schema updated)");

  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  initDb,
  testConnection,
};