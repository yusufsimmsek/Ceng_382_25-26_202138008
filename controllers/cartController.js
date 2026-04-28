// cart controller - session-based sepet
const db = require('../config/db');

function initCart(req) {
  if (!req.session.cart) req.session.cart = [];
}

// req.body'den hem options[] hem options_<groupId> formundaki secimleri topla
function collectOptionIds(body) {
  const ids = [];

  // options[] - checkbox grupları (Express options key'i altinda toplar)
  if (body.options) {
    const arr = Array.isArray(body.options) ? body.options : [body.options];
    arr.forEach((v) => {
      const n = parseInt(v, 10);
      if (!isNaN(n)) ids.push(n);
    });
  }

  // options_<groupId> - radio gruplar
  for (const key of Object.keys(body)) {
    if (key.startsWith('options_')) {
      const v = body[key];
      const arr = Array.isArray(v) ? v : [v];
      arr.forEach((val) => {
        const n = parseInt(val, 10);
        if (!isNaN(n)) ids.push(n);
      });
    }
  }

  return ids;
}

function collectIds(field) {
  if (!field) return [];
  const arr = Array.isArray(field) ? field : [field];
  return arr.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
}

async function addItem(req, res) {
  initCart(req);
  try {
    const menuItemId = parseInt(req.body.menu_item_id, 10);
    const quantity = parseInt(req.body.quantity, 10);

    if (isNaN(menuItemId)) {
      req.flash('error', 'Geçersiz ürün');
      return res.redirect('/menu');
    }
    if (isNaN(quantity) || quantity < 1 || quantity > 20) {
      req.flash('error', 'Adet 1-20 arası olmalı');
      return res.redirect('/menu/' + menuItemId);
    }

    // menu item kontrol
    const miRes = await db.query(
      'SELECT id, caterer_id, is_available FROM menu_items WHERE id = $1',
      [menuItemId]
    );
    if (miRes.rows.length === 0 || !miRes.rows[0].is_available) {
      req.flash('error', 'Ürün bulunamadı veya pasif');
      return res.redirect('/menu');
    }
    const menuItem = miRes.rows[0];

    // option ve removal ID'lerini topla
    const optionIds = collectOptionIds(req.body);
    const removalIds = collectIds(req.body.removals);

    // options bu menu'ye ait mi?
    if (optionIds.length > 0) {
      const valOpt = await db.query(
        `SELECT o.id, o.group_id FROM options o
         JOIN option_groups og ON og.id = o.group_id
         WHERE og.menu_item_id = $1 AND o.id = ANY($2::int[])`,
        [menuItemId, optionIds]
      );
      if (valOpt.rows.length !== optionIds.length) {
        req.flash('error', 'Geçersiz seçim');
        return res.redirect('/menu/' + menuItemId);
      }

      // grup bazli min/max kontrolu
      const groupsRes = await db.query(
        'SELECT id, is_required, min_select, max_select FROM option_groups WHERE menu_item_id = $1',
        [menuItemId]
      );
      // her grup icin secilen sayisi
      const countByGroup = {};
      valOpt.rows.forEach((r) => {
        countByGroup[r.group_id] = (countByGroup[r.group_id] || 0) + 1;
      });
      for (const g of groupsRes.rows) {
        const c = countByGroup[g.id] || 0;
        if (g.is_required) {
          if (c < g.min_select || c > g.max_select) {
            req.flash('error', `"${g.name || 'Bir grup'}" için seçim sayısı ${g.min_select}-${g.max_select} arası olmalı`);
            return res.redirect('/menu/' + menuItemId);
          }
        } else {
          if (c > g.max_select) {
            req.flash('error', `Bir grupta en fazla ${g.max_select} seçim yapılabilir`);
            return res.redirect('/menu/' + menuItemId);
          }
        }
      }
    } else {
      // hic secim yok - zorunlu grup varsa hata
      const reqGroups = await db.query(
        'SELECT id FROM option_groups WHERE menu_item_id = $1 AND is_required = TRUE AND min_select > 0',
        [menuItemId]
      );
      if (reqGroups.rows.length > 0) {
        req.flash('error', 'Zorunlu seçimleri yapmalısın');
        return res.redirect('/menu/' + menuItemId);
      }
    }

    // removals validasyon
    if (removalIds.length > 0) {
      const valRem = await db.query(
        'SELECT id FROM removable_ingredients WHERE menu_item_id = $1 AND id = ANY($2::int[])',
        [menuItemId, removalIds]
      );
      if (valRem.rows.length !== removalIds.length) {
        req.flash('error', 'Geçersiz malzeme seçimi');
        return res.redirect('/menu/' + menuItemId);
      }
    }

    const newEntry = {
      menuItemId,
      catererId: menuItem.caterer_id,
      quantity,
      options: optionIds,
      removals: removalIds,
      note: ''
    };

    // sepette farkli caterer var mi?
    if (req.session.cart.length > 0
        && req.session.cart[0].catererId !== menuItem.caterer_id) {
      req.session.pendingItem = newEntry;
      req.flash('info', 'Sepetinde başka bir restorandan ürünler var');
      return res.redirect('/cart');
    }

    req.session.cart.push(newEntry);
    req.flash('success', 'Ürün sepete eklendi');
    res.redirect('/cart');
  } catch (err) {
    console.error('add to cart error:', err);
    req.flash('error', 'Sepete eklenirken hata oluştu');
    res.redirect('/menu');
  }
}

