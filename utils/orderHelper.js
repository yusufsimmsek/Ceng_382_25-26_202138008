// order'i tam haliyle DB'den cek (user, caterer, items, options, removals)
const db = require('../config/db');

async function fetchOrderFull(orderId) {
  const ord = await db.query(
    `SELECT o.*,
       u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address,
       c.name as caterer_name, c.email as caterer_email, c.phone as caterer_phone, c.address as caterer_address
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN users c ON c.id = o.caterer_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (ord.rows.length === 0) return null;
  const row = ord.rows[0];

  const order = {
    id: row.id,
    user_id: row.user_id,
    caterer_id: row.caterer_id,
    total_amount: row.total_amount,
    status: row.status,
    payment_status: row.payment_status,
    delivery_address: row.delivery_address,
    delivery_lat: row.delivery_lat,
    delivery_lng: row.delivery_lng,
    created_at: row.created_at,
    completed_at: row.completed_at
  };
  const user = {
    id: row.user_id,
    name: row.user_name,
    email: row.user_email,
    phone: row.user_phone,
    address: row.user_address
  };
  const caterer = {
    id: row.caterer_id,
    name: row.caterer_name,
    email: row.caterer_email,
    phone: row.caterer_phone,
    address: row.caterer_address
  };

  const itemsRes = await db.query(
    `SELECT oi.*, mi.name as menu_name, mi.image_path
     FROM order_items oi
     LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId]
  );

  const items = [];
  for (const it of itemsRes.rows) {
    const optRes = await db.query(
      `SELECT o.id, o.name, o.extra_price, og.name as group_name
       FROM order_item_options oio
       JOIN options o ON o.id = oio.option_id
       JOIN option_groups og ON og.id = o.group_id
       WHERE oio.order_item_id = $1`,
      [it.id]
    );
    const remRes = await db.query(
      `SELECT r.id, r.name FROM order_item_removals oir
       JOIN removable_ingredients r ON r.id = oir.removable_ingredient_id
       WHERE oir.order_item_id = $1`,
      [it.id]
    );
    const basePrice = Number(it.item_price);
    const extra = Number(it.customization_extra || 0);
    const unit = basePrice + extra;
    const subtotal = unit * it.quantity;
    items.push({
      id: it.id,
      menuItemId: it.menu_item_id,
      name: it.menu_name || '(silinmiş)',
      image_path: it.image_path,
      quantity: it.quantity,
      basePrice,
      customizationExtra: extra,
      unit,
      subtotal,
      options: optRes.rows.map(o => ({
        groupName: o.group_name,
        name: o.name,
        extra: Number(o.extra_price)
      })),
      removals: remRes.rows.map(r => ({ name: r.name }))
    });
  }

  return { order, items, user, caterer };
}

module.exports = { fetchOrderFull };
