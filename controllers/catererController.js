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

// ============================
// customization yonetimi
// ============================

// ownership helper: menu item caterer'a ait mi
async function ensureMenuOwnership(menuId, catererId) {
  const r = await db.query(
    'SELECT id FROM menu_items WHERE id = $1 AND caterer_id = $2',
    [menuId, catererId]
  );
  return r.rows.length > 0;
}

async function menuCustomize(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;

    const itemRes = await db.query(
      'SELECT * FROM menu_items WHERE id = $1 AND caterer_id = $2',
      [id, catererId]
    );
    if (itemRes.rows.length === 0) {
      req.flash('error', 'Menü bulunamadi');
      return res.redirect('/caterer/menu');
    }
    const item = itemRes.rows[0];

    const groupsRes = await db.query(
      'SELECT * FROM option_groups WHERE menu_item_id = $1 ORDER BY id',
      [id]
    );
    const groups = groupsRes.rows;

    // her grup icin option'lari cek
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

    res.render('caterer/menu/customize', {
      title: 'Seçenekleri Yönet',
      item,
      groups,
      removables: removablesRes.rows
    });
  } catch (err) {
    console.error('customize page error:', err);
    req.flash('error', 'Bir hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function optionGroupCreate(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;

    if (!(await ensureMenuOwnership(menuId, catererId))) {
      req.flash('error', 'Menü bulunamadi');
      return res.redirect('/caterer/menu');
    }

    const { name, is_required } = req.body;
    const minSel = parseInt(req.body.min_select, 10);
    const maxSel = parseInt(req.body.max_select, 10);

    if (!name || name.trim() === '') {
      req.flash('error', 'Grup adı bos olamaz');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }
    if (isNaN(minSel) || minSel < 0) {
      req.flash('error', 'min_select 0 veya daha buyuk olmali');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }
    if (isNaN(maxSel) || maxSel < 1) {
      req.flash('error', 'max_select en az 1 olmali');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }
    if (maxSel < minSel) {
      req.flash('error', 'max_select min_select degerinden kucuk olamaz');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    const required = is_required === 'on' || is_required === 'true';

    await db.query(
      `INSERT INTO option_groups (menu_item_id, name, is_required, min_select, max_select)
       VALUES ($1, $2, $3, $4, $5)`,
      [menuId, name.trim(), required, minSel, maxSel]
    );

    req.flash('success', 'Seçenek grubu eklendi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('option group create error:', err);
    req.flash('error', 'Grup eklenirken hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function optionGroupDelete(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const groupId = parseInt(req.params.groupId, 10);
    const catererId = req.session.user.id;

    // grup gercekten bu menu'ye ait mi + menu caterer'a ait mi
    const check = await db.query(
      `SELECT og.id FROM option_groups og
       JOIN menu_items m ON og.menu_item_id = m.id
       WHERE og.id = $1 AND og.menu_item_id = $2 AND m.caterer_id = $3`,
      [groupId, menuId, catererId]
    );
    if (check.rows.length === 0) {
      req.flash('error', 'Grup bulunamadi');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    // options CASCADE ile silinir
    await db.query('DELETE FROM option_groups WHERE id = $1', [groupId]);

    req.flash('success', 'Grup silindi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('option group delete error:', err);
    req.flash('error', 'Silme sirasinda hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function optionCreate(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const groupId = parseInt(req.params.groupId, 10);
    const catererId = req.session.user.id;

    // group → menu → caterer
    const check = await db.query(
      `SELECT og.id FROM option_groups og
       JOIN menu_items m ON og.menu_item_id = m.id
       WHERE og.id = $1 AND og.menu_item_id = $2 AND m.caterer_id = $3`,
      [groupId, menuId, catererId]
    );
    if (check.rows.length === 0) {
      req.flash('error', 'Grup bulunamadi');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    const { name } = req.body;
    const extra = parseFloat(req.body.extra_price);

    if (!name || name.trim() === '') {
      req.flash('error', 'Seçenek adı bos olamaz');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }
    if (isNaN(extra) || extra < 0) {
      req.flash('error', 'Gecerli bir ek fiyat gir (0 veya daha buyuk)');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    await db.query(
      'INSERT INTO options (group_id, name, extra_price) VALUES ($1, $2, $3)',
      [groupId, name.trim(), extra]
    );

    req.flash('success', 'Seçenek eklendi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('option create error:', err);
    req.flash('error', 'Seçenek eklenirken hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function optionDelete(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const optionId = parseInt(req.params.optionId, 10);
    const catererId = req.session.user.id;

    // option → group → menu → caterer
    const check = await db.query(
      `SELECT o.id FROM options o
       JOIN option_groups og ON o.group_id = og.id
       JOIN menu_items m ON og.menu_item_id = m.id
       WHERE o.id = $1 AND m.id = $2 AND m.caterer_id = $3`,
      [optionId, menuId, catererId]
    );
    if (check.rows.length === 0) {
      req.flash('error', 'Seçenek bulunamadi');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    await db.query('DELETE FROM options WHERE id = $1', [optionId]);

    req.flash('success', 'Seçenek silindi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('option delete error:', err);
    req.flash('error', 'Silme sirasinda hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function removableCreate(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const catererId = req.session.user.id;

    if (!(await ensureMenuOwnership(menuId, catererId))) {
      req.flash('error', 'Menü bulunamadi');
      return res.redirect('/caterer/menu');
    }

    const { name } = req.body;
    if (!name || name.trim() === '') {
      req.flash('error', 'Malzeme adı bos olamaz');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    await db.query(
      'INSERT INTO removable_ingredients (menu_item_id, name) VALUES ($1, $2)',
      [menuId, name.trim()]
    );

    req.flash('success', 'Malzeme eklendi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('removable create error:', err);
    req.flash('error', 'Malzeme eklenirken hata olustu');
    res.redirect('/caterer/menu');
  }
}

async function removableDelete(req, res) {
  try {
    const menuId = parseInt(req.params.id, 10);
    const removableId = parseInt(req.params.removableId, 10);
    const catererId = req.session.user.id;

    const check = await db.query(
      `SELECT r.id FROM removable_ingredients r
       JOIN menu_items m ON r.menu_item_id = m.id
       WHERE r.id = $1 AND m.id = $2 AND m.caterer_id = $3`,
      [removableId, menuId, catererId]
    );
    if (check.rows.length === 0) {
      req.flash('error', 'Malzeme bulunamadi');
      return res.redirect('/caterer/menu/' + menuId + '/customize');
    }

    await db.query('DELETE FROM removable_ingredients WHERE id = $1', [removableId]);

    req.flash('success', 'Malzeme silindi');
    res.redirect('/caterer/menu/' + menuId + '/customize');
  } catch (err) {
    console.error('removable delete error:', err);
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
  menuDelete,
  menuCustomize,
  optionGroupCreate,
  optionGroupDelete,
  optionCreate,
  optionDelete,
  removableCreate,
  removableDelete
};
