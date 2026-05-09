// admin controller - dashboard + yonetim sayfalari
const db = require('../config/db');
const { getPagination } = require('../utils/pagination');

async function dashboard(req, res) {
  try {
    const statsRes = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'caterer') as total_caterers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE) as today_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_volume,
        (SELECT COUNT(*) FROM menu_items WHERE is_available = TRUE) as active_menu_items,
        (SELECT COUNT(*) FROM ratings) as total_ratings
    `);

    const topRes = await db.query(`
      SELECT u.id, u.name, u.email,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM users u
      LEFT JOIN orders o ON o.caterer_id = u.id
      WHERE u.role = 'caterer'
      GROUP BY u.id, u.name, u.email
      ORDER BY order_count DESC LIMIT 5
    `);

    const recentRes = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at,
        cu.name as user_name, cu.email as user_email,
        cc.name as caterer_name
      FROM orders o
      JOIN users cu ON cu.id = o.user_id
      JOIN users cc ON cc.id = o.caterer_id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: statsRes.rows[0],
      topCaterers: topRes.rows,
      recentOrders: recentRes.rows
    });
  } catch (err) {
    console.error('admin dashboard error:', err);
    res.status(500).send('Dashboard yüklenemedi');
  }
}

async function usersList(req, res) {
  try {
    const filters = {
      q: req.query.q || '',
      role: req.query.role || ''
    };
    const page = parseInt(req.query.page, 10) || 1;

    const where = [];
    const params = [];
    if (filters.q) {
      params.push('%' + filters.q + '%');
      where.push('(name ILIKE $' + params.length + ' OR email ILIKE $' + params.length + ')');
    }
    if (['user', 'caterer', 'admin'].includes(filters.role)) {
      params.push(filters.role);
      where.push('role = $' + params.length);
    }
    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.query('SELECT COUNT(*) FROM users ' + whereSql, params);
    const pag = getPagination(page, 20, parseInt(countRes.rows[0].count, 10));

    params.push(pag.limit);
    params.push(pag.offset);
    const listRes = await db.query(
      `SELECT id, name, email, role, phone, address, created_at
       FROM users ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.render('admin/users', {
      title: 'Kullanıcılar',
      users: listRes.rows,
      filters,
      pagination: pag,
      currentQuery: req.query
    });
  } catch (err) {
    console.error('admin users list error:', err);
    res.status(500).send('Liste yüklenemedi');
  }
}

async function caterersList(req, res) {
  try {
    const filters = { q: req.query.q || '' };
    const page = parseInt(req.query.page, 10) || 1;

    const where = ["u.role = 'caterer'"];
    const params = [];
    if (filters.q) {
      params.push('%' + filters.q + '%');
      where.push('(u.name ILIKE $' + params.length + ' OR u.email ILIKE $' + params.length + ')');
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const countRes = await db.query('SELECT COUNT(*) FROM users u ' + whereSql, params);
    const pag = getPagination(page, 20, parseInt(countRes.rows[0].count, 10));

    params.push(pag.limit);
    params.push(pag.offset);
    const listRes = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.address,
        (SELECT COUNT(*) FROM orders WHERE caterer_id = u.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE caterer_id = u.id AND status = 'completed') as revenue,
        (SELECT AVG(caterer_rating)::numeric(3,2) FROM ratings WHERE caterer_id = u.id) as avg_rating
       FROM users u
       ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.render('admin/caterers', {
      title: 'Caterer\'lar',
      caterers: listRes.rows,
      filters,
      pagination: pag,
      currentQuery: req.query
    });
  } catch (err) {
    console.error('admin caterers list error:', err);
    res.status(500).send('Liste yüklenemedi');
  }
}

async function ordersList(req, res) {
  try {
    const filters = {
      status: req.query.status || '',
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || '',
      q: req.query.q || ''
    };
    const page = parseInt(req.query.page, 10) || 1;

    const where = [];
    const params = [];

    if (['pending', 'preparing', 'completed', 'cancelled'].includes(filters.status)) {
      params.push(filters.status);
      where.push('o.status = $' + params.length);
    }
    if (filters.date_from) {
      params.push(filters.date_from);
      where.push('o.created_at >= $' + params.length);
    }
    if (filters.date_to) {
      params.push(filters.date_to);
      where.push('o.created_at <= ($' + params.length + ')::date + INTERVAL \'1 day\'');
    }
    if (filters.q) {
      params.push('%' + filters.q + '%');
      const p = params.length;
      where.push('(cu.name ILIKE $' + p + ' OR cu.email ILIKE $' + p + ' OR cc.name ILIKE $' + p + ' OR cc.email ILIKE $' + p + ')');
    }
    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM orders o
       JOIN users cu ON cu.id = o.user_id
       JOIN users cc ON cc.id = o.caterer_id
       ${whereSql}`,
      params
    );
    const pag = getPagination(page, 20, parseInt(countRes.rows[0].count, 10));

    params.push(pag.limit);
    params.push(pag.offset);
    const listRes = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
        cu.name as user_name, cu.email as user_email,
        cc.name as caterer_name
       FROM orders o
       JOIN users cu ON cu.id = o.user_id
       JOIN users cc ON cc.id = o.caterer_id
       ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.render('admin/orders', {
      title: 'Tüm Siparişler',
      orders: listRes.rows,
      filters,
      pagination: pag,
      currentQuery: req.query
    });
  } catch (err) {
    console.error('admin orders list error:', err);
    res.status(500).send('Liste yüklenemedi');
  }
}

async function logsList(req, res) {
  try {
    const filters = {
      action: req.query.action || '',
      q: req.query.q || '',
      ip: req.query.ip || '',
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || ''
    };
    const page = parseInt(req.query.page, 10) || 1;

    const where = [];
    const params = [];

    if (filters.action) {
      params.push(filters.action);
      where.push('l.action = $' + params.length);
    }
    if (filters.q) {
      params.push('%' + filters.q + '%');
      where.push('(u.email ILIKE $' + params.length + ' OR u.name ILIKE $' + params.length + ')');
    }
    if (filters.ip) {
      params.push('%' + filters.ip + '%');
      where.push('l.ip_address LIKE $' + params.length);
    }
    if (filters.date_from) {
      params.push(filters.date_from);
      where.push('l.created_at >= $' + params.length);
    }
    if (filters.date_to) {
      params.push(filters.date_to);
      where.push('l.created_at <= ($' + params.length + ')::date + INTERVAL \'1 day\'');
    }
    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM logs l LEFT JOIN users u ON u.id = l.user_id ${whereSql}`,
      params
    );
    const pag = getPagination(page, 50, parseInt(countRes.rows[0].count, 10));

    params.push(pag.limit);
    params.push(pag.offset);
    const listRes = await db.query(
      `SELECT l.id, l.action, l.details, l.ip_address, l.created_at,
        u.email as user_email, u.name as user_name, u.role as user_role
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       ${whereSql}
       ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // dropdown icin distinct action listesi
    const actionsRes = await db.query(
      'SELECT DISTINCT action FROM logs ORDER BY action'
    );

    res.render('admin/logs', {
      title: 'Sistem Logları',
      logs: listRes.rows,
      actions: actionsRes.rows.map(r => r.action),
      filters,
      pagination: pag,
      currentQuery: req.query
    });
  } catch (err) {
    console.error('admin logs list error:', err);
    res.status(500).send('Loglar yüklenemedi');
  }
}

module.exports = { dashboard, usersList, caterersList, ordersList, logsList };
