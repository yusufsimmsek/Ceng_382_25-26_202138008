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

    // === USERS ===
    public async Task<IActionResult> Users(string? q, string? role, int page = 1)
    {
        if (page < 1) page = 1;
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var ql = q.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(ql) || u.Email!.ToLower().Contains(ql));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleEntity = await _db.Roles.FirstOrDefaultAsync(r => r.Name == role);
            if (roleEntity != null)
            {
                var idsInRole = await _db.UserRoles
                    .Where(ur => ur.RoleId == roleEntity.Id)
                    .Select(ur => ur.UserId)
                    .ToListAsync();
                query = query.Where(u => idsInRole.Contains(u.Id));
            }
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * 20).Take(20)
            .Select(u => new AdminUserRow
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email ?? "-",
                PhoneNumber = u.PhoneNumber,
                Address = u.Address,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();
        var rolesByUser = await (from ur in _db.UserRoles
                                 join r in _db.Roles on ur.RoleId equals r.Id
                                 where userIds.Contains(ur.UserId)
                                 select new { ur.UserId, RoleName = r.Name })
                                 .ToListAsync();
        var roleMap = rolesByUser.GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).FirstOrDefault() ?? "-");

        foreach (var u in users)
        {
            u.Role = roleMap.TryGetValue(u.Id, out var r) ? (r ?? "-") : "-";
        }

        ViewBag.Users = users;
        ViewBag.Query = q;
        ViewBag.RoleFilter = role;
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / 20.0);
        ViewBag.Total = total;
        ViewData["Title"] = "Kullanıcılar";
        return View();
    }

    // === CATERERS ===
    public async Task<IActionResult> Caterers(string? q, int page = 1)
    {
        if (page < 1) page = 1;
        var catererRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "Caterer");
        var display = new List<AdminCatererRow>();
        int total = 0;

        if (catererRole != null)
        {
            var catererIds = await _db.UserRoles
                .Where(ur => ur.RoleId == catererRole.Id)
                .Select(ur => ur.UserId).ToListAsync();

            var query = _db.Users.Where(u => catererIds.Contains(u.Id));
            if (!string.IsNullOrWhiteSpace(q))
            {
                var ql = q.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(ql) || u.Email!.ToLower().Contains(ql));
            }

            total = await query.CountAsync();
            var caterers = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * 20).Take(20)
                .ToListAsync();

            foreach (var c in caterers)
            {
                var orderCount = await _db.Orders.CountAsync(o => o.CatererId == c.Id);
                var amounts = await _db.Orders
                    .Where(o => o.CatererId == c.Id && o.Status != "cancelled")
                    .Select(o => o.TotalAmount).ToListAsync();
                var revenue = amounts.Sum();

                var ratings = await _db.Ratings
                    .Where(r => r.CatererId == c.Id && r.Order!.Status == "completed")
                    .Select(r => (decimal)r.CatererRating).ToListAsync();
                decimal? avg = ratings.Count > 0 ? Math.Round(ratings.Average(), 2) : null;

                display.Add(new AdminCatererRow
                {
                    Id = c.Id,
                    FullName = c.FullName,
                    Email = c.Email ?? "-",
                    PhoneNumber = c.PhoneNumber,
                    Address = c.Address,
                    OrderCount = orderCount,
                    Revenue = revenue,
                    AvgRating = avg,
                    RatingCount = ratings.Count
                });
            }
        }

        ViewBag.Caterers = display;
        ViewBag.Query = q;
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / 20.0);
        ViewBag.Total = total;
        ViewData["Title"] = "Restoranlar";
        return View();
    }

    // === ORDERS ===
    public async Task<IActionResult> Orders(string? status, DateTime? dateFrom, DateTime? dateTo,
        string? q, int page = 1)
    {
        if (page < 1) page = 1;
        var query = _db.Orders
            .Include(o => o.User)
            .Include(o => o.Caterer)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(o => o.Status == status);

        if (dateFrom.HasValue)
            query = query.Where(o => o.CreatedAt >= dateFrom.Value);

        if (dateTo.HasValue)
        {
            var to = dateTo.Value.Date.AddDays(1);
            query = query.Where(o => o.CreatedAt < to);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var ql = q.ToLower();
            query = query.Where(o =>
                o.User!.FullName.ToLower().Contains(ql) ||
                o.User!.Email!.ToLower().Contains(ql) ||
                o.Caterer!.FullName.ToLower().Contains(ql) ||
                o.Caterer!.Email!.ToLower().Contains(ql));
        }

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * 20).Take(20)
            .Select(o => new AdminOrderRow
            {
                Id = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                UserName = o.User!.FullName,
                UserEmail = o.User!.Email ?? "-",
                CatererName = o.Caterer!.FullName
            })
            .ToListAsync();

        ViewBag.Orders = orders;
        ViewBag.Status = status;
        ViewBag.DateFrom = dateFrom?.ToString("yyyy-MM-dd");
        ViewBag.DateTo = dateTo?.ToString("yyyy-MM-dd");
        ViewBag.Query = q;
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / 20.0);
        ViewBag.Total = total;
        ViewData["Title"] = "Tüm Siparişler";
        return View();
    }

    // === LOGS ===
    // "action" parametre ismi MVC route'unda reserved (action method adı route value'sundan alınır).
    // Bu nedenle "actionType" kullanıyoruz, view'da da name="actionType".
    public async Task<IActionResult> Logs(string? actionType, string? q, string? ip,
        DateTime? dateFrom, DateTime? dateTo, int page = 1)
    {
        if (page < 1) page = 1;
        var query = _db.LogEntries.AsQueryable();

        if (!string.IsNullOrEmpty(actionType))
            query = query.Where(l => l.Action == actionType);

        if (!string.IsNullOrEmpty(ip))
            query = query.Where(l => l.IpAddress != null && l.IpAddress.Contains(ip));

        if (dateFrom.HasValue)
            query = query.Where(l => l.CreatedAt >= dateFrom.Value);

        if (dateTo.HasValue)
        {
            var to = dateTo.Value.Date.AddDays(1);
            query = query.Where(l => l.CreatedAt < to);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var ql = q.ToLower();
            var matchingUserIds = await _db.Users
                .Where(u => u.FullName.ToLower().Contains(ql) || u.Email!.ToLower().Contains(ql))
                .Select(u => u.Id).ToListAsync();
            query = query.Where(l => l.UserId != null && matchingUserIds.Contains(l.UserId));
        }

        var total = await query.CountAsync();
        var rawLogs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * 50).Take(50)
            .ToListAsync();
        var logs = rawLogs.Select(l => new AdminLogRow
        {
            Id = l.Id,
            Action = l.Action,
            Details = l.Details ?? string.Empty,
            IpAddress = l.IpAddress ?? string.Empty,
            CreatedAt = l.CreatedAt,
            UserId = l.UserId
        }).ToList();

        var logUserIds = logs.Where(l => !string.IsNullOrEmpty(l.UserId))
            .Select(l => l.UserId!).Distinct().ToList();
        var userInfoMap = await _db.Users
            .Where(u => logUserIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email, u.FullName })
            .ToListAsync();
        var userDict = userInfoMap.ToDictionary(u => u.Id, u => new { u.Email, u.FullName });

        foreach (var l in logs)
        {
            if (l.UserId != null && userDict.TryGetValue(l.UserId, out var info))
            {
                l.UserEmail = info.Email;
                l.UserName = info.FullName;
            }
        }

        var actions = await _db.LogEntries
            .Select(l => l.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();

        ViewBag.Logs = logs;
        ViewBag.Actions = actions;
        ViewBag.ActionFilter = actionType;
        ViewBag.Query = q;
        ViewBag.IpFilter = ip;
        ViewBag.DateFrom = dateFrom?.ToString("yyyy-MM-dd");
        ViewBag.DateTo = dateTo?.ToString("yyyy-MM-dd");
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / 50.0);
        ViewBag.Total = total;
        ViewData["Title"] = "Sistem Logları";
        return View();
    }
}

public class AdminUserRow
{
    public string Id { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Role { get; set; } = "-";
}

public class AdminCatererRow
{
    public string Id { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal? AvgRating { get; set; }
    public int RatingCount { get; set; }
}

public class AdminOrderRow
{
    public int Id { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = "";
    public string UserEmail { get; set; } = "";
    public string CatererName { get; set; } = "";
}

public class AdminLogRow
{
    public long Id { get; set; }
    public string Action { get; set; } = "";
    public string Details { get; set; } = "";
    public string IpAddress { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserName { get; set; }
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
