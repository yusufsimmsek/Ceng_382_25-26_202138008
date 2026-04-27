using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Helpers;
using Sofranet.Models;
using Sofranet.Services;

namespace Sofranet.Controllers;

[Authorize]
public class OrderController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _email;
    private readonly IPdfService _pdf;
    private readonly ILogService _logs;

    private const string CART_KEY = "cart";
    private const string PAYMENT_KEY = "payment_approved";
    private const string DELIVERY_KEY = "delivery_info";
    private const string PENDING_KEY = "cart_pending";

    public OrderController(ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IEmailService email,
        IPdfService pdf,
        ILogService logs)
    {
        _db = db;
        _userManager = userManager;
        _email = email;
        _pdf = pdf;
        _logs = logs;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> Create()
    {
        if (HttpContext.Session.GetString(PAYMENT_KEY) != "true")
        {
            TempData["ErrorMessage"] = "Önce ödeme onayı gerekli";
            return RedirectToAction("Index", "Cart");
        }

        var cart = HttpContext.Session.GetObject<List<CartItem>>(CART_KEY);
        if (cart == null || cart.Count == 0)
        {
            TempData["ErrorMessage"] = "Sepet boş";
            return RedirectToAction("Index", "Menu");
        }

        var delivery = HttpContext.Session.GetObject<DeliveryInfo>(DELIVERY_KEY);
        if (delivery == null)
        {
            TempData["ErrorMessage"] = "Teslimat bilgisi eksik";
            return RedirectToAction("Index", "Cart");
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return RedirectToAction("Login", "Account");

        // Enrich - fiyat hesabı
        var menuIds = cart.Select(c => c.MenuItemId).Distinct().ToList();
        var optIds = cart.SelectMany(c => c.OptionIds).Distinct().ToList();

        var menuMap = await _db.MenuItems
            .Where(m => menuIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id);
        var optMap = await _db.MenuOptions
            .Where(o => optIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id);

        decimal total = 0;
        foreach (var c in cart)
        {
            if (!menuMap.TryGetValue(c.MenuItemId, out var mi)) continue;
            decimal extras = c.OptionIds.Sum(oid => optMap.TryGetValue(oid, out var o) ? o.ExtraPrice : 0);
            total += (mi.Price + extras) * c.Quantity;
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        int orderId;
        try
        {
            var order = new Order
            {
                UserId = user.Id,
                CatererId = cart[0].CatererId,
                TotalAmount = total,
                Status = "pending",
                PaymentStatus = "paid",
                DeliveryAddress = delivery.Address,
                DeliveryLat = delivery.Lat,
                DeliveryLng = delivery.Lng,
                CreatedAt = DateTime.UtcNow
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            foreach (var c in cart)
            {
                if (!menuMap.TryGetValue(c.MenuItemId, out var mi)) continue;
                decimal extras = c.OptionIds.Sum(oid => optMap.TryGetValue(oid, out var o) ? o.ExtraPrice : 0);

                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    MenuItemId = c.MenuItemId,
                    Quantity = c.Quantity,
                    ItemPrice = mi.Price,
                    CustomizationExtra = extras
                };
                _db.OrderItems.Add(orderItem);
                await _db.SaveChangesAsync();

                foreach (var oid in c.OptionIds)
                {
                    _db.OrderItemOptions.Add(new OrderItemOption
                    {
                        OrderItemId = orderItem.Id,
                        OptionId = oid
                    });
                }
                foreach (var rid in c.RemovalIds)
                {
                    _db.OrderItemRemovals.Add(new OrderItemRemoval
                    {
                        OrderItemId = orderItem.Id,
                        RemovableIngredientId = rid
                    });
                }
            }
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            orderId = order.Id;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            await _logs.LogAsync(HttpContext, "ERROR", $"order_create_failed err={ex.Message}", user.Id);
            TempData["ErrorMessage"] = "Sipariş oluşturulurken hata oluştu";
            return RedirectToAction("Index", "Cart");
        }

        // Sepeti temizle
        HttpContext.Session.Remove(CART_KEY);
        HttpContext.Session.Remove(PAYMENT_KEY);
        HttpContext.Session.Remove(DELIVERY_KEY);
        HttpContext.Session.Remove(PENDING_KEY);

        await _logs.LogAsync(HttpContext, "ORDER_CREATED",
            $"order_id={orderId} total={total}", user.Id);

        // Email - hata olursa akış kırılmasın
        try
        {
            var info = await OrderHelper.FetchOrderFullAsync(_db, orderId);
            if (info != null)
            {
                var userMail = await _email.SendOrderConfirmationToUserAsync(info);
                var catererMail = await _email.SendOrderNotificationToCatererAsync(info);
                if (userMail || catererMail)
                {
                    await _logs.LogAsync(HttpContext, "EMAIL_SENT",
                        $"order_id={orderId} user_ok={userMail} caterer_ok={catererMail}", user.Id);
                }
                else
                {
                    await _logs.LogAsync(HttpContext, "EMAIL_FAILED",
                        $"order_id={orderId} smtp_not_configured", user.Id);
                }
            }
        }
        catch (Exception ex)
        {
            await _logs.LogAsync(HttpContext, "EMAIL_FAILED",
                $"order_id={orderId} err={ex.Message}", user.Id);
        }

        TempData["SuccessMessage"] = "Siparişin oluşturuldu!";
        return RedirectToAction(nameof(Success), new { id = orderId });
    }

    [Authorize(Roles = "User")]
    public async Task<IActionResult> Success(int id)
    {
        var info = await OrderHelper.FetchOrderFullAsync(_db, id);
        if (info == null) return NotFound();

        var userId = _userManager.GetUserId(User);
        if (info.Order.UserId != userId)
        {
            TempData["ErrorMessage"] = "Bu sipariş sana ait değil";
            return RedirectToAction(nameof(MyOrders));
        }
        ViewData["Title"] = $"Sipariş #{info.Order.Id}";
        return View(info);
    }

    [Authorize(Roles = "User")]
    public async Task<IActionResult> MyOrders(string? status, int page = 1)
    {
        if (page < 1) page = 1;
        var userId = _userManager.GetUserId(User);
        var query = _db.Orders.Where(o => o.UserId == userId);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(o => o.Status == status);

        var total = await query.CountAsync();
        var orders = await query
            .Include(o => o.Caterer)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * 15).Take(15)
            .Select(o => new OrderListItem
            {
                Id = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                CompletedAt = o.CompletedAt,
                CatererName = o.Caterer!.FullName,
                ItemCount = _db.OrderItems.Count(i => i.OrderId == o.Id),
                HasRating = _db.Ratings.Any(r => r.OrderId == o.Id)
            })
            .ToListAsync();

        ViewBag.Status = status;
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / 15.0);
        ViewBag.Total = total;
        ViewData["Title"] = "Siparişlerim";
        return View(orders);
    }

    // === PDF ===
    public async Task<IActionResult> Receipt(int id)
    {
        var info = await OrderHelper.FetchOrderFullAsync(_db, id);
        if (info == null) return NotFound();
        if (!await CanAccessOrder(info)) return Forbid();

        var bytes = _pdf.GenerateReceipt(info);
        return File(bytes, "application/pdf", $"sofranet-makbuz-{id}.pdf");
    }

    public async Task<IActionResult> Agreement(int id)
    {
        var info = await OrderHelper.FetchOrderFullAsync(_db, id);
        if (info == null) return NotFound();
        if (!await CanAccessOrder(info)) return Forbid();

        var bytes = _pdf.GenerateAgreement(info);
        return File(bytes, "application/pdf", $"sofranet-sozlesme-{id}.pdf");
    }

    private Task<bool> CanAccessOrder(FullOrderInfo info)
    {
        var userId = _userManager.GetUserId(User);
        if (User.IsInRole("Admin")) return Task.FromResult(true);
        if (User.IsInRole("User")) return Task.FromResult(info.Order.UserId == userId);
        if (User.IsInRole("Caterer")) return Task.FromResult(info.Order.CatererId == userId);
        return Task.FromResult(false);
    }
}

public class OrderListItem
{
    public int Id { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string CatererName { get; set; } = "";
    public int ItemCount { get; set; }
    public bool HasRating { get; set; }
}
