// order controller - siparis olusturma + listeleme
const db = require('../config/db');
const { enrichCart } = require('../utils/cartHelper');
const { fetchOrderFull } = require('../utils/orderHelper');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

async function create(req, res) {
  // payment + sepet kontrolu
  if (!req.session.paymentApproved) {
    req.flash('error', 'Önce ödemeyi tamamlamalısın');
    return res.redirect('/cart/checkout');
  }
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash('error', 'Sepetin boş');
    return res.redirect('/menu');
  }

  let client;
  try {
    const cart = req.session.cart;
    const { cartItems, total } = await enrichCart(cart);
    const userId = req.session.user.id;
    const catererId = cart[0].catererId;
    const delivery = req.session.deliveryInfo || {};

    client = await db.getClient();
    await client.query('BEGIN');

    const orderRes = await client.query(
      `INSERT INTO orders
        (user_id, caterer_id, total_amount, status, payment_status, delivery_address, delivery_lat, delivery_lng)
       VALUES ($1, $2, $3, 'pending', 'paid', $4, $5, $6)
       RETURNING id`,
      [userId, catererId, total, delivery.address || null, delivery.lat || null, delivery.lng || null]
    );
    const orderId = orderRes.rows[0].id;

    for (const ci of cartItems) {
      const oiRes = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, item_price, customization_extra)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [orderId, ci.menuItem.id, ci.quantity, ci.basePrice, ci.extras]
      );
      const orderItemId = oiRes.rows[0].id;

      for (const o of ci.options) {
        await client.query(
          'INSERT INTO order_item_options (order_item_id, option_id) VALUES ($1, $2)',
          [orderItemId, o.id]
        );
      }
      for (const r of ci.removals) {
        await client.query(
          'INSERT INTO order_item_removals (order_item_id, removable_ingredient_id) VALUES ($1, $2)',
          [orderItemId, r.id]
        );
      }
    }

    await client.query('COMMIT');

    // sepeti ve payment state'i temizle
    req.session.cart = [];
    delete req.session.paymentApproved;
    delete req.session.deliveryInfo;
    delete req.session.pendingItem;

    // email gonderimi - user ve caterer bilgilerini cek
    try {
      const usrRes = await db.query(
        'SELECT name, email, phone FROM users WHERE id = $1',
        [userId]
      );
      const catRes = await db.query(
        'SELECT name, email, phone FROM users WHERE id = $1',
        [catererId]
      );
      const user = usrRes.rows[0];
      const caterer = catRes.rows[0];

      const orderObj = {
        id: orderId,
        total_amount: total,
        delivery_address: delivery.address || null,
        created_at: new Date()
      };

      // cartItems zaten enrich edilmis (basePrice, extras, options, removals dolu)
      await emailService.sendOrderConfirmationToUser(user, orderObj, cartItems, caterer);
      await emailService.sendOrderNotificationToCaterer(caterer, user, orderObj, cartItems);
      console.log('LOG: EMAIL_SENT user=', user.email, 'caterer=', caterer.email, 'order=', orderId);
    } catch (e) {
      console.error('email gonderim hata (order proceeds):', e.message);
    }

    // TODO: Faz 7 - PDF generation
    console.log('TODO: Generate receipt and agreement PDFs for order', orderId);
    // TODO: Faz 10 - logging tablosuna yaz
    console.log('LOG: ORDER_CREATED user=', userId, 'order=', orderId);

    res.redirect('/orders/' + orderId + '/success');
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (e) { console.error('rollback hata:', e.message); }
    }
    console.error('order create error:', err);
    req.flash('error', 'Sipariş oluşturulurken hata olustu');
    res.redirect('/cart/checkout');
  } finally {
    if (client) client.release();
  }
}

// ownership: user kendi siparisi / caterer kendi siparisi / admin
function canAccessOrder(order, sessionUser) {
  if (!sessionUser || !order) return false;
  if (sessionUser.role === 'admin') return true;
  if (sessionUser.role === 'user' && order.user_id === sessionUser.id) return true;
  if (sessionUser.role === 'caterer' && order.caterer_id === sessionUser.id) return true;
  return false;
}

async function successPage(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(404).send('Sipariş bulunamadı');

    const data = await fetchOrderFull(id);
    if (!data || data.order.user_id !== req.session.user.id) {
      return res.status(404).send('Sipariş bulunamadı');
    }

    // success view'inin kullandigi item format orderHelper.js'tekiyle uyumlu olsun
    // (item.name, item.options[].group_name+name+extra_price, item.removals[].name, item_price, customization_extra)
    const items = data.items.map((it) => ({
      id: it.id,
      menu_name: it.name,
      quantity: it.quantity,
      item_price: it.basePrice,
      customization_extra: it.customizationExtra,
      options: it.options.map(o => ({
        group_name: o.groupName,
        name: o.name,
        extra_price: o.extra
      })),
      removals: it.removals
    }));

    res.render('user/order-success', {
      title: 'Sipariş #' + id,
      order: { ...data.order, caterer_name: data.caterer.name },
      items
    });
  } catch (err) {
    console.error('order success error:', err);
    res.status(500).send('Sipariş yüklenemedi');
  }
}

async function downloadReceipt(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(404).send('Sipariş bulunamadi');

    const data = await fetchOrderFull(id);
    if (!data || !canAccessOrder(data.order, req.session.user)) {
      return res.status(404).send('Sipariş bulunamadi');
    }

    const buffer = await pdfService.generateReceipt(data.order, data.items, data.user, data.caterer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sofranet-makbuz-${id}.pdf"`);
    res.send(buffer);
  } catch (err) {
    console.error('receipt download error:', err);
    res.status(500).send('Makbuz uretilemedi');
  }
}

async function downloadAgreement(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(404).send('Sipariş bulunamadi');

    const data = await fetchOrderFull(id);
    if (!data || !canAccessOrder(data.order, req.session.user)) {
      return res.status(404).send('Sipariş bulunamadi');
    }

    const buffer = await pdfService.generateAgreement(data.order, data.items, data.user, data.caterer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sofranet-sozlesme-${id}.pdf"`);
    res.send(buffer);
  } catch (err) {
    console.error('agreement download error:', err);
    res.status(500).send('Sözleşme üretilemedi');
  }
}

async function myOrders(req, res) {
  try {
    const result = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, o.completed_at,
        u.name as caterer_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        EXISTS (SELECT 1 FROM ratings WHERE order_id = o.id) as has_rating
       FROM orders o
       JOIN users u ON u.id = o.caterer_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    res.render('user/orders', {
      title: 'Siparişlerim',
      orders: result.rows
    });
  } catch (err) {
    console.error('my orders error:', err);
    res.status(500).send('Siparişler yüklenemedi');
  }
}

module.exports = { create, successPage, myOrders, downloadReceipt, downloadAgreement };
