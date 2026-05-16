# Sofranet - Proje Raporu

**Ders**: CENG 382 - Web Programming
**Dönem**: 2025-2026 Bahar
**Geliştiren**: Yusuf Şimşek - 202138008
**Bölüm**: Yönetim Bilişim Sistemleri, Çankaya Üniversitesi

---

## 1. Giriş

Bu rapor, CENG 382 Web Programming dersinin dönem projesi olarak geliştirilen **Sofranet** uygulamasını anlatmaktadır. Sofranet, kullanıcıların yakınlarındaki yerel restoranlardan online sipariş verebildiği bir catering platformudur. Üç farklı kullanıcı rolü (admin, caterer, user) üzerinden çalışır.

## 2. Proje Genel Bakış

- **Amaç**: Tek bir web uygulaması üzerinden müşteri-restoran arası sipariş akışını yönetmek. Restoran sahipleri menülerini özelleştirerek tanımlar, müşteriler harita üzerinden yakındakileri görüp sipariş verir.
- **Stack**: Node.js + Express + EJS + PostgreSQL.
- **Mimari**: MVC benzeri yapı — `routes/`, `controllers/`, `services/`, `views/`. Klasik server-rendered uygulama, SPA değil.

## 3. Veritabanı Tasarımı

PostgreSQL üzerinde 11 tablo kullanılır:

### Çekirdek Tablolar

- **users**: Tüm kullanıcılar (admin, caterer, user) tek tablo, `role` kolonu ile ayrılır. Lokasyon bilgileri (latitude, longitude) ve 2FA alanları burada tutulur.
- **menu_items**: Caterer'ların oluşturduğu menü kalemleri. Image path, fiyat, açıklama, aktiflik durumu.
- **orders**: Sipariş header'ı. Müşteri, caterer, toplam tutar, durum (pending/preparing/completed/cancelled), teslimat bilgisi.
- **order_items**: Bir siparişin içindeki her bir menü item satırı. Quantity, item_price (snapshot), customization_extra (snapshot).

### Customization Tabloları

Menu item'larının dinamik özelleştirilmesini sağlar:

- **option_groups**: Bir menü item'a bağlı seçenek grubu (örn: "Soslar", "Pilav"). `is_required`, `min_select`, `max_select` ile davranış kontrolü.
- **options**: Bir option_group içindeki seçenekler (örn: "Ketçap", "Pirinç Pilavı"). Her seçeneğin `extra_price`'ı vardır.
- **removable_ingredients**: Bir menü item'dan çıkarılabilecek malzemeler (örn: "Soğan", "Maydanoz").

### Sipariş İlişki Tabloları

- **order_item_options**: Bir sipariş kalemi için seçilen option'lar.
- **order_item_removals**: Bir sipariş kalemi için çıkarılan malzemeler.

### Rating & Log

- **ratings**: Tamamlanmış siparişlere bağlı değerlendirmeler. `UNIQUE(order_id)` constraint ile bir sipariş için tek rating. Menu rating ve caterer rating ayrı kolonlarda.
- **logs**: Sistem aktivite log'ları. Action, details, user, IP, timestamp.

### İlişkiler

- users ↔ menu_items (one-to-many, caterer_id)
- menu_items ↔ option_groups ↔ options (cascading)
- menu_items ↔ removable_ingredients
- orders ↔ order_items ↔ order_item_options + order_item_removals (cascading)
- orders ↔ ratings (one-to-one)
- users ↔ logs (nullable, ON DELETE SET NULL)

Yabancı anahtar bütünlüğü için `ON DELETE CASCADE` ve `ON DELETE SET NULL` ilkeleri uygun yerlerde kullanılmıştır.

