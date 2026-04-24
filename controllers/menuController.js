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

async function detail(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).send('Menü bulunamadi');
    }

    const itemRes = await db.query(
      `SELECT mi.*, u.name as caterer_name, u.id as caterer_owner_id, u.address as caterer_address,
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
       WHERE mi.id = $1 AND mi.is_available = TRUE`,
      [id]
    );

    if (itemRes.rows.length === 0) {
      return res.status(404).send('Menü bulunamadi');
    }
    const item = itemRes.rows[0];

    const groupsRes = await db.query(
      'SELECT * FROM option_groups WHERE menu_item_id = $1 ORDER BY id',
      [id]
    );
    const groups = groupsRes.rows;
    for (const g of groups) {
      const optsRes = await db.query(
        'SELECT * FROM options WHERE group_id = $1 ORDER BY id',
        [g.id]
      );
      g.options = optsRes.rows;
    }

    const removablesRes = await db.query(
      'SELECT * FROM removable_ingredients WHERE menu_item_id = $1 ORDER BY id',
      [id]
    );

    const commentsRes = await db.query(
      `SELECT r.menu_rating, r.comment, r.created_at, u.name as user_name
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       JOIN orders o ON o.id = r.order_id
       WHERE r.menu_item_id = $1 AND o.status = 'completed'
         AND r.comment IS NOT NULL AND r.comment != ''
       ORDER BY r.created_at DESC LIMIT 5`,
      [id]
    );

    res.render('user/menu-detail', {
      title: item.name,
      item,
      groups,
      removables: removablesRes.rows,
      recentComments: commentsRes.rows
    });
  } catch (err) {
    console.error('menu detail error:', err);
    res.status(500).send('Detay yüklenemedi');
  }
}

module.exports = { list, detail };
