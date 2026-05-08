// rating + yorum sistemi
const db = require('../config/db');
const logService = require('../services/logService');

// kontrol: order var mi, user'a ait mi, completed mi, daha once rate edilmis mi
async function checkCanRate(orderId, userId) {
  const ord = await db.query(
    'SELECT id, user_id, caterer_id, status FROM orders WHERE id = $1',
    [orderId]
  );
  if (ord.rows.length === 0) return { ok: false, reason: 'Sipariş bulunamadi' };
  const order = ord.rows[0];
  if (order.user_id !== userId) return { ok: false, reason: 'Bu sipariş senin değil' };
  if (order.status !== 'completed') return { ok: false, reason: 'Sadece tamamlanan siparişler değerlendirilebilir' };

  const existing = await db.query('SELECT id FROM ratings WHERE order_id = $1', [orderId]);
  if (existing.rows.length > 0) return { ok: false, reason: 'Bu sipariş zaten değerlendirildi' };

  return { ok: true, order };
}

async function rateForm(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/orders');

    const check = await checkCanRate(id, req.session.user.id);
    if (!check.ok) {
      req.flash('error', check.reason);
      return res.redirect('/orders');
    }

    // siparis ozeti icin items + caterer
    const orderRes = await db.query(
      `SELECT o.*, u.name as caterer_name FROM orders o
       JOIN users u ON u.id = o.caterer_id WHERE o.id = $1`,
      [id]
    );
    const itemsRes = await db.query(
      `SELECT oi.quantity, mi.name as menu_name
       FROM order_items oi LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1 ORDER BY oi.id`,
      [id]
    );

    res.render('user/rate-order', {
      title: 'Siparişini Değerlendir',
      order: orderRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('rate form error:', err);
    res.status(500).send('Sayfa yüklenemedi');
  }
}

async function submitRating(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/orders');

    const check = await checkCanRate(id, req.session.user.id);
    if (!check.ok) {
      req.flash('error', check.reason);
      return res.redirect('/orders');
    }
    const order = check.order;

    const menuRating = parseInt(req.body.menu_rating, 10);
    const catererRating = parseInt(req.body.caterer_rating, 10);
    let comment = (req.body.comment || '').trim();

    if (isNaN(menuRating) || menuRating < 1 || menuRating > 5) {
      req.flash('error', 'Menü puanı 1-5 arası olmalı');
      return res.redirect('/orders/' + id + '/rate');
    }
    if (isNaN(catererRating) || catererRating < 1 || catererRating > 5) {
      req.flash('error', 'Restoran puanı 1-5 arası olmalı');
      return res.redirect('/orders/' + id + '/rate');
    }
    if (comment.length > 500) {
      comment = comment.substring(0, 500);
    }

    // ilk menu_item_id'yi al (rating tablosu tek menu_item_id field'i tutar)
    const firstItem = await db.query(
      'SELECT menu_item_id FROM order_items WHERE order_id = $1 ORDER BY id LIMIT 1',
      [id]
    );
    const menuItemId = firstItem.rows[0] ? firstItem.rows[0].menu_item_id : null;

    await db.query(
      `INSERT INTO ratings (order_id, user_id, menu_item_id, caterer_id, menu_rating, caterer_rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.session.user.id, menuItemId, order.caterer_id, menuRating, catererRating, comment || null]
    );

    await logService.logAction(req, 'RATING_SUBMITTED', `order_id=${id} menu=${menuRating} caterer=${catererRating}`);

    req.flash('success', 'Değerlendirmen için teşekkürler');
    res.redirect('/orders');
  } catch (err) {
    console.error('submit rating error:', err);
    req.flash('error', 'Değerlendirme kaydedilemedi');
    res.redirect('/orders');
  }
}

module.exports = { rateForm, submitRating };
