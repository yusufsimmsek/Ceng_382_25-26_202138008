// auth controller - kayit, giris, cikis
const bcrypt = require('bcrypt');
const db = require('../config/db');

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

    await db.query(
      `INSERT INTO users (name, email, password_hash, phone, role, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name.trim(), email.trim().toLowerCase(), hash, phone || null, role, address || null]
    );

    req.flash('success', 'Kayıt başarılı, giriş yapabilirsin');
    res.redirect('/login');
  } catch (err) {
    console.error('register error:', err);
    req.flash('error', 'Kayit sirasinda bir hata olustu');
    res.redirect('/register');
  }
}

module.exports = {
  registerForm,
  register
};
