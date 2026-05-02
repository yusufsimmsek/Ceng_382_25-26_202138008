// PDFKit ile makbuz uretimi
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '#E63946';
const MUTED = '#666666';
const LIGHT_BORDER = '#dddddd';

const FONT_REG = path.join(__dirname, '..', 'public', 'fonts', 'Roboto-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'public', 'fonts', 'Roboto-Bold.ttf');

function applyFonts(doc) {
  // Roboto varsa kullan (turkce karakterleri duzgun gosterir), yoksa Helvetica
  if (fs.existsSync(FONT_REG) && fs.existsSync(FONT_BOLD)) {
    doc.registerFont('reg', FONT_REG);
    doc.registerFont('bold', FONT_BOLD);
    return { reg: 'reg', bold: 'bold' };
  }
  return { reg: 'Helvetica', bold: 'Helvetica-Bold' };
}

function formatTL(n) {
  return 'TL ' + Number(n).toFixed(2);
}

function formatDate(d) {
  const dt = new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function statusTR(s) {
  const map = { pending: 'Bekliyor', preparing: 'Hazirlaniyor', completed: 'Tamamlandi', cancelled: 'Iptal' };
  return map[s] || s;
}

function generateReceipt(order, items, user, caterer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      const fonts = applyFonts(doc);

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ====== HEADER ======
      doc.font(fonts.bold).fontSize(26).fillColor(PRIMARY_COLOR)
        .text('SOFRANET', 50, 50);
      doc.font(fonts.bold).fontSize(14).fillColor('#333')
        .text('MAKBUZ', 450, 56, { align: 'right' });

      doc.moveTo(50, 90).lineTo(545, 90).strokeColor(PRIMARY_COLOR).lineWidth(1.5).stroke();

      doc.moveDown(2);

      // ====== SIPARIS BILGI ======
      doc.font(fonts.reg).fontSize(10).fillColor('#000');
      const infoY = 110;
      doc.text('Makbuz No: #' + order.id, 50, infoY);
      doc.text('Tarih: ' + formatDate(order.created_at), 50, infoY + 15);
      doc.text('Durum: ' + statusTR(order.status), 50, infoY + 30);
      doc.text('Odeme: Kart (Simulation)', 50, infoY + 45);

      // ====== MUSTERI / RESTORAN KUTULARI ======
      const boxY = 175;
      const boxH = 90;
      // sol kutu
      doc.rect(50, boxY, 240, boxH).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.font(fonts.bold).fontSize(10).fillColor(PRIMARY_COLOR)
        .text('MUSTERI', 60, boxY + 8);
      doc.font(fonts.reg).fontSize(9).fillColor('#000');
      doc.text('Ad: ' + (user.name || '-'), 60, boxY + 25);
      doc.text('Email: ' + (user.email || '-'), 60, boxY + 38);
      doc.text('Tel: ' + (user.phone || '-'), 60, boxY + 51);
      doc.text('Adres: ' + (order.delivery_address || user.address || '-'), 60, boxY + 64, { width: 220 });

      // sag kutu
      doc.rect(305, boxY, 240, boxH).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.font(fonts.bold).fontSize(10).fillColor(PRIMARY_COLOR)
        .text('RESTORAN', 315, boxY + 8);
      doc.font(fonts.reg).fontSize(9).fillColor('#000');
      doc.text('Ad: ' + (caterer.name || '-'), 315, boxY + 25);
      doc.text('Email: ' + (caterer.email || '-'), 315, boxY + 38);
      doc.text('Adres: ' + (caterer.address || '-'), 315, boxY + 51, { width: 220 });

      // ====== ITEM TABLOSU ======
      const tableY = boxY + boxH + 20;

      // baslik satiri (gri arkaplan)
      doc.rect(50, tableY, 495, 20).fillColor('#f0f0f0').fill();
      doc.fillColor('#000').font(fonts.bold).fontSize(10);
      doc.text('Urun', 60, tableY + 6);
      doc.text('Adet', 320, tableY + 6, { width: 40, align: 'right' });
      doc.text('Birim', 370, tableY + 6, { width: 80, align: 'right' });
      doc.text('Toplam', 460, tableY + 6, { width: 80, align: 'right' });

      let cursorY = tableY + 25;
      doc.font(fonts.reg).fontSize(9).fillColor('#000');

      items.forEach((it) => {
        // ana satir
        doc.font(fonts.bold).fontSize(10);
        doc.text(it.name, 60, cursorY, { width: 250 });
        doc.font(fonts.reg).fontSize(10);
        doc.text(String(it.quantity), 320, cursorY, { width: 40, align: 'right' });
        doc.text(formatTL(it.unit), 370, cursorY, { width: 80, align: 'right' });
        doc.text(formatTL(it.subtotal), 460, cursorY, { width: 80, align: 'right' });
        cursorY += 14;

        // option/removal alt satirlar
        if (it.options && it.options.length > 0) {
          doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
          const optStr = '  + ' + it.options.map(o =>
            o.groupName + ': ' + o.name + (o.extra > 0 ? ' (+' + formatTL(o.extra) + ')' : '')
          ).join(', ');
          doc.text(optStr, 60, cursorY, { width: 480 });
          cursorY += 12;
          doc.fillColor('#000');
        }
        if (it.removals && it.removals.length > 0) {
          doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
          doc.text('  - Cikarildi: ' + it.removals.map(r => r.name).join(', '), 60, cursorY, { width: 480 });
          cursorY += 12;
          doc.fillColor('#000');
        }
        cursorY += 4;

        // sayfa tasiyorsa kontrol
        if (cursorY > 720) {
          doc.addPage();
          cursorY = 60;
        }
      });

      // toplam cizgi
      doc.moveTo(350, cursorY + 6).lineTo(545, cursorY + 6).strokeColor('#333').lineWidth(1).stroke();
      cursorY += 14;
      doc.font(fonts.bold).fontSize(13).fillColor(PRIMARY_COLOR);
      doc.text('GENEL TOPLAM:', 350, cursorY, { width: 110, align: 'right' });
      doc.text(formatTL(order.total_amount), 460, cursorY, { width: 80, align: 'right' });

      // ====== FOOTER ======
      // total satirin altinda flow ile yaz (absolute Y kullanmiyoruz ki ekstra sayfa olusmasin)
      doc.moveDown(3);
      const fy = doc.y;
      doc.moveTo(50, fy).lineTo(545, fy).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
      doc.text('Bu makbuz Sofranet sistemi tarafindan otomatik olusturulmustur.', { align: 'center', width: 495 });
      doc.text('Bu bir simulasyon islemidir, gercek odeme yapilmamistir.', { align: 'center', width: 495 });
      doc.moveDown(0.5);
      doc.text('Sofranet (c) 2026 - sofranet.com', { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceipt };
