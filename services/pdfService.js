// PDFKit ile makbuz + sozlesme uretimi
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '#E63946';
const MUTED = '#666666';
const LIGHT_BORDER = '#dddddd';

const FONT_REG = path.join(__dirname, '..', 'public', 'fonts', 'Roboto-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'public', 'fonts', 'Roboto-Bold.ttf');
const HAS_FONTS = fs.existsSync(FONT_REG) && fs.existsSync(FONT_BOLD);

// Roboto yoksa Helvetica kullaniyoruz; Helvetica turkce karakterleri (s,g,i,o,u,c) degil
// onlarin alt halini gosterir veya hic gostermez. Bu yuzden ASCII'ye degrade ederiz.
const TR_MAP = {
  'ş': 's', 'Ş': 'S',
  'ı': 'i', 'İ': 'I',
  'ğ': 'g', 'Ğ': 'G',
  'ç': 'c', 'Ç': 'C',
  'ö': 'o', 'Ö': 'O',
  'ü': 'u', 'Ü': 'U',
  '₺': 'TL ',
  '©': '(c)',
  '·': '-'
};

function tr(s) {
  if (s == null) return '';
  const str = String(s);
  if (HAS_FONTS) return str;
  return str.replace(/[şŞıİğĞçÇöÖüÜ₺©·]/g, (ch) => TR_MAP[ch] || ch);
}

function applyFonts(doc) {
  if (HAS_FONTS) {
    doc.registerFont('reg', FONT_REG);
    doc.registerFont('bold', FONT_BOLD);
    return { reg: 'reg', bold: 'bold', supportsTurkish: true };
  }
  return { reg: 'Helvetica', bold: 'Helvetica-Bold', supportsTurkish: false };
}

function formatTL(n) {
  return tr('₺' + Number(n).toFixed(2));
}

function formatDate(d) {
  const dt = new Date(d);
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function statusTR(s) {
  const map = { pending: 'Bekliyor', preparing: 'Hazırlanıyor', completed: 'Tamamlandı', cancelled: 'İptal' };
  return tr(map[s] || s);
}

// ============================
// MAKBUZ
// ============================
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

      // HEADER
      doc.font(fonts.bold).fontSize(26).fillColor(PRIMARY_COLOR)
        .text('SOFRANET', 50, 50);
      doc.font(fonts.bold).fontSize(14).fillColor('#333')
        .text('MAKBUZ', 450, 56, { align: 'right' });

      doc.moveTo(50, 90).lineTo(545, 90).strokeColor(PRIMARY_COLOR).lineWidth(1.5).stroke();

      // SIPARIS BILGI
      doc.font(fonts.reg).fontSize(10).fillColor('#000');
      const infoY = 110;
      doc.text(tr('Makbuz No: #') + order.id, 50, infoY);
      doc.text(tr('Tarih: ') + formatDate(order.created_at), 50, infoY + 15);
      doc.text(tr('Durum: ') + statusTR(order.status), 50, infoY + 30);
      doc.text(tr('Ödeme: Kart (Simülasyon)'), 50, infoY + 45);

      // MUSTERI / RESTORAN
      const boxY = 175;
      const boxH = 90;
      doc.rect(50, boxY, 240, boxH).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.font(fonts.bold).fontSize(10).fillColor(PRIMARY_COLOR)
        .text(tr('MÜŞTERİ'), 60, boxY + 8);
      doc.font(fonts.reg).fontSize(9).fillColor('#000');
      doc.text(tr('Ad: ') + tr(user.name || '-'), 60, boxY + 25);
      doc.text(tr('Email: ') + tr(user.email || '-'), 60, boxY + 38);
      doc.text(tr('Tel: ') + tr(user.phone || '-'), 60, boxY + 51);
      doc.text(tr('Adres: ') + tr(order.delivery_address || user.address || '-'), 60, boxY + 64, { width: 220 });

      doc.rect(305, boxY, 240, boxH).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.font(fonts.bold).fontSize(10).fillColor(PRIMARY_COLOR)
        .text(tr('RESTORAN'), 315, boxY + 8);
      doc.font(fonts.reg).fontSize(9).fillColor('#000');
      doc.text(tr('Ad: ') + tr(caterer.name || '-'), 315, boxY + 25);
      doc.text(tr('Email: ') + tr(caterer.email || '-'), 315, boxY + 38);
      doc.text(tr('Adres: ') + tr(caterer.address || '-'), 315, boxY + 51, { width: 220 });

      // TABLO
      const tableY = boxY + boxH + 20;
      doc.rect(50, tableY, 495, 20).fillColor('#f0f0f0').fill();
      doc.fillColor('#000').font(fonts.bold).fontSize(10);
      doc.text(tr('Ürün'), 60, tableY + 6);
      doc.text(tr('Adet'), 320, tableY + 6, { width: 40, align: 'right' });
      doc.text(tr('Birim'), 370, tableY + 6, { width: 80, align: 'right' });
      doc.text(tr('Toplam'), 460, tableY + 6, { width: 80, align: 'right' });

      let cursorY = tableY + 25;
      doc.font(fonts.reg).fontSize(9).fillColor('#000');

      items.forEach((it) => {
        doc.font(fonts.bold).fontSize(10);
        doc.text(tr(it.name), 60, cursorY, { width: 250 });
        doc.font(fonts.reg).fontSize(10);
        doc.text(String(it.quantity), 320, cursorY, { width: 40, align: 'right' });
        doc.text(formatTL(it.unit), 370, cursorY, { width: 80, align: 'right' });
        doc.text(formatTL(it.subtotal), 460, cursorY, { width: 80, align: 'right' });
        cursorY += 14;

        if (it.options && it.options.length > 0) {
          doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
          const optStr = tr('  + ' + it.options.map(o =>
            o.groupName + ': ' + o.name + (o.extra > 0 ? ' (+' + formatTL(o.extra) + ')' : '')
          ).join(', '));
          doc.text(optStr, 60, cursorY, { width: 480 });
          cursorY += 12;
          doc.fillColor('#000');
        }
        if (it.removals && it.removals.length > 0) {
          doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
          doc.text(tr('  - Çıkarıldı: ' + it.removals.map(r => r.name).join(', ')), 60, cursorY, { width: 480 });
          cursorY += 12;
          doc.fillColor('#000');
        }
        cursorY += 4;

        if (cursorY > 720) {
          doc.addPage();
          cursorY = 60;
        }
      });

      doc.moveTo(350, cursorY + 6).lineTo(545, cursorY + 6).strokeColor('#333').lineWidth(1).stroke();
      cursorY += 14;
      doc.font(fonts.bold).fontSize(13).fillColor(PRIMARY_COLOR);
      doc.text(tr('GENEL TOPLAM:'), 350, cursorY, { width: 110, align: 'right' });
      doc.text(formatTL(order.total_amount), 460, cursorY, { width: 80, align: 'right' });

      // FOOTER
      doc.moveDown(3);
      const fy = doc.y;
      doc.moveTo(50, fy).lineTo(545, fy).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.font(fonts.reg).fontSize(8).fillColor(MUTED);
      doc.text(tr('Bu makbuz Sofranet sistemi tarafından otomatik oluşturulmuştur.'), { align: 'center', width: 495 });
      doc.text(tr('Bu bir simülasyon işlemidir, gerçek ödeme yapılmamıştır.'), { align: 'center', width: 495 });
      doc.moveDown(0.5);
      doc.text(tr('Sofranet © 2026 · sofranet.com'), { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ============================
// SOZLESME
// ============================
function generateAgreement(order, items, user, caterer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });
      const fonts = applyFonts(doc);

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const year = new Date(order.created_at).getFullYear();
      const sozNo = 'SOF-' + order.id + '-' + year;

      // 1) BASLIK
      doc.font(fonts.bold).fontSize(20).fillColor('#000')
        .text(tr('HİZMET SÖZLEŞMESİ'), { align: 'center' });
      doc.moveDown(0.3);
      doc.font(fonts.reg).fontSize(10).fillColor(MUTED)
        .text(tr('Sözleşme No: ') + sozNo, { align: 'center' });
      doc.fillColor('#000').fontSize(9)
        .text(tr('Düzenleme Tarihi: ') + formatDate(order.created_at), { align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.moveDown(1.5);

      // 2) TARAFLAR
      doc.font(fonts.bold).fontSize(14).fillColor(PRIMARY_COLOR).text(tr('TARAFLAR'));
      doc.moveDown(0.5);

      doc.font(fonts.bold).fontSize(11).fillColor('#000')
        .text(tr('1. TARAF (HİZMET SAĞLAYICI)'));
      doc.font(fonts.reg).fontSize(10);
      doc.text(tr('Unvan: ') + tr(caterer.name || '-'));
      doc.text(tr('Email: ') + tr(caterer.email || '-'));
      doc.text(tr('Telefon: ') + tr(caterer.phone || '-'));
      doc.text(tr('Adres: ') + tr(caterer.address || '-'));
      doc.moveDown(0.5);

      doc.font(fonts.bold).fontSize(11).fillColor('#000')
        .text(tr('2. TARAF (ALICI / MÜŞTERİ)'));
      doc.font(fonts.reg).fontSize(10);
      doc.text(tr('Ad Soyad: ') + tr(user.name || '-'));
      doc.text(tr('Email: ') + tr(user.email || '-'));
      doc.text(tr('Telefon: ') + tr(user.phone || '-'));
      doc.text(tr('Teslimat Adresi: ') + tr(order.delivery_address || '-'));
      doc.moveDown(1);

      // 3) SOZLESME KONUSU
      doc.font(fonts.bold).fontSize(12).fillColor(PRIMARY_COLOR).text(tr('SÖZLEŞME KONUSU'));
      doc.moveDown(0.3);
      doc.font(fonts.reg).fontSize(10).fillColor('#000');
      doc.text(
        tr('İşbu sözleşme, 2. Taraf\'ın 1. Taraf\'tan Sofranet platformu üzerinden almış olduğu yiyecek ve içecek hizmetlerinin koşullarını düzenler. Sipariş No: #')
          + order.id + tr(', sipariş tarihi ') + formatDate(order.created_at)
          + tr('\'tır. Sipariş tutarı toplam ') + formatTL(order.total_amount) + tr('\'dir.'),
        { align: 'justify' }
      );
      doc.moveDown(1);

      // 4) SIPARIS ICERIGI
      doc.font(fonts.bold).fontSize(12).fillColor(PRIMARY_COLOR).text(tr('SİPARİŞ İÇERİĞİ'));
      doc.moveDown(0.3);

      const orderTableY = doc.y;
      doc.rect(60, orderTableY, 475, 18).fillColor('#f0f0f0').fill();
      doc.fillColor('#000').font(fonts.bold).fontSize(9);
      doc.text(tr('Sıra'), 65, orderTableY + 5, { width: 40 });
      doc.text(tr('Ürün'), 110, orderTableY + 5, { width: 270 });
      doc.text(tr('Adet'), 385, orderTableY + 5, { width: 50, align: 'right' });
      doc.text(tr('Tutar'), 440, orderTableY + 5, { width: 90, align: 'right' });

      let oy = orderTableY + 22;
      doc.font(fonts.reg).fontSize(9).fillColor('#000');
      items.forEach((it, i) => {
        doc.text(String(i + 1), 65, oy, { width: 40 });
        doc.text(tr(it.name), 110, oy, { width: 270 });
        doc.text(String(it.quantity), 385, oy, { width: 50, align: 'right' });
        doc.text(formatTL(it.subtotal), 440, oy, { width: 90, align: 'right' });
        oy += 16;
        if (oy > 700) {
          doc.addPage();
          oy = 60;
        }
      });

      // tablo alti toplam
      doc.moveTo(380, oy + 2).lineTo(535, oy + 2).strokeColor('#333').lineWidth(0.5).stroke();
      doc.font(fonts.bold).fontSize(11).fillColor(PRIMARY_COLOR);
      doc.text(tr('TOPLAM:'), 380, oy + 6, { width: 60, align: 'right' });
      doc.text(formatTL(order.total_amount), 440, oy + 6, { width: 90, align: 'right' });
      doc.fillColor('#000');
      doc.y = oy + 30;

      // 5) GENEL HUKUMLER
      doc.moveDown(0.5);
      doc.font(fonts.bold).fontSize(12).fillColor(PRIMARY_COLOR).text(tr('GENEL HÜKÜMLER'));
      doc.moveDown(0.3);

      const maddeler = [
        '1. Taraf, sipariş edilen ürünleri tarif edildiği şekilde ve uygun hijyen koşullarında hazırlamayı taahhüt eder.',
        '2. Taraf, sipariş tutarını sipariş anında ödediğini ve ödemenin Sofranet platformu üzerinden başarıyla gerçekleştirildiğini beyan eder.',
        'Teslimat süresi, sipariş onaylandıktan sonra makul bir süre içerisinde gerçekleşecektir. Olağandışı durumlarda 1. Taraf, 2. Taraf\'ı bilgilendirir.',
        'Sipariş edilen ürünlerde bir uygunsuzluk olması halinde 2. Taraf, teslimattan itibaren 30 dakika içerisinde 1. Taraf veya Sofranet üzerinden durumu bildirebilir.',
        'Sipariş, hazırlık aşamasına geçtikten sonra iptal edilemez. Hazırlık öncesi iptaller için 2. Taraf, Sofranet üzerinden talepte bulunabilir.',
        'Taraflar, kişisel verilerin Sofranet Gizlilik Politikası çerçevesinde işlendiğini kabul eder.',
        'İşbu sözleşmeden doğabilecek uyuşmazlıklarda Türkiye Cumhuriyeti yasaları geçerli olup, taraflar İstanbul Mahkemeleri\'nin yetkili olduğunu kabul eder.'
      ];
      doc.font(fonts.reg).fontSize(10).fillColor('#000');
      maddeler.forEach((m, i) => {
        doc.text(tr((i + 1) + '. ' + m), { align: 'justify' });
        doc.moveDown(0.3);
      });

      // 6) ONAY + IMZA
      doc.moveDown(1);
      doc.font(fonts.reg).fontSize(10).fillColor('#000')
        .text(tr('Bu sözleşme, 2. Taraf\'ın sipariş onayı ile dijital olarak kabul edilmiştir.'), { align: 'center' });
      doc.moveDown(1.5);

      // iki imza kutusu yan yana
      const sigY = doc.y;
      const leftX = 80;
      const rightX = 320;
      doc.moveTo(leftX, sigY + 20).lineTo(leftX + 160, sigY + 20).stroke();
      doc.moveTo(rightX, sigY + 20).lineTo(rightX + 160, sigY + 20).stroke();

      doc.font(fonts.bold).fontSize(9);
      doc.text(tr('1. TARAF'), leftX, sigY + 26, { width: 160, align: 'center' });
      doc.text(tr('2. TARAF'), rightX, sigY + 26, { width: 160, align: 'center' });
      doc.font(fonts.reg).fontSize(9).fillColor(MUTED);
      doc.text(tr(caterer.name || ''), leftX, sigY + 40, { width: 160, align: 'center' });
      doc.text(tr(user.name || ''), rightX, sigY + 40, { width: 160, align: 'center' });
      doc.y = sigY + 60;

      // 7) FOOTER
      doc.moveDown(2);
      const fy2 = doc.y;
      doc.moveTo(60, fy2).lineTo(535, fy2).strokeColor(LIGHT_BORDER).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
      doc.font(fonts.reg).fontSize(9).fillColor(MUTED);
      doc.text(tr('Bu sözleşme Sofranet sistemi tarafından otomatik olarak düzenlenmiştir.'), { align: 'center' });
      doc.text(tr('Sofranet © 2026 · Sözleşme No: ') + sozNo, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceipt, generateAgreement };
