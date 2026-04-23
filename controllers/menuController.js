// menu controller - herkese acik menu listesi
const db = require('../config/db');

async function list(req, res) {
  try {
    const filters = {
      caterer: req.query.caterer || '',
      minPrice: req.query.minPrice || '',
      maxPrice: req.query.maxPrice || ''
    };

    // dinamik WHERE
    const where = ['mi.is_available = TRUE'];
    const params = [];

    if (filters.caterer && !isNaN(parseInt(filters.caterer, 10))) {
      params.push(parseInt(filters.caterer, 10));
      where.push('mi.caterer_id = $' + params.length);
    }
    if (filters.minPrice !== '' && !isNaN(parseFloat(filters.minPrice))) {
      params.push(parseFloat(filters.minPrice));
      where.push('mi.price >= $' + params.length);
    }
    if (filters.maxPrice !== '' && !isNaN(parseFloat(filters.maxPrice))) {
      params.push(parseFloat(filters.maxPrice));
      where.push('mi.price <= $' + params.length);
    }

    const sql = `
      SELECT mi.*, u.name as caterer_name, u.id as caterer_id,
        (SELECT AVG(r.menu_rating)::numeric(3,2) FROM ratings r
           JOIN orders o ON o.id = r.order_id
           WHERE r.menu_item_id = mi.id AND o.status = 'completed') as menu_avg,
        (SELECT COUNT(*) FROM ratings r
           JOIN orders o ON o.id = r.order_id
           WHERE r.menu_item_id = mi.id AND o.status = 'completed') as menu_rating_count,
        (SELECT AVG(r.caterer_rating)::numeric(3,2) FROM ratings r
           JOIN orders o ON o.id = r.order_id
           WHERE r.caterer_id = mi.caterer_id AND o.status = 'completed') as caterer_avg
      FROM menu_items mi
      JOIN users u ON u.id = mi.caterer_id
      WHERE ${where.join(' AND ')}
      ORDER BY mi.created_at DESC
    `;

    const result = await db.query(sql, params);

    const catRes = await db.query(
      "SELECT id, name FROM users WHERE role = 'caterer' ORDER BY name"
    );

    res.render('user/menu', {
      title: 'Menüler',
      items: result.rows,
      caterers: catRes.rows,
      filters
    });
  } catch (err) {
    console.error('menu list error:', err);
    res.status(500).send('Menü listesi yüklenemedi');
  }
}

module.exports = { list };
