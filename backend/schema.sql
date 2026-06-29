-- SQLite Schema for Inventory Management System

-- Enable Foreign Keys (Must be executed on each connection)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_masters (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  has_gsm INTEGER DEFAULT 1,
  has_size INTEGER DEFAULT 1,
  has_color INTEGER DEFAULT 0,
  description TEXT,
  category TEXT DEFAULT 'Standard Envelope',
  gsm_options TEXT DEFAULT '[]',
  size_options TEXT DEFAULT '[]',
  color_options TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  is_manual_product INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
  is_active INTEGER DEFAULT 1,
  has_gsm INTEGER DEFAULT 1,
  has_size INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  variant_id TEXT UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id TEXT,
  quantity INTEGER DEFAULT 0,
  price REAL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 50,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
  discount_value REAL,
  markup REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  priority INTEGER DEFAULT 100,
  applied_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  bill_number TEXT UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  subtotal REAL,
  cgst_rate REAL DEFAULT 6,
  sgst_rate REAL DEFAULT 6,
  cgst REAL,
  sgst REAL,
  igst REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  grand_total REAL,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  variant_id TEXT,
  product_id TEXT,
  product_name TEXT,
  display_name TEXT,
  gsm TEXT,
  size TEXT,
  color TEXT,
  quantity INTEGER,
  price REAL,
  item_total REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price REAL DEFAULT 0,
  stock_quantity REAL DEFAULT 0,
  stock_unit TEXT DEFAULT 'pieces',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS envelopes (
  id TEXT PRIMARY KEY,
  size TEXT,
  material_type TEXT,
  gsm INTEGER,
  color TEXT,
  price REAL DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id TEXT PRIMARY KEY,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES product_masters(id) ON DELETE CASCADE,
  envelope_id TEXT REFERENCES envelopes(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  reference TEXT,
  reason TEXT,
  date TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_tier_products (
  tier_id TEXT REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES product_masters(id) ON DELETE CASCADE,
  PRIMARY KEY (tier_id, product_id)
);

CREATE TABLE IF NOT EXISTS pricing_tier_variants (
  tier_id TEXT REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  PRIMARY KEY (tier_id, variant_id)
);
