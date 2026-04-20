-- Sofranet seed data - test users + menu samples

-- ============================
-- users
-- ============================
-- sifreler: admin123, caterer123, user123

INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude) VALUES
('Sistem Yöneticisi', 'admin@sofranet.com',
  '$2b$10$pWPhtTZ8QutKpccw9rHgUeavzJ4.m.6l4RBDxZLUHr.D..sIzbfi6',
  '05000000000', 'admin', NULL, NULL, NULL);

INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude) VALUES
('Lezzet Mutfağı', 'lezzet@sofranet.com',
  '$2b$10$Vn5WtPvNI8CI6/BW4gz0Le0PbEAnyVhCvsTkn.iR/yBdx3jDxTUaG',
  '05311112233', 'caterer',
  'Caferağa Mah. Moda Cad. No:45, Kadıköy/İstanbul',
  40.9928, 29.0264);

INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude) VALUES
('Mahalle Sofrası', 'mahalle@sofranet.com',
  '$2b$10$Vn5WtPvNI8CI6/BW4gz0Le0PbEAnyVhCvsTkn.iR/yBdx3jDxTUaG',
  '05322223344', 'caterer',
  'Cihangir Mah. Sıraselviler Cad. No:12, Beyoğlu/İstanbul',
  41.0319, 28.9806);

INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude) VALUES
('Ali Demir', 'ali@example.com',
  '$2b$10$ogWo3/KqJuMcVCVjMCrrROLUVv7vvG39BeoIN2eVMx74e4faQEKP2',
  '05333334455', 'user',
  'Kadıköy, İstanbul', 40.9869, 29.0250);

INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude) VALUES
('Ayşe Kaya', 'ayse@example.com',
  '$2b$10$ogWo3/KqJuMcVCVjMCrrROLUVv7vvG39BeoIN2eVMx74e4faQEKP2',
  '05344445566', 'user',
  'Beşiktaş, İstanbul', 41.0428, 29.0073);


-- ============================
-- menu_items
-- ============================

-- Lezzet Mutfagi (caterer_id = 2)  ->  item id'leri 1,2,3,4
INSERT INTO menu_items (caterer_id, name, price, description, image_path) VALUES
(2, 'Lahmacun', 65.00, 'İnce hamur, taze kıyma harcı, fırından yeni', '/images/no-image.svg'),
(2, 'Adana Kebap', 220.00, 'Acılı, közlenmiş sebzelerle', '/images/no-image.svg'),
(2, 'Künefe', 95.00, 'Sıcak peynirli, antep fıstıklı', '/images/no-image.svg'),
(2, 'Mercimek Çorbası', 45.00, 'Geleneksel ev tarifi', '/images/no-image.svg');

-- Mahalle Sofrasi (caterer_id = 3)  ->  item id'leri 5,6,7,8
INSERT INTO menu_items (caterer_id, name, price, description, image_path) VALUES
(3, 'İskender', 280.00, 'Yoğurtlu, tereyağlı sosla', '/images/no-image.svg'),
(3, 'Mantı', 150.00, 'Kayseri usulü, yoğurtlu sarımsaklı', '/images/no-image.svg'),
(3, 'Pide (Kıymalı)', 120.00, 'Açık tepsi, taze kıyma', '/images/no-image.svg'),
(3, 'Ayran', 25.00, 'Soğuk, evde yapım', '/images/no-image.svg');


-- ============================
-- option_groups + options
-- ============================

-- Lahmacun (menu_item_id=1) - Soslar grubu
INSERT INTO option_groups (menu_item_id, name, is_required, min_select, max_select) VALUES
(1, 'Soslar', FALSE, 0, 3);  -- group id = 1

INSERT INTO options (group_id, name, extra_price) VALUES
(1, 'Ketçap', 0),
(1, 'Acı Sos', 0),
(1, 'Sarımsaklı Yoğurt', 15);

-- Adana Kebap (menu_item_id=2) - Pilav + İçecek
INSERT INTO option_groups (menu_item_id, name, is_required, min_select, max_select) VALUES
(2, 'Pilav', FALSE, 0, 1),     -- group id = 2
(2, 'İçecek', FALSE, 0, 1);    -- group id = 3

INSERT INTO options (group_id, name, extra_price) VALUES
(2, 'Bulgur Pilavı', 25),
(2, 'Pirinç Pilavı', 25),
(3, 'Ayran', 25),
(3, 'Şalgam', 20);

-- İskender (menu_item_id=5) - Porsiyon
INSERT INTO option_groups (menu_item_id, name, is_required, min_select, max_select) VALUES
(5, 'Porsiyon', TRUE, 1, 1);   -- group id = 4

INSERT INTO options (group_id, name, extra_price) VALUES
(4, 'Yarım', 0),
(4, 'Tam', 80);

-- Pide (menu_item_id=7) - Boyut
INSERT INTO option_groups (menu_item_id, name, is_required, min_select, max_select) VALUES
(7, 'Boyut', TRUE, 1, 1);      -- group id = 5

INSERT INTO options (group_id, name, extra_price) VALUES
(5, 'Küçük', 0),
(5, 'Orta', 30),
(5, 'Büyük', 60);


-- ============================
-- removable_ingredients
-- ============================

-- Lahmacun
INSERT INTO removable_ingredients (menu_item_id, name) VALUES
(1, 'Soğan'),
(1, 'Maydanoz'),
(1, 'Limon');

-- İskender
INSERT INTO removable_ingredients (menu_item_id, name) VALUES
(5, 'Tereyağı'),
(5, 'Yoğurt');

-- Pide
INSERT INTO removable_ingredients (menu_item_id, name) VALUES
(7, 'Maydanoz');
