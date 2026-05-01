// order controller - siparis olusturma + listeleme
const db = require('../config/db');
const { enrichCart } = require('../utils/cartHelper');
const emailService = require('../services/emailService');

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

// own order kontrolu ile order'i detayli cek
async function fetchOrderForUser(orderId, userId) {
  const r = await db.query(
    `SELECT o.*, u.name as caterer_name
     FROM orders o JOIN users u ON u.id = o.caterer_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  );
  if (r.rows.length === 0) return null;
  const order = r.rows[0];

  const items = await db.query(
    `SELECT oi.*, mi.name as menu_name, mi.image_path
     FROM order_items oi
     LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId]
  );

  for (const it of items.rows) {
    const optRes = await db.query(
      `SELECT o.id, o.name, o.extra_price, og.name as group_name
       FROM order_item_options oio
       JOIN options o ON o.id = oio.option_id
       JOIN option_groups og ON og.id = o.group_id
       WHERE oio.order_item_id = $1`,
      [it.id]
    );
    it.options = optRes.rows;

    const remRes = await db.query(
      `SELECT r.id, r.name FROM order_item_removals oir
       JOIN removable_ingredients r ON r.id = oir.removable_ingredient_id
       WHERE oir.order_item_id = $1`,
      [it.id]
    );
    it.removals = remRes.rows;
  }

  return { order, items: items.rows };
}

async function successPage(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(404).send('Sipariş bulunamadı');

    const data = await fetchOrderForUser(id, req.session.user.id);
    if (!data) {
      return res.status(404).send('Sipariş bulunamadı');
    }

    res.render('user/order-success', {
      title: 'Sipariş #' + id,
      order: data.order,
      items: data.items
    });
  } catch (err) {
    console.error('order success error:', err);
    res.status(500).send('Sipariş yüklenemedi');
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

module.exports = { create, successPage, myOrders };
