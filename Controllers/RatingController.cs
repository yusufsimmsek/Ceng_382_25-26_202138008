using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Models;
using Sofranet.Models.ViewModels;
using Sofranet.Services;

namespace Sofranet.Controllers;

[Authorize(Roles = "User")]
public class RatingController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogService _logs;

    public RatingController(ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ILogService logs)
    {
        _db = db;
        _userManager = userManager;
        _logs = logs;
    }

    [HttpGet]
    public async Task<IActionResult> Rate(int id)
    {
        var userId = _userManager.GetUserId(User);
        var order = await _db.Orders
            .Include(o => o.Caterer)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            TempData["ErrorMessage"] = "Sipariş bulunamadı";
            return RedirectToAction("MyOrders", "Order");
        }
        if (order.UserId != userId)
        {
            TempData["ErrorMessage"] = "Bu sipariş sana ait değil";
            return RedirectToAction("MyOrders", "Order");
        }
        if (order.Status != "completed")
        {
            TempData["ErrorMessage"] = "Sadece tamamlanmış siparişler değerlendirilebilir";
            return RedirectToAction("MyOrders", "Order");
        }

        var existing = await _db.Ratings.AnyAsync(r => r.OrderId == id);
        if (existing)
        {
            TempData["ErrorMessage"] = "Bu sipariş zaten değerlendirilmiş";
            return RedirectToAction("MyOrders", "Order");
        }

        var vm = new RateOrderViewModel
        {
            OrderId = order.Id,
            CatererName = order.Caterer?.FullName ?? "-",
            OrderDate = order.CreatedAt,
            ItemNames = order.Items.Select(i => i.MenuItem?.Name ?? "?").ToList()
        };
        ViewData["Title"] = "Siparişini Değerlendir";
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Rate(RateOrderViewModel vm)
    {
        var userId = _userManager.GetUserId(User);
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == vm.OrderId);

        if (order == null || order.UserId != userId || order.Status != "completed")
        {
            TempData["ErrorMessage"] = "Geçersiz sipariş";
            return RedirectToAction("MyOrders", "Order");
        }
        if (await _db.Ratings.AnyAsync(r => r.OrderId == vm.OrderId))
        {
            TempData["ErrorMessage"] = "Bu sipariş zaten değerlendirilmiş";
            return RedirectToAction("MyOrders", "Order");
        }

        if (!ModelState.IsValid)
        {
            var details = await _db.Orders
                .Include(o => o.Caterer)
                .Include(o => o.Items).ThenInclude(i => i.MenuItem)
                .FirstOrDefaultAsync(o => o.Id == vm.OrderId);
            if (details != null)
            {
                vm.CatererName = details.Caterer?.FullName ?? "-";
                vm.OrderDate = details.CreatedAt;
                vm.ItemNames = details.Items.Select(i => i.MenuItem?.Name ?? "?").ToList();
            }
            return View(vm);
        }

        var firstMenuItemId = order.Items.Select(i => (int?)i.MenuItemId).FirstOrDefault();

        _db.Ratings.Add(new Rating
        {
            OrderId = vm.OrderId,
            UserId = userId!,
            MenuItemId = firstMenuItemId,
            CatererId = order.CatererId,
            MenuRating = vm.MenuRating,
            CatererRating = vm.CatererRating,
            Comment = string.IsNullOrWhiteSpace(vm.Comment) ? null : vm.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        await _logs.LogAsync(HttpContext, "RATING_SUBMITTED",
            $"order_id={vm.OrderId} menu={vm.MenuRating} caterer={vm.CatererRating}", userId);

        TempData["SuccessMessage"] = "Değerlendirmen için teşekkürler!";
        return RedirectToAction("MyOrders", "Order");
    }
}
