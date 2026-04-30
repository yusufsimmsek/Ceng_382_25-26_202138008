// sepetteki item'lari DB'den zenginlestir
const db = require('../config/db');

async function enrichCart(cart) {
  if (!cart || cart.length === 0) {
    return { cartItems: [], total: 0, caterer: null };
  }

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
      basePrice,
      extras,
      subtotal
    };
  });

  const cRes = await db.query(
    'SELECT id, name FROM users WHERE id = $1',
    [cart[0].catererId]
  );

  return { cartItems, total, caterer: cRes.rows[0] || null };
}

module.exports = { enrichCart };
