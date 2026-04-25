# Sofranet

CENG 382 - Web Programming dersi dönem projesi.

Sofranet, kullanıcıların yakınlarındaki restoranları görüp sipariş verebildiği bir catering platformudur. Üç farklı kullanıcı rolü vardır: admin, caterer (restoran sahibi) ve müşteri.

## Özellikler

- Üç kullanıcı rolü (admin, caterer, user) ve role bazlı yetkilendirme
- Email + şifre ile kayıt ve giriş, opsiyonel 2FA
- Caterer'lar için menü yönetimi (görsel yükleme, customization seçenekleri)
- Kullanıcılar için lokasyon bazlı restoran filtreleme (Google Maps API)
- Sepet ve simüle ödeme sistemi
- Sipariş tamamlandığında otomatik email + dinamik PDF üretimi (makbuz + sözleşme)
- Tamamlanan siparişe bağlı rating ve yorum sistemi
- Admin için log görüntüleme paneli
- Filter ve pagination destekli tablolar
- Her role özel dashboard

## Kullanılan Teknolojiler

- Node.js, Express
- PostgreSQL
- EJS (templating)
- Bootstrap 5 + custom CSS
- Multer (file upload), PDFKit (pdf), Nodemailer (email)
- Google Maps JavaScript API, Distance Matrix API

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env içindeki bilgileri kendi ortamına göre doldur

# PostgreSQL'de veritabanını oluştur
createdb sofranet
psql sofranet < database/schema.sql
psql sofranet < database/seed.sql

# Uygulamayı çalıştır
npm start
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Ortam Değişkenleri

`.env.example` dosyasında tüm gerekli değişkenler listelidir. En kritikleri:

- `DATABASE_URL` - PostgreSQL bağlantı string'i
- `SESSION_SECRET` - express-session için secret
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - email için
- `PORT` - default 3000

## Test Hesapları

Seed data ile gelen test hesapları:

| Rol | Email | Şifre |
|---|---|---|
| Admin | admin@sofranet.com | admin123 |
| Caterer | lezzet@sofranet.com | caterer123 |
| Caterer | mahalle@sofranet.com | caterer123 |
| User | ali@example.com | user123 |
| User | ayse@example.com | user123 |

## Klasör Yapısı

```
sofranet/
├── server.js              # Ana entry point
├── config/                # DB ve session config
├── routes/                # Express route'ları
├── controllers/           # İş mantığı
├── services/              # Email, PDF, location servisleri
├── middleware/            # Auth, upload, logger middleware
├── views/                 # EJS template'ler
├── public/                # Static dosyalar (CSS, JS, görseller)
├── database/              # SQL şema ve seed
└── utils/                 # Yardımcı fonksiyonlar
```

## Notlar

- Ödeme tamamen simüle edilmiştir, gerçek kart bilgisi kullanılmamalıdır.
- Google Maps API key olmadan harita ve geocode özellikleri placeholder davranır (kayıtta lat/lng null kalır, profile'dan tarayıcı geolokasyonu ile sonradan eklenebilir).
- PDF'ler her sipariş için kod ile dinamik olarak üretilir.

## Geliştiren

**Yusuf Şimşek** - 202138008  
Çankaya Üniversitesi - Yönetim Bilişim Sistemleri  
CENG 382 - Web Programming, 2025-2026 Bahar Dönemi

## Referanslar

- Express.js Documentation - https://expressjs.com/
- PostgreSQL Documentation - https://www.postgresql.org/docs/
- Google Maps Platform Documentation - https://developers.google.com/maps/documentation
- PDFKit Documentation - http://pdfkit.org/
- Nodemailer Documentation - https://nodemailer.com/
- MDN Web Docs - https://developer.mozilla.org/
- Bootstrap 5 Documentation - https://getbootstrap.com/docs/5.3/
