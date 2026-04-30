// cart controller - session-based sepet
const db = require('../config/db');
const locationService = require('../services/locationService');
const { enrichCart } = require('../utils/cartHelper');

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

    const { cartItems, total, caterer } = await enrichCart(cart);

    res.render('user/cart', {
      title: 'Sepetim',
      cartItems,
      total,
      caterer,
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

async function checkoutForm(req, res) {
  initCart(req);
  try {
    const cart = req.session.cart;
    if (cart.length === 0) {
      req.flash('error', 'Sepetin boş');
      return res.redirect('/menu');
    }

    const { cartItems, total, caterer } = await enrichCart(cart);

    const uRes = await db.query(
      'SELECT id, name, email, address, latitude, longitude FROM users WHERE id = $1',
      [req.session.user.id]
    );
    const profileUser = uRes.rows[0];

    if (req.session.paymentApproved) {
      return res.render('user/checkout-approved', {
        title: 'Ödeme Onaylandı',
        cartItems,
        total,
        caterer,
        deliveryInfo: req.session.deliveryInfo || null
      });
    }

    res.render('user/checkout', {
      title: 'Ödeme',
      cartItems,
      total,
      caterer,
      profileUser
    });
  } catch (err) {
    console.error('checkout form error:', err);
    res.status(500).send('Checkout yüklenemedi');
  }
}

async function processPayment(req, res) {
  initCart(req);
  try {
    if (req.session.cart.length === 0) {
      req.flash('error', 'Sepetin boş');
      return res.redirect('/menu');
    }

    const {
      card_name, card_number, card_expiry, card_cvv,
      delivery_address, use_profile_address
    } = req.body;

    if (!card_name || card_name.trim() === '') {
      req.flash('error', 'Kart üzerindeki isim gerekli');
      return res.redirect('/cart/checkout');
    }
    const cleanedCard = (card_number || '').replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(cleanedCard)) {
      req.flash('error', 'Geçersiz kart numarası');
      return res.redirect('/cart/checkout');
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card_expiry || '')) {
      req.flash('error', 'Son kullanma tarihi MM/YY formatında olmalı');
      return res.redirect('/cart/checkout');
    }
    if (!/^\d{3,4}$/.test(card_cvv || '')) {
      req.flash('error', 'CVV 3-4 haneli olmalı');
      return res.redirect('/cart/checkout');
    }

    // teslimat adresi
    const useProfile = use_profile_address === 'on' || use_profile_address === 'true';
    let addr = null;
    let addrLat = null;
    let addrLng = null;

    const uRes = await db.query(
      'SELECT address, latitude, longitude FROM users WHERE id = $1',
      [req.session.user.id]
    );
    const profile = uRes.rows[0];

    if (useProfile) {
      if (!profile || !profile.address) {
        req.flash('error', 'Profil adresin yok, manuel girmelisin');
        return res.redirect('/cart/checkout');
      }
      addr = profile.address;
      addrLat = profile.latitude;
      addrLng = profile.longitude;
    } else {
      if (!delivery_address || delivery_address.trim() === '') {
        req.flash('error', 'Teslimat adresi gerekli');
        return res.redirect('/cart/checkout');
      }
      addr = delivery_address.trim();
      const geo = await locationService.geocodeAddress(addr);
      if (geo) {
        addrLat = geo.lat;
        addrLng = geo.lng;
      }
    }

    // payment simulation
    // 4242 4242 4242 4242 - kesin basarili
    // 0000 ile bitiyorsa - kesin basarisiz (test icin)
    // diger - basarili
    if (cleanedCard.endsWith('0000') && cleanedCard !== '4242424242424242') {
      req.flash('error', 'Kart bilgileri reddedildi. Lütfen tekrar dene.');
      return res.redirect('/cart/checkout');
    }

    req.session.paymentApproved = true;
    req.session.deliveryInfo = { address: addr, lat: addrLat, lng: addrLng };

    req.flash('success', 'Ödeme onaylandı (simülasyon)');
    res.redirect('/cart/checkout');
  } catch (err) {
    console.error('payment error:', err);
    req.flash('error', 'Ödeme sirasinda hata olustu');
    res.redirect('/cart/checkout');
  }
}

module.exports = {
  addItem,
  viewCart,
  updateItem,
  removeItem,
  clearCart,
  confirmReplace,
  cancelPending,
  checkoutForm,
  processPayment
};
