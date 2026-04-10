using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sofranet.Models;

namespace Sofranet.Data;

public static class SeedData
{
    public static readonly string[] Roles = { "Admin", "Caterer", "User" };

    public static async Task InitializeAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Migration uygula
        await db.Database.MigrateAsync();

        // Roller
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Admin
        var admin = await EnsureUser(userManager, "admin@sofranet.com", "Admin123",
            fullName: "Sistem Yöneticisi", role: "Admin");

        // Catererlar
        var lezzet = await EnsureUser(userManager, "lezzet@sofranet.com", "Caterer123",
            fullName: "Lezzet Mutfağı",
            address: "Moda Cad. No:42, Kadıköy / İstanbul",
            lat: 40.9928, lng: 29.0264, role: "Caterer");

        var mahalle = await EnsureUser(userManager, "mahalle@sofranet.com", "Caterer123",
            fullName: "Mahalle Sofrası",
            address: "Cihangir Mah. Sıraselviler Cad. No:11, Beyoğlu / İstanbul",
            lat: 41.0319, lng: 28.9806, role: "Caterer");

        var ankara = await EnsureUser(userManager, "ankaragurme@sofranet.com", "Caterer123",
            fullName: "Ankara Gurme",
            address: "Tunalı Hilmi Cad. No:88, Çankaya / Ankara",
            lat: 39.9034, lng: 32.8617, role: "Caterer");

        // Userlar
        await EnsureUser(userManager, "ali@example.com", "User123",
            fullName: "Ali Yılmaz",
            address: "Kadıköy / İstanbul", lat: 40.9847, lng: 29.0316, role: "User");
        await EnsureUser(userManager, "ayse@example.com", "User123",
            fullName: "Ayşe Demir",
            address: "Beyoğlu / İstanbul", lat: 41.0370, lng: 28.9850, role: "User");
        await EnsureUser(userManager, "mehmet@example.com", "User123",
            fullName: "Mehmet Kaya",
            address: "Çankaya / Ankara", lat: 39.9080, lng: 32.8541, role: "User");
        await EnsureUser(userManager, "zeynep@example.com", "User123",
            fullName: "Zeynep Şahin",
            address: "Üsküdar / İstanbul", lat: 41.0214, lng: 29.0151, role: "User");
        await EnsureUser(userManager, "can@example.com", "User123",
            fullName: "Can Aydın",
            address: "Yenimahalle / Ankara", lat: 39.9650, lng: 32.7872, role: "User");

