-- Sofranet schema - extended with order and rating tables

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'caterer', 'user')),
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_code VARCHAR(10),
  two_factor_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);


CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  caterer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image_path VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_caterer ON menu_items(caterer_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);


CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  caterer_id INTEGER REFERENCES users(id) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'paid',
  delivery_address TEXT,
  delivery_lat NUMERIC(10, 7),
  delivery_lng NUMERIC(10, 7),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_caterer ON orders(caterer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);


CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  item_price NUMERIC(10, 2) NOT NULL,
  customization_extra NUMERIC(10, 2) DEFAULT 0
);


CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id),
  caterer_id INTEGER REFERENCES users(id) NOT NULL,
  menu_rating INTEGER CHECK (menu_rating BETWEEN 1 AND 5),
  caterer_rating INTEGER CHECK (caterer_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_menu_item ON ratings(menu_item_id);
CREATE INDEX idx_ratings_caterer ON ratings(caterer_id);


CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_created ON logs(created_at);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_user ON logs(user_id);
