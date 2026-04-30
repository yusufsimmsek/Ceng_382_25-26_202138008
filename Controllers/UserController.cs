using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Models;

namespace Sofranet.Controllers;

[Authorize(Roles = "User")]
public class UserController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<IActionResult> Index()
    {
        var userId = _userManager.GetUserId(User);

        var totalOrders = await _db.Orders.CountAsync(o => o.UserId == userId);
        var spentList = await _db.Orders
            .Where(o => o.UserId == userId && o.Status != "cancelled")
            .Select(o => o.TotalAmount)
            .ToListAsync();
        var totalSpent = spentList.Sum();
        var completedOrders = await _db.Orders
            .CountAsync(o => o.UserId == userId && o.Status == "completed");
        var lastOrder = await _db.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => (DateTime?)o.CreatedAt)
            .FirstOrDefaultAsync();

        // Favori restoran
        var fav = await _db.Orders
            .Where(o => o.UserId == userId)
            .GroupBy(o => o.CatererId)
            .Select(g => new { CatererId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        string? favName = null;
        int favCount = 0;
        if (fav != null)
        {
            favName = await _db.Users
                .Where(u => u.Id == fav.CatererId)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync();
            favCount = fav.Count;
        }

        var recent = await _db.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Caterer)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new DashboardRecentOrder
            {
                Id = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                OtherName = o.Caterer!.FullName
            })
            .ToListAsync();

        ViewBag.TotalOrders = totalOrders;
        ViewBag.TotalSpent = totalSpent;
        ViewBag.CompletedOrders = completedOrders;
        ViewBag.LastOrder = lastOrder;
        ViewBag.FavCatererName = favName;
        ViewBag.FavCatererCount = favCount;
        ViewBag.RecentOrders = recent;

        ViewData["Title"] = "Panelim";
        return View();
    }
}

public class DashboardRecentOrder
{
    public int Id { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string OtherName { get; set; } = "";
}
