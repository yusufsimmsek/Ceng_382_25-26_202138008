// caterer controller
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function dashboard(req, res) {
  try {
    // TODO: gercek istatistikleri DB'den cek (faz 9)
    const stats = {
      totalOrders: 0,
      completed: 0,
      avgRating: null,
      revenue: 0
    };

    res.render('caterer/dashboard', { title: 'Dashboard', stats });
  } catch (err) {
    console.error('caterer dashboard error:', err);
    res.status(500).send('Sunucu hatasi');
  }
}

// menu listele
async function menuList(req, res) {
  try {
    const catererId = req.session.user.id;
    const result = await db.query(
      'SELECT * FROM menu_items WHERE caterer_id = $1 ORDER BY created_at DESC',
      [catererId]
    );
    res.render('caterer/menu/list', {
      title: 'Menü Yönetimi',
      items: result.rows
    });
  } catch (err) {
    console.error('menu list error:', err);
    req.flash('error', 'Menüler yüklenemedi');
    res.redirect('/caterer/dashboard');
  }
}

function menuNewForm(req, res) {
  res.render('caterer/menu/new', { title: 'Yeni Menü Ekle' });
}

async function menuCreate(req, res) {
  // basit yardimci: yuklenen dosyayi sil
  function cleanupFile() {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('dosya silme hata:', err.message);
      });
    }
  }

  try {
    const { name, price, description } = req.body;

    if (!name || name.trim() === '') {
      cleanupFile();
      req.flash('error', 'Menü adı bos olamaz');
      return res.redirect('/caterer/menu/new');
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      cleanupFile();
      req.flash('error', 'Gecerli bir fiyat gir');
      return res.redirect('/caterer/menu/new');
    }
    if (!req.file) {
      req.flash('error', 'Görsel yüklemelisin');
      return res.redirect('/caterer/menu/new');
    }

    const imagePath = '/uploads/menu/' + req.file.filename;
    const catererId = req.session.user.id;

    await db.query(
      `INSERT INTO menu_items (caterer_id, name, price, description, image_path)
       VALUES ($1, $2, $3, $4, $5)`,
      [catererId, name.trim(), priceNum, description || null, imagePath]
    );

    req.flash('success', 'Menü eklendi');
    res.redirect('/caterer/menu');
  } catch (err) {
    console.error('menu create error:', err);
    cleanupFile();
    req.flash('error', 'Menü eklenirken hata olustu');
    res.redirect('/caterer/menu/new');
  }
}

module.exports = {
  dashboard,
  menuList,
  menuNewForm,
  menuCreate
};
