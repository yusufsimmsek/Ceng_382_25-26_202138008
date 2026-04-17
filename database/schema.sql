-- Sofranet schema - users, menu, orders, ratings, logs + customization tables

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


-- customization yapisi: option_groups -> options ve removable_ingredients

CREATE TABLE option_groups (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_option_groups_menu ON option_groups(menu_item_id);


CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  extra_price NUMERIC(10, 2) DEFAULT 0
);

CREATE INDEX idx_options_group ON options(group_id);


CREATE TABLE removable_ingredients (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE INDEX idx_removables_menu ON removable_ingredients(menu_item_id);


-- siparis edilen item'in secimleri

CREATE TABLE order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  option_id INTEGER REFERENCES options(id) NOT NULL
);

CREATE INDEX idx_order_item_options_item ON order_item_options(order_item_id);


CREATE TABLE order_item_removals (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  removable_ingredient_id INTEGER REFERENCES removable_ingredients(id) NOT NULL
);

CREATE INDEX idx_order_item_removals_item ON order_item_removals(order_item_id);
