using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Helpers;
using Sofranet.Models;
using Sofranet.Models.ViewModels;
using Sofranet.Services;

namespace Sofranet.Controllers;

[Authorize(Roles = "User")]
public class CartController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogService _logs;
    private readonly ILocationService _location;

    private const string CART_KEY = "cart";
    private const string PENDING_KEY = "cart_pending";
    private const string PAYMENT_KEY = "payment_approved";
    private const string DELIVERY_KEY = "delivery_info";

    public CartController(ApplicationDbContext db, UserManager<ApplicationUser> userManager,
        ILogService logs, ILocationService location)
    {
        _db = db;
        _userManager = userManager;
        _logs = logs;
        _location = location;
    }

    private List<CartItem> GetCart() =>
        HttpContext.Session.GetObject<List<CartItem>>(CART_KEY) ?? new List<CartItem>();

    private void SaveCart(List<CartItem> cart) =>
        HttpContext.Session.SetObject(CART_KEY, cart);

    // === ADD ===
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(int menuItemId, int quantity, int[]? options, int[]? removals)
    {
        // Detail formundaki "options_<groupId>" radio'ları için Request.Form'dan parse et
        var allOptionIds = new List<int>(options ?? Array.Empty<int>());
        foreach (var key in Request.Form.Keys.Where(k => k.StartsWith("options_")))
        {
            if (int.TryParse(Request.Form[key], out var oid)) allOptionIds.Add(oid);
        }
        var removalList = (removals ?? Array.Empty<int>()).ToList();

        if (quantity < 1 || quantity > 20)
        {
            TempData["ErrorMessage"] = "Adet 1-20 arası olmalı";
            return RedirectToAction("Detail", "Menu", new { id = menuItemId });
        }

        var item = await _db.MenuItems
            .Include(m => m.OptionGroups).ThenInclude(g => g.Options)
            .Include(m => m.RemovableIngredients)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == menuItemId && m.IsAvailable);

        if (item == null)
        {
            TempData["ErrorMessage"] = "Menü bulunamadı";
            return RedirectToAction("Index", "Menu");
        }

        var validOptionIds = item.OptionGroups.SelectMany(g => g.Options.Select(o => o.Id)).ToList();
        if (allOptionIds.Any(id => !validOptionIds.Contains(id)))
        {
            TempData["ErrorMessage"] = "Geçersiz seçenek";
            return RedirectToAction("Detail", "Menu", new { id = menuItemId });
        }

        // Group min/max validation
        foreach (var group in item.OptionGroups)
        {
            var selectedInGroup = group.Options.Count(o => allOptionIds.Contains(o.Id));
            if (group.IsRequired && selectedInGroup < group.MinSelect)
            {
                TempData["ErrorMessage"] = $"{group.Name} için en az {group.MinSelect} seçim yap";
                return RedirectToAction("Detail", "Menu", new { id = menuItemId });
            }
            if (selectedInGroup > group.MaxSelect)
            {
                TempData["ErrorMessage"] = $"{group.Name} için en fazla {group.MaxSelect} seçim yapabilirsin";
                return RedirectToAction("Detail", "Menu", new { id = menuItemId });
            }
        }

        var validRemovalIds = item.RemovableIngredients.Select(r => r.Id).ToList();
        if (removalList.Any(id => !validRemovalIds.Contains(id)))
        {
            TempData["ErrorMessage"] = "Geçersiz malzeme";
            return RedirectToAction("Detail", "Menu", new { id = menuItemId });
        }

        var cart = GetCart();

        // Farklı caterer kontrolü
        if (cart.Any() && cart[0].CatererId != item.CatererId)
        {
            HttpContext.Session.SetObject(PENDING_KEY, new PendingCartItem
            {
                MenuItemId = menuItemId,
                CatererId = item.CatererId,
                Quantity = quantity,
                OptionIds = allOptionIds,
                RemovalIds = removalList
            });
            TempData["WarningMessage"] = "Sepetinde farklı bir restoranın ürünleri var. Lütfen seçim yap.";
            return RedirectToAction(nameof(Index));
        }

        cart.Add(new CartItem
        {
            MenuItemId = menuItemId,
            CatererId = item.CatererId,
            Quantity = quantity,
            OptionIds = allOptionIds,
            RemovalIds = removalList
        });
        SaveCart(cart);
        // Yeni ürün eklenince payment onayını sıfırla
        HttpContext.Session.Remove(PAYMENT_KEY);
        HttpContext.Session.Remove(DELIVERY_KEY);

        TempData["SuccessMessage"] = "Ürün sepete eklendi";
        return RedirectToAction(nameof(Index));
    }

    // === INDEX ===
    public async Task<IActionResult> Index()
    {
        var cart = GetCart();
        var pending = HttpContext.Session.GetObject<PendingCartItem>(PENDING_KEY);
        var vm = new CartViewModel();

        if (pending != null)
        {
            vm.PendingItem = pending;
            vm.PendingItemName = await _db.MenuItems
                .Where(m => m.Id == pending.MenuItemId)
                .Select(m => m.Name)
                .FirstOrDefaultAsync();
        }

        if (cart.Count == 0)
        {
            ViewData["Title"] = "Sepetim";
            return View(vm);
        }

        var enriched = await EnrichCartAsync(cart);
        vm.Items = enriched;
        vm.Total = enriched.Sum(e => e.Subtotal);
        vm.CatererId = cart[0].CatererId;
        vm.CatererName = await _db.Users
            .Where(u => u.Id == cart[0].CatererId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync();

        ViewData["Title"] = "Sepetim";
        return View(vm);
    }

    private async Task<List<EnrichedCartItem>> EnrichCartAsync(List<CartItem> cart)
    {
        var menuIds = cart.Select(c => c.MenuItemId).Distinct().ToList();
        var optIds = cart.SelectMany(c => c.OptionIds).Distinct().ToList();
        var remIds = cart.SelectMany(c => c.RemovalIds).Distinct().ToList();

        var menuMap = await _db.MenuItems
            .Where(m => menuIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id);

        var optMap = await _db.MenuOptions
            .Include(o => o.Group)
            .Where(o => optIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id);

        var remMap = await _db.RemovableIngredients
            .Where(r => remIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id);

        var result = new List<EnrichedCartItem>();
        for (int i = 0; i < cart.Count; i++)
        {
            var c = cart[i];
            if (!menuMap.TryGetValue(c.MenuItemId, out var mi)) continue;

            decimal extras = 0;
            var opts = new List<EnrichedOptionInfo>();
            foreach (var oid in c.OptionIds)
            {
                if (optMap.TryGetValue(oid, out var opt))
                {
                    extras += opt.ExtraPrice;
                    opts.Add(new EnrichedOptionInfo
                    {
                        GroupName = opt.Group?.Name ?? "",
                        OptionName = opt.Name,
                        ExtraPrice = opt.ExtraPrice
                    });
                }
            }

            var removals = c.RemovalIds
                .Select(id => remMap.TryGetValue(id, out var r) ? r.Name : null)
                .Where(x => x != null)
                .Select(x => x!)
                .ToList();

            result.Add(new EnrichedCartItem
            {
                Index = i,
                MenuItemId = c.MenuItemId,
                Name = mi.Name,
                ImagePath = mi.ImagePath,
                BasePrice = mi.Price,
                Quantity = c.Quantity,
                Extras = extras,
                Options = opts,
                Removals = removals
            });
        }
        return result;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Update(int index, int quantity)
    {
        if (quantity < 1 || quantity > 20)
        {
            TempData["ErrorMessage"] = "Adet 1-20 arası olmalı";
            return RedirectToAction(nameof(Index));
        }
        var cart = GetCart();
        if (index >= 0 && index < cart.Count)
        {
            cart[index].Quantity = quantity;
            SaveCart(cart);
            HttpContext.Session.Remove(PAYMENT_KEY);
            HttpContext.Session.Remove(DELIVERY_KEY);
            TempData["SuccessMessage"] = "Adet güncellendi";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Remove(int index)
    {
        var cart = GetCart();
        if (index >= 0 && index < cart.Count)
        {
            cart.RemoveAt(index);
            SaveCart(cart);
            HttpContext.Session.Remove(PAYMENT_KEY);
            HttpContext.Session.Remove(DELIVERY_KEY);
            TempData["SuccessMessage"] = "Ürün sepetten çıkarıldı";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Clear()
    {
        HttpContext.Session.Remove(CART_KEY);
        HttpContext.Session.Remove(PENDING_KEY);
        HttpContext.Session.Remove(PAYMENT_KEY);
        HttpContext.Session.Remove(DELIVERY_KEY);
        TempData["SuccessMessage"] = "Sepet temizlendi";
        return RedirectToAction("Index", "Menu");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult ConfirmReplace()
    {
        var pending = HttpContext.Session.GetObject<PendingCartItem>(PENDING_KEY);
        if (pending == null) return RedirectToAction(nameof(Index));

        var newCart = new List<CartItem>
        {
            new CartItem
            {
                MenuItemId = pending.MenuItemId,
                CatererId = pending.CatererId,
                Quantity = pending.Quantity,
                OptionIds = pending.OptionIds,
                RemovalIds = pending.RemovalIds
            }
        };
        SaveCart(newCart);
        HttpContext.Session.Remove(PENDING_KEY);
        HttpContext.Session.Remove(PAYMENT_KEY);
        HttpContext.Session.Remove(DELIVERY_KEY);
        TempData["SuccessMessage"] = "Sepet yenilendi";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CancelPending()
    {
        HttpContext.Session.Remove(PENDING_KEY);
        TempData["InfoMessage"] = "Yeni ürün eklenmedi";
        return RedirectToAction(nameof(Index));
    }

    // === CHECKOUT ===
    [HttpGet]
    public async Task<IActionResult> Checkout()
    {
        var cart = GetCart();
        if (cart.Count == 0)
        {
            TempData["ErrorMessage"] = "Sepetin boş";
            return RedirectToAction("Index", "Menu");
        }

        bool paymentApproved = HttpContext.Session.GetString(PAYMENT_KEY) == "true";

        var enriched = await EnrichCartAsync(cart);
        var total = enriched.Sum(e => e.Subtotal);
        var catererName = await _db.Users
            .Where(u => u.Id == cart[0].CatererId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync() ?? "";
        var user = await _userManager.GetUserAsync(User);

        if (paymentApproved)
        {
            ViewBag.DeliveryInfo = HttpContext.Session.GetObject<DeliveryInfo>(DELIVERY_KEY);
            ViewBag.Items = enriched;
            ViewBag.Total = total;
            ViewBag.CatererName = catererName;
            ViewData["Title"] = "Ödeme Onaylandı";
            return View("CheckoutApproved");
        }

        var vm = new CheckoutViewModel
        {
            Items = enriched,
            Total = total,
            CatererName = catererName,
            UserAddress = user?.Address,
            UserLat = user?.Latitude,
            UserLng = user?.Longitude
        };
        ViewData["Title"] = "Ödeme";
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Checkout(CheckoutViewModel vm)
    {
        var cart = GetCart();
        if (cart.Count == 0)
        {
            TempData["ErrorMessage"] = "Sepetin boş";
            return RedirectToAction("Index", "Menu");
        }

        var enriched = await EnrichCartAsync(cart);
        vm.Items = enriched;
        vm.Total = enriched.Sum(e => e.Subtotal);
        vm.CatererName = await _db.Users
            .Where(u => u.Id == cart[0].CatererId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync() ?? "";

        var user = await _userManager.GetUserAsync(User);
        vm.UserAddress = user?.Address;
        vm.UserLat = user?.Latitude;
        vm.UserLng = user?.Longitude;

        if (!ModelState.IsValid)
        {
            ViewData["Title"] = "Ödeme";
            return View(vm);
        }

        var digits = new string(vm.CardNumber.Where(char.IsDigit).ToArray());
        if (digits.Length < 13 || digits.Length > 19)
        {
            ModelState.AddModelError(nameof(vm.CardNumber), "Geçersiz kart numarası");
            ViewData["Title"] = "Ödeme";
            return View(vm);
        }

        // Teslimat adresi
        string deliveryAddress;
        double? deliveryLat, deliveryLng;
        if (vm.UseProfileAddress)
        {
            if (string.IsNullOrWhiteSpace(user?.Address))
            {
                ModelState.AddModelError(string.Empty, "Profil adresin yok. Manuel adres gir.");
                ViewData["Title"] = "Ödeme";
                return View(vm);
            }
            deliveryAddress = user.Address;
            deliveryLat = user.Latitude;
            deliveryLng = user.Longitude;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(vm.ManualAddress))
            {
                ModelState.AddModelError(nameof(vm.ManualAddress), "Adres zorunlu");
                ViewData["Title"] = "Ödeme";
                return View(vm);
            }
            deliveryAddress = vm.ManualAddress;
            var coords = await _location.GeocodeAddressAsync(vm.ManualAddress);
            deliveryLat = coords?.Lat;
            deliveryLng = coords?.Lng;
        }

        // Payment simulation
        bool paymentOk;
        if (digits == "4242424242424242") paymentOk = true;
        else if (digits.EndsWith("0000")) paymentOk = false;
        else paymentOk = true;

        if (!paymentOk)
        {
            await _logs.LogAsync(HttpContext, "PAYMENT_FAILED",
                $"simulation=declined card_ending={digits[^4..]}");
            TempData["ErrorMessage"] = "Kart bilgileri reddedildi. Lütfen tekrar dene.";
            ViewData["Title"] = "Ödeme";
            return View(vm);
        }

        await _logs.LogAsync(HttpContext, "PAYMENT_PROCESSED",
            $"simulation=ok amount={vm.Total} items={enriched.Count}");

        HttpContext.Session.SetString(PAYMENT_KEY, "true");
        HttpContext.Session.SetObject(DELIVERY_KEY, new DeliveryInfo
        {
            Address = deliveryAddress,
            Lat = deliveryLat,
            Lng = deliveryLng
        });

        TempData["SuccessMessage"] = "Ödeme onaylandı (simülasyon)";
        return RedirectToAction(nameof(Checkout));
    }
}
