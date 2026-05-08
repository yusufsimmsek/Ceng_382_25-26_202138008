// auth controller - kayit, giris, cikis
const bcrypt = require('bcrypt');
const db = require('../config/db');
const locationService = require('../services/locationService');
const logService = require('../services/logService');

function registerForm(req, res) {
  res.render('auth/register', { title: 'Kayıt Ol' });
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
  res.render('auth/login', { title: 'Giriş' });
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

    // session'a sadece gerekli alanlari koy
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    await logService.logAction(req, 'LOGIN_SUCCESS', 'user_id=' + user.id);

    // role'e gore yonlendir
    if (user.role === 'admin') return res.redirect('/admin');
    if (user.role === 'caterer') return res.redirect('/caterer');
    return res.redirect('/user');
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

module.exports = {
  registerForm,
  register,
  loginForm,
  login,
  logout
};
