export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('STUDENT','VENDOR','ADMIN','STAFF')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_no TEXT NOT NULL UNIQUE,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  dietary_preferences TEXT
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  outlet_name TEXT NOT NULL,
  operating_hours TEXT NOT NULL,
  avg_rating REAL NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'APPROVED',
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admin_level TEXT NOT NULL,
  department TEXT NOT NULL,
  access_permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  assigned_outlet TEXT NOT NULL,
  permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  category TEXT NOT NULL,
  prep_time INTEGER NOT NULL CHECK(prep_time > 0),
  stock INTEGER NOT NULL CHECK(stock >= 0),
  is_available INTEGER NOT NULL DEFAULT 1,
  image_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK(capacity > 0),
  booked_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id),
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  status TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL,
  total_price REAL NOT NULL CHECK(total_price >= 0),
  scheduled_pickup_time TEXT,
  estimated_pickup_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  customizations TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  transaction_ref TEXT NOT NULL,
  failure_reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS queue_tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  queue_number TEXT NOT NULL UNIQUE,
  estimated_wait INTEGER NOT NULL,
  status TEXT NOT NULL,
  called_at TEXT,
  served_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_menu_vendor ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status ON orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_tickets(status);
`;
