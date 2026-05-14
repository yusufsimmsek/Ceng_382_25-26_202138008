// auth controller - kayit, giris, cikis
const bcrypt = require('bcrypt');
const db = require('../config/db');
const locationService = require('../services/locationService');
const logService = require('../services/logService');
const emailService = require('../services/emailService');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function redirectByRole(user, res) {
  if (user.role === 'admin') return res.redirect('/admin');
  if (user.role === 'caterer') return res.redirect('/caterer');
  return res.redirect('/user');
}

function registerForm(req, res) {
  res.render('auth/register', { title: 'Kayıt Ol', bodyClass: 'auth-page' });
}

async function register(req, res) {
  try {
    const { name, email, phone, password, password_confirm, role, address } = req.body;

    // basit validation
    if (!name || name.trim() === '') {
      req.flash('error', 'Ad soyad bos olamaz');
      return res.redirect('/register');
    }
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!email || !emailRegex.test(email)) {
      req.flash('error', 'Gecerli bir email gir');
      return res.redirect('/register');
    }
    if (!password || password.length < 6) {
      req.flash('error', 'Sifre en az 6 karakter olmali');
      return res.redirect('/register');
    }
    if (password !== password_confirm) {
      req.flash('error', 'Sifreler uyusmuyor');
      return res.redirect('/register');
    }
    if (!['user', 'caterer'].includes(role)) {
      req.flash('error', 'Gecersiz hesap tipi');
      return res.redirect('/register');
    }
    if (role === 'caterer' && (!address || address.trim() === '')) {
      req.flash('error', 'Caterer hesabi icin adres gerekli');
      return res.redirect('/register');
    }

    // email kullanilmis mi
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      req.flash('error', 'Bu email zaten kayitli');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);

    // caterer ise adresi geocode etmeye calis
    let lat = null;
    let lng = null;
    if (role === 'caterer' && address) {
      const geo = await locationService.geocodeAddress(address);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    await db.query(
      `INSERT INTO users (name, email, password_hash, phone, role, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [name.trim(), email.trim().toLowerCase(), hash, phone || null, role, address || null, lat, lng]
    );

    await logService.logAction(req, 'USER_REGISTERED', 'email=' + email + ' role=' + role);

    req.flash('success', 'Kayıt başarılı, giriş yapabilirsin');
    res.redirect('/login');
  } catch (err) {
    console.error('register error:', err);
    req.flash('error', 'Kayit sirasinda bir hata olustu');
    res.redirect('/register');
  }
}

function loginForm(req, res) {
  res.render('auth/login', { title: 'Giriş', bodyClass: 'auth-page' });
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email ve şifre gerekli');
      return res.redirect('/login');
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    // user yoksa veya sifre yanlissa ayni mesaj (email enum sizmasin)
    if (result.rows.length === 0) {
      await logService.logAction(req, 'LOGIN_FAIL', 'email=' + email);
      req.flash('error', 'Email veya şifre hatalı');
      return res.redirect('/login');
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      await logService.logAction(req, 'LOGIN_FAIL', 'email=' + email);
      req.flash('error', 'Email veya şifre hatalı');
      return res.redirect('/login');
    }

    // 2FA aktif mi?
    if (user.two_factor_enabled) {
      const code = generateCode();
      await db.query(
        `UPDATE users SET two_factor_code = $1,
           two_factor_expires_at = NOW() + INTERVAL '5 minutes'
         WHERE id = $2`,
        [code, user.id]
      );

      // emailde gonder (fail olsa bile kod DB'de, kullanici resend talep edebilir)
      try {
        await emailService.sendTwoFactorCode(user, code);
      } catch (e) {
        console.error('2fa mail hata:', e.message);
      }

      await logService.logAction(req, '2FA_CODE_SENT', 'user_id=' + user.id);

      const expiresAt = Date.now() + 5 * 60 * 1000;
      req.session.pendingTwoFactor = { userId: user.id, expiresAt };

      return res.redirect('/auth/2fa');
    }

    // 2FA yok - normal login
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    await logService.logAction(req, 'LOGIN_SUCCESS', 'user_id=' + user.id);
    return redirectByRole(user, res);
  } catch (err) {
    console.error('login error:', err);
    req.flash('error', 'Giris sirasinda bir hata olustu');
    res.redirect('/login');
  }
}

async function logout(req, res) {
  const uid = req.session && req.session.user ? req.session.user.id : null;
  if (uid) {
    await logService.logAction(req, 'LOGOUT', 'user_id=' + uid);
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
    }
    res.redirect('/');
  });
}

// 2FA endpointleri
function twoFactorForm(req, res) {
  const p = req.session.pendingTwoFactor;
  if (!p) return res.redirect('/login');
  if (Date.now() > p.expiresAt) {
    delete req.session.pendingTwoFactor;
    req.flash('error', 'Kod süresi doldu, tekrar giriş yap');
    return res.redirect('/login');
  }
  res.render('auth/2fa', {
    title: 'İki Adımlı Doğrulama',
    bodyClass: 'auth-page',
    pendingExpiresAt: p.expiresAt
  });
}

async function twoFactorVerify(req, res) {
  const p = req.session.pendingTwoFactor;
  if (!p) return res.redirect('/login');
  if (Date.now() > p.expiresAt) {
    delete req.session.pendingTwoFactor;
    req.flash('error', 'Kod süresi doldu, tekrar giriş yap');
    return res.redirect('/login');
  }

  try {
    const code = (req.body.code || '').trim();
    const r = await db.query(
      `SELECT id, name, email, role, two_factor_code, two_factor_expires_at
       FROM users WHERE id = $1`,
      [p.userId]
    );
    if (r.rows.length === 0) {
      delete req.session.pendingTwoFactor;
      return res.redirect('/login');
    }
    const user = r.rows[0];

    const expired = user.two_factor_expires_at && new Date(user.two_factor_expires_at) < new Date();
    if (!user.two_factor_code || expired || code !== user.two_factor_code) {
      await logService.logAction(req, '2FA_FAIL', 'user_id=' + user.id);
      req.flash('error', 'Kod yanlış veya süresi dolmuş');
      return res.redirect('/auth/2fa');
    }

    // basarili - kodu temizle
    await db.query(
      'UPDATE users SET two_factor_code = NULL, two_factor_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    delete req.session.pendingTwoFactor;

    await logService.logAction(req, 'LOGIN_SUCCESS', 'user_id=' + user.id + ' 2fa=true');
    return redirectByRole(user, res);
  } catch (err) {
    console.error('2fa verify error:', err);
    req.flash('error', 'Bir hata olustu');
    return res.redirect('/auth/2fa');
  }
}

async function twoFactorResend(req, res) {
  const p = req.session.pendingTwoFactor;
  if (!p) return res.redirect('/login');

  try {
    const r = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [p.userId]
    );
    if (r.rows.length === 0) {
      delete req.session.pendingTwoFactor;
      return res.redirect('/login');
    }
    const user = r.rows[0];

    const code = generateCode();
    await db.query(
      `UPDATE users SET two_factor_code = $1,
         two_factor_expires_at = NOW() + INTERVAL '5 minutes'
       WHERE id = $2`,
      [code, user.id]
    );
    try {
      await emailService.sendTwoFactorCode(user, code);
    } catch (e) {
      console.error('2fa resend mail hata:', e.message);
    }

    req.session.pendingTwoFactor.expiresAt = Date.now() + 5 * 60 * 1000;
    await logService.logAction(req, '2FA_CODE_RESENT', 'user_id=' + user.id);

    req.flash('success', 'Yeni kod gönderildi');
    res.redirect('/auth/2fa');
  } catch (err) {
    console.error('2fa resend error:', err);
    req.flash('error', 'Kod gönderilemedi');
    res.redirect('/auth/2fa');
  }
}

module.exports = {
  registerForm,
  register,
  loginForm,
  login,
  logout,
  twoFactorForm,
  twoFactorVerify,
  twoFactorResend
};