async function confirmReplace(req, res) {
  if (!req.session.pendingItem) {
    return res.redirect('/cart');
  }
  req.session.cart = [req.session.pendingItem];
  delete req.session.pendingItem;
  req.flash('success', 'Sepet yenilendi, ürün eklendi');
  res.redirect('/cart');
}

function cancelPending(req, res) {
  delete req.session.pendingItem;
  req.flash('info', 'Yeni ürün eklenmedi');
  res.redirect('/cart');
}

async function viewCart(req, res) {
  initCart(req);
  try {
    const cart = req.session.cart;
    const pendingItem = req.session.pendingItem || null;

    if (cart.length === 0) {
      return res.render('user/cart', {
        title: 'Sepetim',
        cartItems: [],
        total: 0,
        caterer: null,
        pendingItem
      });
    }

    // toplu fetch icin ID'leri topla
    const menuIds = [...new Set(cart.map((c) => c.menuItemId))];
    const optIds = [...new Set(cart.flatMap((c) => c.options || []))];
    const remIds = [...new Set(cart.flatMap((c) => c.removals || []))];

    const miRes = await db.query(
      'SELECT id, name, price, image_path FROM menu_items WHERE id = ANY($1::int[])',
      [menuIds]
    );
    const menuMap = {};
    miRes.rows.forEach((m) => { menuMap[m.id] = m; });

    const optMap = {};
    if (optIds.length > 0) {
      const optRes = await db.query(
        `SELECT o.id, o.name, o.extra_price, og.name as group_name
         FROM options o JOIN option_groups og ON og.id = o.group_id
         WHERE o.id = ANY($1::int[])`,
        [optIds]
      );
      optRes.rows.forEach((o) => { optMap[o.id] = o; });
    }

    const remMap = {};
    if (remIds.length > 0) {
      const remRes = await db.query(
        'SELECT id, name FROM removable_ingredients WHERE id = ANY($1::int[])',
        [remIds]
      );
      remRes.rows.forEach((r) => { remMap[r.id] = r; });
    }

    // cart'i zenginlestir + subtotal
    let total = 0;
    const cartItems = cart.map((c, idx) => {
      const mi = menuMap[c.menuItemId];
      const basePrice = mi ? Number(mi.price) : 0;
      const opts = (c.options || []).map((id) => optMap[id]).filter(Boolean);
      const extras = opts.reduce((s, o) => s + Number(o.extra_price), 0);
      const rems = (c.removals || []).map((id) => remMap[id]).filter(Boolean);
      const unit = basePrice + extras;
      const subtotal = unit * c.quantity;
      total += subtotal;
      return {
        idx,
        menuItem: mi,
        options: opts,
        removals: rems,
        quantity: c.quantity,
        unitPrice: unit,
        subtotal
      };
    });

    // caterer bilgisi
    const cRes = await db.query(
      'SELECT id, name FROM users WHERE id = $1',
      [cart[0].catererId]
    );

    res.render('user/cart', {
      title: 'Sepetim',
      cartItems,
      total,
      caterer: cRes.rows[0] || null,
      pendingItem
    });
  } catch (err) {
    console.error('view cart error:', err);
    res.status(500).send('Sepet yüklenemedi');
  }
}

function updateItem(req, res) {
  initCart(req);
  const idx = parseInt(req.params.idx, 10);
  const qty = parseInt(req.body.quantity, 10);

  if (isNaN(idx) || idx < 0 || idx >= req.session.cart.length) {
    req.flash('error', 'Geçersiz satır');
    return res.redirect('/cart');
  }
  if (isNaN(qty) || qty < 1 || qty > 20) {
    req.flash('error', 'Adet 1-20 arası olmalı');
    return res.redirect('/cart');
  }

  req.session.cart[idx].quantity = qty;
  req.flash('success', 'Adet güncellendi');
  res.redirect('/cart');
}

function removeItem(req, res) {
  initCart(req);
  const idx = parseInt(req.params.idx, 10);
  if (isNaN(idx) || idx < 0 || idx >= req.session.cart.length) {
    req.flash('error', 'Geçersiz satır');
    return res.redirect('/cart');
  }
  req.session.cart.splice(idx, 1);
  req.flash('success', 'Ürün sepetten çıkarıldı');
  res.redirect('/cart');
}

function clearCart(req, res) {
  req.session.cart = [];
  delete req.session.pendingItem;
  req.flash('success', 'Sepet temizlendi');
  res.redirect('/menu');
}

module.exports = {
  addItem,
  viewCart,
  updateItem,
  removeItem,
  clearCart,
  confirmReplace,
  cancelPending
};
