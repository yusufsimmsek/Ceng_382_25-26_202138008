// user controller - profile, lokasyon vb.
const db = require('../config/db');
const locationService = require('../services/locationService');

async function profile(req, res) {
  try {
    const id = req.session.user.id;
    const result = await db.query(
      'SELECT id, name, email, phone, address, latitude, longitude FROM users WHERE id = $1',
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

module.exports = { profile, updateLocation, updateAddress };
