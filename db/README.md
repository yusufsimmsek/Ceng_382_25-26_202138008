# Database Initialization

İki yol var: **(A) EF Core migration (önerilen)** veya **(B) SQL dump'ı doğrudan import**.

## A. EF Core migration ile (önerilen)

Proje kökünden:

```bash
dotnet ef database update
```

Bu komut `sofranet.db` dosyasını oluşturur, tüm tabloları yaratır. Uygulama ilk başlatıldığında `Data/SeedData.cs` otomatik çalışır ve aşağıdaki veriyi ekler:

- 3 rol (Admin, Caterer, User)
- 1 admin + 3 caterer + 5 user
- 11 menü ürünü
- 7 seçenek grubu + 19 seçenek
- 9 çıkarılabilir malzeme

## B. SQL dump ile

Boş bir SQLite dosyasına doğrudan import:

```bash
# proje kökünde
rm -f sofranet.db
sqlite3 sofranet.db < db/init.sql
```

`init.sql` tüm CREATE TABLE / INDEX statement'larını ve seed INSERT'lerini içerir. Çalışma sırasında üretilen `Orders`, `Ratings`, `LogEntries` gibi tabloların kayıtları çıkarılmıştır (tablo şeması korunur, içleri boştur).

Sonrasında `dotnet run` ile uygulamayı başlatabilirsin. Migration history içeri yazılmış olduğu için `dotnet ef database update` no-op döner.

## Seed Kullanıcılar (parolalar)

| Email | Parola | Rol |
|---|---|---|
| admin@sofranet.com | Admin123 | Admin |
| lezzet@sofranet.com | Caterer123 | Caterer |
| mahalle@sofranet.com | Caterer123 | Caterer |
| ankaragurme@sofranet.com | Caterer123 | Caterer |
| ali@example.com | User123 | User |
| ayse@example.com | User123 | User |
| mehmet@example.com | User123 | User |
| zeynep@example.com | User123 | User |
| can@example.com | User123 | User |

Parolalar Identity'nin PBKDF2 hash'i ile saklanır. SQL dump'taki `PasswordHash` alanları zaten hash'lenmiş halleridir; doğrudan import edilirse yukarıdaki şifrelerle giriş yapılır.
