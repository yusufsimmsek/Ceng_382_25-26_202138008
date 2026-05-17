# Sofranet

CENG 382 - Web Programming dersi dönem projesi.

**GitHub Reposu**: https://github.com/yusufsimmsek/Ceng_382_25-26_202138008

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

## Email Test Etmek

SMTP credentials yoksa email gönderilmez ama uygulama crash etmez (graceful degradation).

Test için seçenekler:

- **Mailtrap** (önerilen, free tier yeterli): mailtrap.io üzerinden bir inbox aç, sandbox SMTP credentials'larını `.env`'e yaz.
- **Gmail**: 2FA açıkken App Password üret, `SMTP_USER` ve `SMTP_PASS`'a yaz. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.
- **Local maildev**: `npm install -g maildev` ile kur, `maildev` komutu ile başlat. `.env`'de `SMTP_HOST=localhost`, `SMTP_PORT=1025`, user/pass boş bırakılabilir (maildev auth aramaz; yine de boş geçemediğin için dummy değer kullanabilirsin).

## PDF Türkçe Karakter Desteği

PDF makbuzlarda Türkçe karakterler (ş, ğ, ı, ç, ö, ü) düzgün gözükmesi için Roboto fontunu indirebilirsin:

1. Google Fonts → Roboto sayfasından `Roboto-Regular.ttf` ve `Roboto-Bold.ttf` dosyalarını indir.
2. Bu iki dosyayı `public/fonts/` klasörüne koy.

Bu fontlar olmazsa PDFKit default Helvetica kullanır; bu durumda kodda ASCII karşılıkları (örn. "Hazirlaniyor") kullanılır, çalışır ama Türkçe karakterler yarım kalır.

## Notlar

- Ödeme tamamen simüle edilmiştir, gerçek kart bilgisi kullanılmamalıdır.
- Test için `4242 4242 4242 4242` kullanılabilir, son haneleri `0000` olan kartlar bilerek reddedilir (failure path test için).
- Google Maps API key olmadan harita ve geocode özellikleri placeholder davranır (kayıtta lat/lng null kalır, profile'dan tarayıcı geolokasyonu ile sonradan eklenebilir).
- SMTP yapılandırılmamışsa email'ler atlanır, sipariş akışı yine çalışır.
- PDF'ler her sipariş için kod ile dinamik olarak üretilir, statik template değildir.

## Demo Senaryosu

Yaklaşık 10 dakikalık bir demo için önerilen akış:

**1. Anonim - Anasayfa & Menüler (~1 dk)**
- `/` aç, hero ve feature kartları
- `/menu` tıkla, kartları göster, bir tanesine tıkla
- Detay sayfası (görsel, customization seçenekleri, harita)

**2. Kayıt & Login (~1 dk)**
- `/register` → yeni user oluştur (caterer kaydı seçeneği: adres + geocoding otomatik)
- Login

**3. User akışı (~3 dk)**
- `/menu` → konumumu belirle (HTML5 geolocation)
- Yarıçap değiştir (10 km → 50 km)
- "Haritada Göster" toggle (Google Maps marker)
- Bir item seç → customization (option group + removable)
- Sepete ekle → `/cart`
- `/cart/checkout` → kart bilgisi (4242 4242 4242 4242) → ödeme onayla → sipariş oluştur
- `/orders/:id/success` → makbuz indir + sözleşme indir (PDF'leri aç, dinamik içeriği göster)
- Email inbox (Mailtrap'te user ve caterer email'leri)

**4. Caterer akışı (~2 dk)**
- Caterer hesabıyla login
- `/caterer` dashboard (stats + bekleyen sipariş alert)
- `/caterer/menu` → yeni menü ekle (image upload + customization sayfası)
- `/caterer/orders` → siparişin durumunu "preparing → completed" yap (status dropdown)

**5. Rating sistemi (~1 dk)**
- User hesabına dön
- `/orders` → tamamlanan siparişe "Değerlendir" → yıldız + yorum gönder
- `/menu` → o caterer'ın average rating'inin güncellendiğini göster

**6. Admin akışı (~1 dk)**
- Admin ile login
- `/admin` dashboard (sistem geneli stats)
- `/admin/users`, `/admin/caterers`, `/admin/orders` - filter + pagination
- `/admin/logs` - filter (action, user, date) ile log inceleme

**7. Bonus: 2FA (~1 dk)**
- User profile → 2FA Etkinleştir
- Logout → Login → email'e gelen 6 haneli kod
- `/auth/2fa` kod gir → tam login

Demo sırasında vurgulanacaklar:
- Customization tamamen dinamik, caterer kendi tanımlar
- PDF'ler her sipariş için kodla üretiliyor (statik template yok)
- Lokasyon filtreleme Google Maps Distance Matrix API ile gerçek yol mesafesi (Haversine pre-filter ile quota tasarrufu)
- Rating sadece tamamlanmış siparişe bağlı, fraud önlenmiş

## Geliştiren

**Yusuf Şimşek** - 202138008  
Çankaya Üniversitesi - Yönetim Bilişim Sistemleri  
CENG 382 - Web Programming, 2025-2026 Bahar Dönemi

## Referanslar

- Express.js - https://expressjs.com/
- PostgreSQL - https://www.postgresql.org/docs/
- Google Maps Platform - https://developers.google.com/maps/documentation
  - Geocoding API
  - Distance Matrix API
  - Maps JavaScript API
- PDFKit - http://pdfkit.org/
- Nodemailer - https://nodemailer.com/
- Bootstrap 5 - https://getbootstrap.com/docs/5.3/
- MDN Web Docs - https://developer.mozilla.org/
- bcrypt (password hashing), express-session, multer (file upload), pg (PostgreSQL client) - npm
