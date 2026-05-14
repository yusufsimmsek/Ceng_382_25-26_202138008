// user controller - dashboard, profile, lokasyon vb.
const db = require('../config/db');
const locationService = require('../services/locationService');
const logService = require('../services/logService');

async function dashboard(req, res) {
  try {
    const userId = req.session.user.id;

    const statsRes = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = $1 AND status != 'cancelled') as total_spent,
        (SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = 'completed') as completed_orders,
        (SELECT MAX(created_at) FROM orders WHERE user_id = $1) as last_order_date`,
      [userId]
    );

    const favRes = await db.query(
      `SELECT u.id, u.name, COUNT(o.id) as cnt
       FROM orders o JOIN users u ON u.id = o.caterer_id
       WHERE o.user_id = $1
       GROUP BY u.id, u.name
       ORDER BY cnt DESC LIMIT 1`,
      [userId]
    );

    const recentRes = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.name as caterer_name
       FROM orders o JOIN users u ON u.id = o.caterer_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC LIMIT 5`,
      [userId]
    );

    res.render('user/dashboard', {
      title: 'Dashboard',
      stats: statsRes.rows[0],
      recentOrders: recentRes.rows,
      favoriteCaterer: favRes.rows[0] || null
    });
  } catch (err) {
    console.error('user dashboard error:', err);
    res.status(500).send('Dashboard yüklenemedi');
  }
}

async function profile(req, res) {
  try {
    const id = req.session.user.id;
    const result = await db.query(
      'SELECT id, name, email, phone, address, latitude, longitude, two_factor_enabled FROM users WHERE id = $1',
      [id]
    );
    res.render('user/profile', {
      title: 'Profilim',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('user profile error:', err);
    res.status(500).send('Profil yüklenemedi');
  }
}

async function toggle2FA(req, res) {
  try {
    const r = await db.query(
      `UPDATE users SET two_factor_enabled = NOT two_factor_enabled, updated_at = NOW()
       WHERE id = $1 RETURNING two_factor_enabled`,
      [req.session.user.id]
    );
    const newState = r.rows[0].two_factor_enabled;
    await logService.logAction(req, '2FA_TOGGLED', 'new_state=' + newState);
    req.flash('success', 'İki adımlı doğrulama ' + (newState ? 'etkinleştirildi' : 'devre dışı bırakıldı'));
    res.redirect('/user/profile');
  } catch (err) {
    console.error('user toggle2FA error:', err);
    req.flash('error', '2FA güncellenemedi');
    res.redirect('/user/profile');
  }
}

// redirect param icin guvenli internal path'ler
const ALLOWED_REDIRECTS = ['/menu', '/user/profile', '/user'];

function safeRedirect(target) {
  if (!target) return '/user/profile';
  // baska bir host'a yonlendirme yok
  if (target.startsWith('//') || target.includes('://')) return '/user/profile';
  if (ALLOWED_REDIRECTS.includes(target)) return target;
  return '/user/profile';
}

async function updateLocation(req, res) {
  try {
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const redirectTo = safeRedirect(req.body.redirect);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      req.flash('error', 'Gecersiz konum');
      return res.redirect(redirectTo);
    }

    await db.query(
      'UPDATE users SET latitude = $1, longitude = $2, updated_at = NOW() WHERE id = $3',
      [lat, lng, req.session.user.id]
    );

    req.flash('success', 'Konum güncellendi');
    res.redirect(redirectTo);
  } catch (err) {
    console.error('update location error:', err);
    req.flash('error', 'Konum güncellenemedi');
    res.redirect('/user/profile');
  }
}

async function updateAddress(req, res) {
  try {
    const { address } = req.body;
    if (!address || address.trim() === '') {
      req.flash('error', 'Adres bos olamaz');
      return res.redirect('/user/profile');
    }

    const geo = await locationService.geocodeAddress(address);

    if (geo) {
      await db.query(
        `UPDATE users SET address = $1, latitude = $2, longitude = $3, updated_at = NOW()
         WHERE id = $4`,
        [address.trim(), geo.lat, geo.lng, req.session.user.id]
      );
    } else {
      // geocode olmadi - sadece adresi guncelle
      await db.query(
        'UPDATE users SET address = $1, updated_at = NOW() WHERE id = $2',
        [address.trim(), req.session.user.id]
      );
    }

    req.flash('success', 'Adres güncellendi');
    res.redirect('/user/profile');
  } catch (err) {
    console.error('update address error:', err);
    req.flash('error', 'Adres güncellenemedi');
    res.redirect('/user/profile');
  }
}

module.exports = { dashboard, profile, updateLocation, updateAddress, toggle2FA };
