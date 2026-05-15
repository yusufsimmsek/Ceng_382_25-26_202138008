# Sofranet

CENG 382 dönem projesi - Mahallendeki lezzet kapına gelsin.

ASP.NET Core 8 MVC + EF Core + Identity ile yazılmış bir catering platformu. User / Caterer / Admin rolleri, menü customization, sepet, sipariş, email + PDF üretimi, Google Maps entegrasyonu, rating sistemi ve email-tabanlı 2FA içeriyor.

## Tech Stack

- ASP.NET Core 8 MVC
- Entity Framework Core 8 (SQLite, opsiyonel PostgreSQL)
- ASP.NET Core Identity (auth, roller, 2FA)
- MailKit (SMTP)
- QuestPDF (PDF üretimi)
- Google Maps API (Geocoding, Distance Matrix, JS Maps)
- Bootstrap 5

## Kurulum

Gereken:

- .NET 8 SDK
- (Opsiyonel) SMTP credential'ları, Google Maps API key

```bash
# Repo'yu klonla
git clone <repo-url>
cd Sofranet

# Bağımlılıklar
dotnet restore

# Veritabanı oluştur (SQLite dosyası bin'in dışında, projenin kökünde)
dotnet ef database update

# Çalıştır
dotnet run
```

`http://localhost:5099` üzerinden açılır. İlk çalıştırmada `SeedData.InitializeAsync` çalışır ve örnek kullanıcı + menü verileri eklenir.

## Konfigürasyon

`appsettings.Development.json` dosyasında doldurulabilecek alanlar:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=sofranet.db"
  },
  "GoogleMaps": {
    "ApiKey": "<google-maps-api-key>"
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "User": "user@example.com",
    "Pass": "***",
    "FromEmail": "noreply@sofranet.com",
    "FromName": "Sofranet"
  }
}
```

Hepsi boş bırakılabilir — uygulama bu durumda graceful davranır:

- SMTP yoksa email log'a yazılır, gönderim atlanır
- Google Maps key yoksa Distance Matrix yerine Haversine, harita yerine fallback mesaj
- 2FA çalışır ama kod email'e gitmez (sadece log)

## Seed Kullanıcılar

| Email                       | Şifre        | Rol     |
|-----------------------------|--------------|---------|
| admin@sofranet.com          | Admin123     | Admin   |
| lezzet@sofranet.com         | Caterer123   | Caterer |
| mahalle@sofranet.com        | Caterer123   | Caterer |
| ankaragurme@sofranet.com    | Caterer123   | Caterer |
| ali@example.com             | User123      | User    |
| ayse@example.com            | User123      | User    |
| mehmet@example.com          | User123      | User    |
| zeynep@example.com          | User123      | User    |
| can@example.com             | User123      | User    |

## Test Akışı

1. `ali@example.com` ile giriş → /User dashboard
2. /Menu → menüleri tara, konum filtresi dene
3. Bir ürüne tıkla → customization seç → sepete ekle
4. /Cart → /Cart/Checkout
5. Test kartı: `4242 4242 4242 4242` (CVV: 123, MM/YY: 12/29)
6. Ödeme onayı → Siparişi Oluştur → /Order/Success
7. Makbuz + Sözleşme PDF'lerini indir
8. `lezzet@sofranet.com` ile giriş → /Caterer/Orders → status "preparing" → "completed"
9. ali'ye dön → /Order/MyOrders → "Değerlendir"
10. `admin@sofranet.com` ile giriş → /Admin/Logs → tüm aktiviteler

## Klasör Yapısı

```
Sofranet/
├── Controllers/      # MVC controller'ları
├── Models/           # Entity'ler + ViewModels
├── Data/             # DbContext + SeedData
├── Services/         # Email, PDF, Location, Log
├── Helpers/          # File upload, session, order enrichment
├── Views/            # Razor templates
├── Migrations/       # EF Core migrations
├── wwwroot/          # Static assets
└── Program.cs        # Entry point + DI + middleware
```

## Lisans / Notlar

Bu proje Çankaya Üniversitesi CENG 382 dersi kapsamında geliştirilmiş bir öğrenci ödevidir. Eğitim amaçlıdır.

Geliştiren: Yusuf Şimşek - 202138008