## 4. Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Runtime | Node.js 18+ |
| Backend Framework | Express 4.x |
| Templating | EJS + express-ejs-layouts |
| Veritabanı | PostgreSQL 13+ |
| DB Driver | pg (node-postgres) |
| Frontend CSS | Bootstrap 5.3 + custom CSS |
| Frontend JS | Vanilla JavaScript (build step yok) |
| Auth | express-session + bcrypt (10 rounds) |
| File Upload | multer (disk storage, 5MB limit) |
| PDF Generation | PDFKit (programmatic) |
| Email | Nodemailer (SMTP) |
| Maps | Google Maps JavaScript API + Geocoding API + Distance Matrix API |
| Session | connect-flash for transient messages |
| Method Override | method-override (PUT/DELETE via forms) |

## 5. Uygulanan Özellikler

### 5.1 Authentication & Authorization

- Email + şifre ile kayıt ve giriş (bcrypt hash, 10 rounds)
- Session-based auth (express-session, 7 gün)
- 3 farklı rol ve role-based middleware (`requireLogin`, `requireRole`)
- Bonus: Email tabanlı iki adımlı doğrulama (5 dakika geçerli 6 haneli kod)

### 5.2 Menü Yönetimi

Caterer'lar tam CRUD kontrolüne sahiptir:
- Menü item ekleme (görsel upload, fiyat, açıklama)
- Soft delete (is_available=false) — geçmiş siparişlerin bozulmaması için
- Customization yönetimi: option group + options + removable ingredients tamamen dinamik
- Hiçbir customization değeri hardcoded değildir

### 5.3 Lokasyon Bazlı Filtreleme

3 farklı Google Maps API kullanımı:
- **Geocoding API**: Caterer kayıt ve adres güncellemede metin adresi koordinata çevirme
- **Distance Matrix API**: Kullanıcıdan caterer'lara gerçek yol mesafesi hesaplama
- **Maps JavaScript API**: Menü listesinde ve detayda harita görselleştirme

Performans için iki aşamalı filtreleme: önce Haversine formülü ile pre-filter (offline), sonra kalan adaylar için Distance Matrix API çağrısı. API key olmadığında Haversine fallback'i devreye girer.

### 5.4 Sepet ve Sipariş

- Session-based sepet (req.session.cart)
- Bir sepette tek bir caterer kuralı (farklı caterer ekleme denemesinde onay diyaloğu)
- Customization seçimleri (radio/checkbox ile, min/max validation)
- Dinamik fiyat hesaplama (base + extras × quantity)
- Sipariş oluşturma database transaction içinde (BEGIN/COMMIT/ROLLBACK)

### 5.5 Ödeme Simülasyonu

- Kart bilgisi formu (numara, ad, son kullanma, CVV)
- Validation (format kontrolleri)
- `4242 4242 4242 4242` test kartı her zaman başarılı
- Sonu `0000` olan kartlar bilerek reddedilir (test için)
- Diğer durumlar başarılı kabul edilir
- Gerçek kart işlemi yapılmaz, açık uyarı verilir

### 5.6 Email Bildirimleri

Sipariş tamamlandığında otomatik:
- Müşteriye sipariş onayı (item detayları, toplam, teslimat bilgisi)
- Caterer'a yeni sipariş bildirimi (müşteri bilgisi, sipariş içeriği)
- HTML + text fallback
- 2FA kodları için ayrı template

SMTP yapılandırılmamışsa graceful degradation: email atlanır, sipariş yine oluşur.

### 5.7 Dinamik PDF Üretimi

Her sipariş için iki ayrı PDF kodla üretilir:

**Makbuz (Receipt)**
- Başlık, sipariş bilgileri, müşteri/restoran kartları
- Item listesi (her item için option ve removal alt satırlarıyla)
- Toplam tutar

**Sözleşme (Agreement)**
- Resmi format: Taraflar, Sözleşme Konusu, Sipariş İçeriği, 7 Genel Hüküm, İmza alanları
- Sözleşme numarası dinamik: `SOF-{order_id}-{yıl}`

PDF'ler statik template değildir, her seferinde sipariş verisiyle programmatic olarak oluşturulur. Türkçe karakter desteği için opsiyonel Roboto fontu kullanılır, font yoksa Helvetica fallback ile ASCII transliterasyon yapılır.

