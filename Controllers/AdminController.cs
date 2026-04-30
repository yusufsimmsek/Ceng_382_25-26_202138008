using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;

namespace Sofranet.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController : Controller
{
    private readonly ApplicationDbContext _db;

    public AdminController(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index()
    {
        var userRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        var catererRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "Caterer");

        var totalUsers = userRole == null
            ? 0
            : await _db.UserRoles.CountAsync(ur => ur.RoleId == userRole.Id);
        var totalCaterers = catererRole == null
            ? 0
            : await _db.UserRoles.CountAsync(ur => ur.RoleId == catererRole.Id);

        var totalOrders = await _db.Orders.CountAsync();
        var today = DateTime.UtcNow.Date;
        var todayOrders = await _db.Orders.CountAsync(o => o.CreatedAt >= today);
        var volumeList = await _db.Orders
            .Where(o => o.Status != "cancelled")
            .Select(o => o.TotalAmount)
            .ToListAsync();
        var totalVolume = volumeList.Sum();
        var activeMenu = await _db.MenuItems.CountAsync(m => m.IsAvailable);
        var totalRatings = await _db.Ratings.CountAsync();

        // SQLite decimal Sum desteklemiyor, GroupBy sonrası amounts'u listeleyip in-memory aggregate
        var orderAmounts = await _db.Orders
            .Select(o => new { o.CatererId, o.TotalAmount })
            .ToListAsync();

        var topCaterersRaw = orderAmounts
            .GroupBy(x => x.CatererId)
            .Select(g => new
            {
                CatererId = g.Key,
                OrderCount = g.Count(),
                Revenue = g.Sum(x => x.TotalAmount)
            })
            .OrderByDescending(x => x.OrderCount)
            .Take(5)
            .ToList();

        var catererIds = topCaterersRaw.Select(x => x.CatererId).ToList();
        var catererNames = await _db.Users
            .Where(u => catererIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var topCaterers = topCaterersRaw.Select(x => new TopCatererRow
        {
            CatererId = x.CatererId,
            Name = catererNames.TryGetValue(x.CatererId, out var n) ? n : "-",
            OrderCount = x.OrderCount,
            Revenue = x.Revenue
        }).ToList();

        var recentOrders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Caterer)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new AdminRecentOrder
            {
                Id = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                UserName = o.User!.FullName,
                CatererName = o.Caterer!.FullName
            })
            .ToListAsync();

        ViewBag.TotalUsers = totalUsers;
        ViewBag.TotalCaterers = totalCaterers;
        ViewBag.TotalOrders = totalOrders;
        ViewBag.TodayOrders = todayOrders;
        ViewBag.TotalVolume = totalVolume;
        ViewBag.ActiveMenu = activeMenu;
        ViewBag.TotalRatings = totalRatings;
        ViewBag.TopCaterers = topCaterers;
        ViewBag.RecentOrders = recentOrders;

        ViewData["Title"] = "Yönetici Paneli";
        return View();
    }
}

public class TopCatererRow
{
    public string CatererId { get; set; } = "";
    public string Name { get; set; } = "-";
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public class AdminRecentOrder
{
    public int Id { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = "";
    public string CatererName { get; set; } = "";
}