        // Menü itemları (her caterer için 3-4 tane)
        if (!await db.MenuItems.AnyAsync())
        {
            await SeedMenuItems(db, lezzet!, mahalle!, ankara!);
        }
    }

    private static async Task<ApplicationUser?> EnsureUser(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string fullName,
        string role,
        string? address = null,
        double? lat = null,
        double? lng = null)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null) return existing;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = fullName,
            Address = address,
            Latitude = lat,
            Longitude = lng,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"User oluşturulamadı ({email}): {errors}");
        }

        await userManager.AddToRoleAsync(user, role);
        return user;
    }

    private static async Task SeedMenuItems(ApplicationDbContext db,
        ApplicationUser lezzet, ApplicationUser mahalle, ApplicationUser ankara)
    {
        // Lezzet Mutfağı - Lahmacun, Adana, Künefe, Pide
        var lahmacun = new MenuItem
        {
            CatererId = lezzet.Id,
            Name = "Lahmacun",
            Description = "İnce hamur üzerinde özel kıymalı harç, taş fırında.",
            Price = 60m,
            ImagePath = "/images/no-image.svg",
            IsAvailable = true
        };
        lahmacun.OptionGroups.Add(new OptionGroup
        {
            Name = "Sos",
            IsRequired = false,
            MinSelect = 0,
            MaxSelect = 2,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Acı Sos", ExtraPrice = 0 },
                new MenuOption { Name = "Sumak", ExtraPrice = 0 },
                new MenuOption { Name = "Limon", ExtraPrice = 0 }
            }
        });
        lahmacun.RemovableIngredients.Add(new RemovableIngredient { Name = "Soğan" });
        lahmacun.RemovableIngredients.Add(new RemovableIngredient { Name = "Maydanoz" });
        lahmacun.RemovableIngredients.Add(new RemovableIngredient { Name = "Domates" });

        var adana = new MenuItem
        {
            CatererId = lezzet.Id,
            Name = "Adana Dürüm",
            Description = "Acılı kıyma kebabı, lavaşta sarılmış.",
            Price = 180m,
            ImagePath = "/images/no-image.svg"
        };
        adana.OptionGroups.Add(new OptionGroup
        {
            Name = "Acılık",
            IsRequired = true,
            MinSelect = 1,
            MaxSelect = 1,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Az Acılı", ExtraPrice = 0 },
                new MenuOption { Name = "Orta", ExtraPrice = 0 },
                new MenuOption { Name = "Çok Acılı", ExtraPrice = 0 }
            }
        });
        adana.OptionGroups.Add(new OptionGroup
        {
            Name = "Garnitür",
            IsRequired = false,
            MinSelect = 0,
            MaxSelect = 3,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Bulgur Pilavı", ExtraPrice = 25 },
                new MenuOption { Name = "Patates Kızartması", ExtraPrice = 30 },
                new MenuOption { Name = "Közlenmiş Biber", ExtraPrice = 15 }
            }
        });
        adana.RemovableIngredients.Add(new RemovableIngredient { Name = "Soğan" });

        var kunefe = new MenuItem
        {
            CatererId = lezzet.Id,
            Name = "Künefe",
            Description = "Tel kadayıf arasında peynir, üzerine şerbet ve fıstık.",
            Price = 130m,
            ImagePath = "/images/no-image.svg"
        };
        kunefe.OptionGroups.Add(new OptionGroup
        {
            Name = "Yanında",
            IsRequired = false,
            MinSelect = 0,
            MaxSelect = 1,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Dondurma", ExtraPrice = 25 },
                new MenuOption { Name = "Kaymak", ExtraPrice = 20 }
            }
        });

        var pide = new MenuItem
        {
            CatererId = lezzet.Id,
            Name = "Kıymalı Pide",
            Description = "El açması hamur, taze kıyma, biber, taş fırın.",
            Price = 140m,
            ImagePath = "/images/no-image.svg"
        };
        pide.RemovableIngredients.Add(new RemovableIngredient { Name = "Biber" });
        pide.RemovableIngredients.Add(new RemovableIngredient { Name = "Soğan" });

        db.MenuItems.AddRange(lahmacun, adana, kunefe, pide);

        // Mahalle Sofrası - ev yemekleri
        var kuru = new MenuItem
        {
            CatererId = mahalle.Id,
            Name = "Kuru Fasulye",
            Description = "Etli kuru fasulye, salça ve tereyağı ile.",
            Price = 120m,
            ImagePath = "/images/no-image.svg"
        };
        kuru.OptionGroups.Add(new OptionGroup
        {
            Name = "Yanında",
            IsRequired = true,
            MinSelect = 1,
            MaxSelect = 2,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Pilav", ExtraPrice = 20 },
                new MenuOption { Name = "Bulgur Pilavı", ExtraPrice = 20 },
                new MenuOption { Name = "Turşu", ExtraPrice = 15 }
            }
        });

        var mantili = new MenuItem
        {
            CatererId = mahalle.Id,
            Name = "Mantı",
            Description = "El açması mantı, yoğurt ve tereyağlı sos.",
            Price = 150m,
            ImagePath = "/images/no-image.svg"
        };
        mantili.RemovableIngredients.Add(new RemovableIngredient { Name = "Sarımsak" });
        mantili.RemovableIngredients.Add(new RemovableIngredient { Name = "Nane" });

        var icliKofte = new MenuItem
        {
            CatererId = mahalle.Id,
            Name = "İçli Köfte (4 adet)",
            Description = "Bulgur ve iç harç, kızartma.",
            Price = 110m,
            ImagePath = "/images/no-image.svg"
        };

        var sutlac = new MenuItem
        {
            CatererId = mahalle.Id,
            Name = "Fırın Sütlaç",
            Description = "Geleneksel fırın sütlaç, üzeri karamelize.",
            Price = 70m,
            ImagePath = "/images/no-image.svg"
        };

        db.MenuItems.AddRange(kuru, mantili, icliKofte, sutlac);

        // Ankara Gurme - başkent klasikleri
        var doner = new MenuItem
        {
            CatererId = ankara.Id,
            Name = "Tavuk Döner Porsiyon",
            Description = "Pilav üstü tavuk döner, közlenmiş biber.",
            Price = 170m,
            ImagePath = "/images/no-image.svg"
        };
        doner.OptionGroups.Add(new OptionGroup
        {
            Name = "Sos",
            IsRequired = false,
            MinSelect = 0,
            MaxSelect = 2,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Mayonez", ExtraPrice = 5 },
                new MenuOption { Name = "Ketçap", ExtraPrice = 5 },
                new MenuOption { Name = "Acı Sos", ExtraPrice = 5 }
            }
        });

        var iskender = new MenuItem
        {
            CatererId = ankara.Id,
            Name = "İskender",
            Description = "Pide üzerinde döner, tereyağı, domates sos, yoğurt.",
            Price = 220m,
            ImagePath = "/images/no-image.svg"
        };
        iskender.OptionGroups.Add(new OptionGroup
        {
            Name = "Porsiyon",
            IsRequired = true,
            MinSelect = 1,
            MaxSelect = 1,
            Options = new List<MenuOption>
            {
                new MenuOption { Name = "Yarım", ExtraPrice = 0 },
                new MenuOption { Name = "Tam", ExtraPrice = 60 }
            }
        });

        var beyti = new MenuItem
        {
            CatererId = ankara.Id,
            Name = "Beyti",
            Description = "Sarma kebap, yoğurt ve domates sos.",
            Price = 200m,
            ImagePath = "/images/no-image.svg"
        };
        beyti.RemovableIngredients.Add(new RemovableIngredient { Name = "Sarımsak" });

        db.MenuItems.AddRange(doner, iskender, beyti);

        await db.SaveChangesAsync();
    }
}
