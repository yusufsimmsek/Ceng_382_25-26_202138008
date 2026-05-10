// menu controller - herkese acik menu listesi
const db = require('../config/db');
const locationService = require('../services/locationService');
const { getPagination } = require('../utils/pagination');

// NOT: Distance Matrix API her cagrida quota tuketiyor. Haversine pre-filter
// (services/locationService.js icindeki filterCaterersByDistance) sayesinde
// sadece olasi adaylar Matrix'e gidiyor - bu sekilde quota israfini onluyoruz.
async function list(req, res) {
  try {
    const filters = {
      caterer: req.query.caterer || '',
      minPrice: req.query.minPrice || '',
      maxPrice: req.query.maxPrice || '',
      radius: req.query.radius || '10'
    };

    // konum filtresi sadece logged-in 'user' icin
    let userLoc = null;
    let locationAvailable = false;
    let nearbyCatererIds = null;
    let catererDistances = {}; // id -> distance (km)
    let mapCaterers = []; // harita icin lightweight obje

    const sessUser = req.session.user;
    if (sessUser && sessUser.role === 'user') {
      const u = await db.query(
        'SELECT latitude, longitude FROM users WHERE id = $1',
        [sessUser.id]
      );
      if (u.rows.length && u.rows[0].latitude != null && u.rows[0].longitude != null) {
        userLoc = {
          lat: Number(u.rows[0].latitude),
          lng: Number(u.rows[0].longitude)
        };
        locationAvailable = true;

        const radiusKm = Math.max(1, parseInt(filters.radius, 10) || 10);

        // tum caterer'lari cek (konumu olanlar)
        const catRes = await db.query(
          "SELECT id, name, latitude, longitude, address FROM users WHERE role = 'caterer' AND latitude IS NOT NULL AND longitude IS NOT NULL"
        );

        const nearby = await locationService.filterCaterersByDistance(
          catRes.rows, userLoc, radiusKm
        );

        nearbyCatererIds = nearby.map((c) => c.id);
        for (const c of nearby) {
          catererDistances[c.id] = c.distance;
        }
        mapCaterers = nearby.map((c) => ({
          id: c.id,
          name: c.name,
          lat: Number(c.latitude),
          lng: Number(c.longitude),
          address: c.address,
          distance: c.distance
        }));
      }
    }

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

    // lokasyon filtresi (sadece nearbyCatererIds varsa)
    if (nearbyCatererIds !== null) {
      if (nearbyCatererIds.length === 0) {
        // hicbir yakın caterer yok -> hicbir item dondur
        where.push('1 = 0');
      } else {
        const placeholders = nearbyCatererIds.map((_, i) => '$' + (params.length + i + 1));
        params.push(...nearbyCatererIds);
        where.push('mi.caterer_id IN (' + placeholders.join(',') + ')');
      }
    }

    const whereSql = where.join(' AND ');
    const page = parseInt(req.query.page, 10) || 1;

    // toplam say
    const countRes = await db.query(
      `SELECT COUNT(*) FROM menu_items mi
       JOIN users u ON u.id = mi.caterer_id
       WHERE ${whereSql}`,
      params
    );
    const pag = getPagination(page, 12, parseInt(countRes.rows[0].count, 10));

    params.push(pag.limit);
    params.push(pag.offset);
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
      WHERE ${whereSql}
      ORDER BY mi.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(sql, params);

    const catListRes = await db.query(
      "SELECT id, name FROM users WHERE role = 'caterer' ORDER BY name"
    );

    res.render('user/menu', {
      title: 'Menüler',
      items: result.rows,
      caterers: catListRes.rows,
      filters,
      locationAvailable,
      catererDistances,
      isUserRole: sessUser && sessUser.role === 'user',
      needsMaps: locationAvailable,
      userLat: userLoc ? userLoc.lat : null,
      userLng: userLoc ? userLoc.lng : null,
      mapCaterers,
      pagination: pag,
      currentQuery: req.query
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
         u.latitude as caterer_latitude, u.longitude as caterer_longitude,
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
      recentComments: commentsRes.rows,
      needsMaps: true
    });
  } catch (err) {
    console.error('menu detail error:', err);
    res.status(500).send('Detay yüklenemedi');
  }
}

module.exports = { list, detail };
