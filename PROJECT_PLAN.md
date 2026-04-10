# Sofranet - Geliştirme Planı

CENG 382 ödevi. Full-stack catering platformu. Bu dosya geliştirme fazlarını ve commit sırasını içerir. Teslim öncesi opsiyonel olarak silinebilir (silmek istemezsen "Proje Planı" başlığı altında kalsın, öğrenci kendi notu gibi durur).

## Stack
- Backend: Node.js + Express
- Templating: EJS
- DB: PostgreSQL
- Auth: express-session + bcrypt
- File upload: Multer
- PDF: PDFKit
- Email: Nodemailer
- Maps: Google Maps JavaScript API + Distance Matrix API
- Frontend: Bootstrap 5 + custom CSS, vanilla JS

## Klasör Yapısı

```
sofranet/
├── server.js
├── package.json
├── .env
├── .env.example
├── .gitignore
├── config/
│   ├── db.js
│   └── session.js
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── caterer.js
│   ├── user.js
│   ├── menu.js
│   ├── cart.js
│   ├── order.js
│   └── rating.js
├── controllers/
├── services/
│   ├── emailService.js
│   ├── pdfService.js
│   └── locationService.js
├── middleware/
│   ├── auth.js
│   ├── upload.js
│   └── logger.js
├── views/
│   ├── layout.ejs
│   ├── partials/
│   ├── auth/
│   ├── admin/
│   ├── caterer/
│   ├── user/
│   └── shared/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── database/
│   ├── schema.sql
│   └── seed.sql
└── utils/
```

## Fazlar ve Commit Listesi

Yaklaşık 40-45 commit. Tamamı 3-4 haftaya yayılacak şekilde geliştirilir.

### Faz 1: Proje Kurulumu

1. `initial commit` - package.json, .gitignore, README iskeleti
2. `add express server boilerplate` - server.js, basic middleware
3. `setup ejs and layout` - views/layout.ejs, public/css temel
4. `add postgres connection` - config/db.js, .env.example
5. `add initial schema for users` - database/schema.sql baslangic

### Faz 2: Authentication & Authorization

6. `register page eklendi` - views/auth/register.ejs
7. `add register backend with bcrypt` - controllers/authController.js
8. `login page and session` - login işlemi + express-session
9. `role based middleware` - middleware/auth.js, logout

### Faz 3: Database Schema (Full)

10. `extend schema with caterers and orders` - schema'yı genişlet
11. `add menu items and customization tables` - customization yapısı
12. `add seed data` - database/seed.sql

### Faz 4: Menu System

13. `caterer dashboard placeholder` - caterer dashboard
14. `menu item creation form` - caterer menü ekleme
15. `add image upload with multer` - menu görseli upload
16. `add customization options ui` - removable/additions/option groups
17. `user menu browsing` - kullanıcı menü listesi
18. `menu detail page` - tek menü detay sayfası
19. `display average ratings on menu` - dinamik rating gösterimi

### Faz 5: Google Maps & Location

20. `google maps api setup` - API key config, key validation
21. `add user location capture` - kullanıcı konumu alma
22. `filter restaurants by distance` - yakındaki restoranlar
23. `add map view to menu page` - harita gösterimi

### Faz 6: Cart & Order

24. `cart functionality` - sepete ekleme, session cart
25. `cart page with totals` - sepet sayfası + dinamik total
26. `customization selection in cart` - sepette customization
27. `payment screen` - ödeme ekranı (simulation)
28. `order creation flow` - sipariş tamamlama

### Faz 7: Email & PDF Generation

29. `add nodemailer email service` - email yapılandırma
30. `purchase notification emails` - alıcı/satıcı email
31. `receipt pdf generation` - makbuz PDF (PDFKit)
32. `agreement pdf generation` - sözleşme PDF

### Faz 8: Rating & Comment System

33. `rating system tied to orders` - tamamlanan siparişe rating
34. `comments on orders` - yorum sistemi
35. `update average rating calculation` - dinamik average

### Faz 9: Dashboards

36. `user dashboard with stats` - kullanıcı dashboard
37. `caterer dashboard with stats` - caterer istatistikler
38. `admin dashboard` - admin overview

### Faz 10: Logging System

39. `add logging middleware` - logger.js
40. `admin logs viewing page` - admin log sayfası
41. `add log filtering` - log filter UI

### Faz 11: Tables, Filtering, Pagination

42. `pagination helper` - utils/pagination.js
43. `add filters to all tables` - tüm tablolarda filter+pagination

### Faz 12: Polish & Branding

44. `custom branding and css polish` - UI cilası
45. `responsive tweaks` - mobil uyumluluk
46. `bug fixes and final touches` - son düzeltmeler

### Bonus (opsiyonel)

47. `add 2fa email verification` - +10 puan
48. `webrtc live call setup` - +20 puan (zaman varsa)

### Submission

49. `update readme with setup instructions`
50. `add references and final docs`

## Grading Karşılık Tablosu

| Madde | Puan | Faz |
|---|---|---|
| Role structure & authorization | 10 | Faz 2, 9 |
| Login auth system | 10 | Faz 2 |
| Role-based dashboards | 10 | Faz 9 |
| Menu system (CRUD + customization) | 12 | Faz 4 |
| Cart & order flow | 8 | Faz 6 |
| Google Maps integration | 10 | Faz 5 |
| Rating system (order-linked) | 8 | Faz 8 |
| Email system | 6 | Faz 7 |
| Receipt PDF | 5 | Faz 7 |
| Agreement PDF | 5 | Faz 7 |
| Logging system | 6 | Faz 10 |
| Admin logging page | 4 | Faz 10 |
| Filter & pagination | 3 | Faz 11 |
| Payment simulation | 3 | Faz 6 |
| UI/UX & branding | 5 | Faz 12 |
| Report, scripts, demo | 5 | Submission |

Toplam: 100 puan
Bonus: +30 (2FA +10, Live Call +20)

## Zamanlama Önerisi

- Hafta 1: Faz 1-3 (kurulum + auth + schema)
- Hafta 2: Faz 4-5 (menu + maps)
- Hafta 3: Faz 6-8 (cart + email/pdf + rating)
- Hafta 4: Faz 9-12 (dashboards + logs + polish)
- Bonus: Hafta 4 sonu / ekstra gün

Commit'leri farklı saat ve günlere yayalım. Cumartesi-Pazar yoğun, hafta içi seyrek olur tipik bir öğrencide.
