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

// edit form
async function menuEditForm(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;
    const result = await db.query(
      'SELECT * FROM menu_items WHERE id = $1 AND caterer_id = $2',
      [id, catererId]
    );
    if (result.rows.length === 0) {
      req.flash('error', 'Menü bulunamadi');
      return res.redirect('/caterer/menu');
    }
    res.render('caterer/menu/edit', {
      title: 'Menüyü Düzenle',
      item: result.rows[0]
    });
  } catch (err) {
    console.error('menu edit form error:', err);
    req.flash('error', 'Bir hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function menuUpdate(req, res) {
  function cleanupFile() {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('dosya silme hata:', err.message);
      });
    }
  }

  try {
    const id = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;
    const { name, price, description, is_available } = req.body;

    // ownership check + mevcut item'i cek
    const existing = await db.query(
      'SELECT * FROM menu_items WHERE id = $1 AND caterer_id = $2',
      [id, catererId]
    );
    if (existing.rows.length === 0) {
      cleanupFile();
      req.flash('error', 'Menü bulunamadi');
      return res.redirect('/caterer/menu');
    }
    const oldItem = existing.rows[0];

    // validation
    if (!name || name.trim() === '') {
      cleanupFile();
      req.flash('error', 'Menü adı bos olamaz');
      return res.redirect('/caterer/menu/' + id + '/edit');
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      cleanupFile();
      req.flash('error', 'Gecerli bir fiyat gir');
      return res.redirect('/caterer/menu/' + id + '/edit');
    }
    const availBool = is_available === 'true';

    // gorsel
    let imagePath = oldItem.image_path;
    if (req.file) {
      imagePath = '/uploads/menu/' + req.file.filename;
      // eski yuklenen gorseli sil (placeholder ise dokunma)
      if (oldItem.image_path && oldItem.image_path.startsWith('/uploads/menu/')) {
        const oldPath = path.join(__dirname, '..', 'public', oldItem.image_path);
        fs.unlink(oldPath, (err) => {
          if (err) console.error('eski gorsel silinemedi:', err.message);
        });
      }
    }

    await db.query(
      `UPDATE menu_items
       SET name = $1, price = $2, description = $3, image_path = $4,
           is_available = $5, updated_at = NOW()
       WHERE id = $6 AND caterer_id = $7`,
      [name.trim(), priceNum, description || null, imagePath, availBool, id, catererId]
    );

    req.flash('success', 'Menü güncellendi');
    res.redirect('/caterer/menu');
  } catch (err) {
    console.error('menu update error:', err);
    cleanupFile();
    req.flash('error', 'Güncelleme sirasinda hata olustu');
    res.redirect('/caterer/menu');
  }
}

// soft delete - order_items'i bozmamak icin sadece pasif yapiyoruz
async function menuDelete(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;

    const result = await db.query(
      `UPDATE menu_items SET is_available = FALSE, updated_at = NOW()
       WHERE id = $1 AND caterer_id = $2`,
      [id, catererId]
    );

    if (result.rowCount === 0) {
      req.flash('error', 'Menü bulunamadi');
    } else {
      req.flash('success', 'Menü pasif duruma alındı');
    }
    res.redirect('/caterer/menu');
  } catch (err) {
    console.error('menu delete error:', err);
    req.flash('error', 'Silme sirasinda hata olustu');
    res.redirect('/caterer/menu');
  }
}

module.exports = {
  dashboard,
  menuList,
  menuNewForm,
  menuCreate,
  menuEditForm,
  menuUpdate,
  menuDelete
};