### 5.8 Rating Sistemi

- Sadece `status='completed'` olan siparişlere puan verilebilir
- Sipariş başına tek rating (UNIQUE constraint)
- Menu item ve caterer için ayrı 1-5 yıldız puanı
- Opsiyonel yorum (max 500 karakter)
- Average rating'ler menü listesi ve detayda gerçek-zamanlı hesaplanır

### 5.9 Logging

10+ farklı action türü loglanır:
- LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT
- USER_REGISTERED
- ORDER_CREATED, ORDER_STATUS_CHANGED
- PAYMENT_PROCESSED, PAYMENT_FAILED
- RATING_SUBMITTED
- EMAIL_SENT, EMAIL_FAILED
- MENU_CREATED, MENU_UPDATED, MENU_DELETED
- 2FA_CODE_SENT, 2FA_FAIL, 2FA_TOGGLED
- ERROR (global handler)

Admin paneli üzerinden filter (action, kullanıcı, IP, tarih aralığı) ve pagination ile incelenebilir.

### 5.10 Dashboards

- **User**: Toplam sipariş, harcama, favori restoran, son siparişler
- **Caterer**: Toplam/tamamlanan sipariş, bekleyen sipariş uyarısı, ortalama puan, en çok satan ürünler, son siparişler
- **Admin**: Sistem geneli istatistikler (7 kart), en aktif caterer'lar, son siparişler

### 5.11 Filter ve Pagination

Tüm büyük tablolarda filter ve pagination uygulanmıştır:
- Admin sayfaları (kullanıcılar, caterer'lar, siparişler, loglar)
- Caterer menü listesi, sipariş listesi
- User sipariş listesi
- Menü tarama sayfası

Ortak `utils/pagination.js` helper ve `views/partials/pagination.ejs` partial ile DRY yaklaşım.

## 6. Karşılaşılan Zorluklar

- **Customization data modeli**: Option group, option, removable ilişkileri ve siparişte bunların snapshot'lanması karmaşıktı. order_items.customization_extra ile fiyat snapshot'ı, order_item_options/removals tabloları ile seçim snapshot'ı yapılarak çözüldü.
- **Distance Matrix API kotası**: Her caterer için ayrı API çağrısı yapmak hem yavaş hem maliyetli. Haversine ile pre-filter yapıp sadece olası adayları Matrix API'ye göndererek optimize edildi.
- **PDF Türkçe karakter**: PDFKit default Helvetica fontu Türkçe karakterleri tam desteklemiyor. Roboto fontu indirilirse kullanılıyor, yoksa ASCII transliterasyon devreye giriyor.
- **Form-based PUT/DELETE**: HTML form'lar sadece GET/POST destekler. method-override middleware ile `_method` parametresi kullanılarak çözüldü.
- **Sepette farklı caterer**: Karışık sepet mantığı karmaşıklaştırırdı. Tek caterer kuralı + onay diyaloğu yaklaşımı tercih edildi.

## 7. Test ve Çalıştırma

README.md dosyasında detaylı kurulum talimatları, test hesapları, demo senaryosu ve referanslar bulunmaktadır.

## 8. Sonuç

Ders kapsamında istenen tüm gereksinimler karşılanmıştır:
- 3 rol ve role-based authorization
- Login authentication sistemi (+ bonus 2FA)
- Role bazlı dashboard'lar
- Menu sistemi ve dinamik customization
- Sepet ve sipariş akışı
- Google Maps API entegrasyonu (3 farklı API)
- Order-linked rating sistemi
- Email bildirimleri
- Dinamik receipt ve agreement PDF üretimi
- Sistem-geneli logging ve admin log paneli
- Tüm tablolarda filter ve pagination
- Ödeme simülasyonu
- Özgün branding ve responsive UI

Projenin grading rubric karşılığı 100 puan + 10 bonus (2FA) hedeflenmiştir.
