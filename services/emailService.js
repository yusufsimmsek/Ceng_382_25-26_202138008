// nodemailer ile email gonderimi
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP config eksik, email gönderilemeyecek');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
}

function formatTL(n) {
  return '₺' + Number(n).toFixed(2);
}

function formatDate(d) {
  if (!d) return '';
  const date = (d instanceof Date) ? d : new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// her item icin satir HTML uret
function itemRowsHTML(items) {
  return items.map((it) => {
    const optLines = (it.options && it.options.length > 0)
      ? `<div style="font-size:12px; color:#777; margin-top:3px;">${it.options.map(o => o.group_name + ': ' + o.name + (Number(o.extra_price) > 0 ? ' (+' + formatTL(o.extra_price) + ')' : '')).join(', ')}</div>`
      : '';
    const remLines = (it.removals && it.removals.length > 0)
      ? `<div style="font-size:12px; color:#777;">Çıkarıldı: ${it.removals.map(r => r.name).join(', ')}</div>`
      : '';
    const itemName = it.menuItem ? it.menuItem.name : (it.name || '(silinmiş)');
    return `
      <tr>
        <td style="padding:8px; border-bottom:1px dashed #eee;">
          <strong>${it.quantity}x ${itemName}</strong>
          ${optLines}
          ${remLines}
        </td>
        <td style="padding:8px; border-bottom:1px dashed #eee; text-align:right; white-space:nowrap;">
          ${formatTL(it.subtotal)}
        </td>
      </tr>
    `;
  }).join('');
}

function wrapEmail(bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; color: #2B2B2B;">
      <div style="background: #E63946; color: white; padding: 18px 24px;">
        <h2 style="margin: 0;">🍽️ Sofranet</h2>
      </div>
      <div style="padding: 24px;">
        ${bodyHtml}
      </div>
      <div style="background: #f8f9fa; padding: 14px 24px; font-size: 12px; color: #777; text-align: center;">
        Sofranet - Mahallendeki lezzet kapına gelsin
      </div>
    </div>
  `;
}

async function sendOrderConfirmationToUser(user, order, items, caterer) {
  const t = getTransporter();
  if (!t) {
    console.log('email skip - transporter yok (user)');
    return null;
  }

  const html = wrapEmail(`
    <h3>Merhaba ${user.name}, siparişin alındı! ✓</h3>
    <p>Sofranet üzerinden verdiğin sipariş başarıyla alındı. Aşağıda detayları bulabilirsin.</p>

    <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
      <tr><td style="padding:4px 0; color:#777;">Sipariş No</td><td style="padding:4px 0;"><strong>#${order.id}</strong></td></tr>
      <tr><td style="padding:4px 0; color:#777;">Tarih</td><td style="padding:4px 0;">${formatDate(order.created_at)}</td></tr>
      <tr><td style="padding:4px 0; color:#777;">Restoran</td><td style="padding:4px 0;">${caterer.name}</td></tr>
      ${order.delivery_address ? `<tr><td style="padding:4px 0; color:#777;">Teslimat</td><td style="padding:4px 0;">${order.delivery_address}</td></tr>` : ''}
    </table>

    <h4 style="margin-top: 20px;">Ürünler</h4>
    <table style="width:100%; border-collapse:collapse;">
      ${itemRowsHTML(items)}
    </table>

    <div style="text-align:right; margin-top: 14px; font-size: 18px;">
      <strong>Toplam: <span style="color:#E63946;">${formatTL(order.total_amount)}</span></strong>
    </div>

    <p style="margin-top: 30px; color:#555;">Sofranet ekibi</p>
  `);

  const text = `Siparişin #${order.id} alındı.\nRestoran: ${caterer.name}\nToplam: ${formatTL(order.total_amount)}\n`;

  try {
    return await t.sendMail({
      from: process.env.SMTP_USER || 'Sofranet <no-reply@sofranet.com>',
      to: user.email,
      subject: 'Sofranet - Sipariş #' + order.id + ' alındı',
      text,
      html
    });
  } catch (err) {
    console.error('user email gonderim hata:', err.message);
    return null;
  }
}

async function sendOrderNotificationToCaterer(caterer, user, order, items) {
  const t = getTransporter();
  if (!t) {
    console.log('email skip - transporter yok (caterer)');
    return null;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const html = wrapEmail(`
    <h3>Merhaba ${caterer.name}, yeni siparişin var! 📦</h3>
    <p>Sofranet üzerinden yeni bir sipariş aldın. Detaylar aşağıda.</p>

    <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
      <tr><td style="padding:4px 0; color:#777;">Sipariş No</td><td style="padding:4px 0;"><strong>#${order.id}</strong></td></tr>
      <tr><td style="padding:4px 0; color:#777;">Tarih</td><td style="padding:4px 0;">${formatDate(order.created_at)}</td></tr>
      <tr><td style="padding:4px 0; color:#777;">Müşteri</td><td style="padding:4px 0;">${user.name}</td></tr>
      <tr><td style="padding:4px 0; color:#777;">Email</td><td style="padding:4px 0;">${user.email}</td></tr>
      ${user.phone ? `<tr><td style="padding:4px 0; color:#777;">Telefon</td><td style="padding:4px 0;">${user.phone}</td></tr>` : ''}
      ${order.delivery_address ? `<tr><td style="padding:4px 0; color:#777;">Teslimat Adresi</td><td style="padding:4px 0;">${order.delivery_address}</td></tr>` : ''}
    </table>

    <h4 style="margin-top: 20px;">Ürünler</h4>
    <table style="width:100%; border-collapse:collapse;">
      ${itemRowsHTML(items)}
    </table>

    <div style="text-align:right; margin-top: 14px; font-size: 18px;">
      <strong>Toplam: <span style="color:#E63946;">${formatTL(order.total_amount)}</span></strong>
    </div>

    <div style="text-align:center; margin: 24px 0;">
      <a href="${appUrl}/caterer/orders"
         style="background:#E63946; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
        Siparişi Görüntüle
      </a>
    </div>

    <p style="color:#555;">Sofranet ekibi</p>
  `);

  const text = `Yeni sipariş #${order.id} - Toplam ${formatTL(order.total_amount)}\nMüşteri: ${user.name} (${user.email})\nPaneline gir: ${appUrl}/caterer/orders\n`;

  try {
    return await t.sendMail({
      from: process.env.SMTP_USER || 'Sofranet <no-reply@sofranet.com>',
      to: caterer.email,
      subject: 'Sofranet - Yeni Sipariş #' + order.id,
      text,
      html
    });
  } catch (err) {
    console.error('caterer email gonderim hata:', err.message);
    return null;
  }
}

module.exports = {
  sendOrderConfirmationToUser,
  sendOrderNotificationToCaterer
};
