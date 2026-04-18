using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Models.ViewModels;

namespace Sofranet.Controllers;

public class MenuController : Controller
{
    private readonly ApplicationDbContext _db;
    private const int PageSize = 12;

    public MenuController(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index(string? caterer, decimal? minPrice, decimal? maxPrice, int page = 1)
    {
        if (page < 1) page = 1;

        var query = _db.MenuItems
            .Include(m => m.Caterer)
            .Where(m => m.IsAvailable);

        if (!string.IsNullOrWhiteSpace(caterer))
            query = query.Where(m => m.CatererId == caterer);

        if (minPrice.HasValue)
            query = query.Where(m => m.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(m => m.Price <= maxPrice.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * PageSize)
            .Take(PageSize)
            .ToListAsync();

        // Caterer dropdown - identity tablolarına join
        var catererRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "Caterer");
        var catererList = new List<dynamic>();
        if (catererRole != null)
        {
            catererList = await (from u in _db.Users
                                 join ur in _db.UserRoles on u.Id equals ur.UserId
                                 where ur.RoleId == catererRole.Id
                                 orderby u.FullName
                                 select new { u.Id, u.FullName }).ToListAsync<dynamic>();
        }

        // Average rating'leri her item için al (N+1 ama küçük dataset için OK)
        var itemList = new List<MenuListItemViewModel>();
        foreach (var item in items)
        {
            var menuRatings = await _db.Ratings
                .Where(r => r.MenuItemId == item.Id && r.Order!.Status == "completed")
                .Select(r => (decimal)r.MenuRating)
                .ToListAsync();
            decimal? menuAvg = menuRatings.Count > 0 ? menuRatings.Average() : null;

            var catererRatings = await _db.Ratings
                .Where(r => r.CatererId == item.CatererId && r.Order!.Status == "completed")
                .Select(r => (decimal)r.CatererRating)
                .ToListAsync();
            decimal? catererAvg = catererRatings.Count > 0 ? catererRatings.Average() : null;

            itemList.Add(new MenuListItemViewModel
            {
                Item = item,
                CatererName = item.Caterer?.FullName ?? "-",
                MenuAvg = menuAvg,
                RatingCount = menuRatings.Count,
                CatererAvg = catererAvg
            });
        }

        ViewBag.Caterers = catererList;
        ViewBag.SelectedCaterer = caterer;
        ViewBag.MinPrice = minPrice;
        ViewBag.MaxPrice = maxPrice;
        ViewBag.CurrentPage = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / (double)PageSize);
        ViewBag.Total = total;

        ViewData["Title"] = "Menüler";
        return View(itemList);
    }

    public async Task<IActionResult> Detail(int id)
    {
        var item = await _db.MenuItems
            .Include(m => m.Caterer)
            .Include(m => m.OptionGroups).ThenInclude(g => g.Options)
            .Include(m => m.RemovableIngredients)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Id == id && m.IsAvailable);

        if (item == null) return NotFound();

        var menuRatings = await _db.Ratings
            .Where(r => r.MenuItemId == id && r.Order!.Status == "completed")
            .Select(r => (decimal)r.MenuRating)
            .ToListAsync();
        decimal? menuAvg = menuRatings.Count > 0 ? menuRatings.Average() : null;

        var catererRatings = await _db.Ratings
            .Where(r => r.CatererId == item.CatererId && r.Order!.Status == "completed")
            .Select(r => (decimal)r.CatererRating)
            .ToListAsync();
        decimal? catererAvg = catererRatings.Count > 0 ? catererRatings.Average() : null;

        var recentComments = await _db.Ratings
            .Include(r => r.User)
            .Where(r => r.MenuItemId == id
                && r.Order!.Status == "completed"
                && r.Comment != null
                && r.Comment != "")
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .Select(r => new RecentCommentViewModel
            {
                UserName = r.User!.FullName,
                MenuRating = r.MenuRating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var vm = new MenuDetailViewModel
        {
            Item = item,
            CatererName = item.Caterer?.FullName ?? "-",
            CatererAddress = item.Caterer?.Address,
            CatererLat = item.Caterer?.Latitude,
            CatererLng = item.Caterer?.Longitude,
            MenuAvg = menuAvg,
            RatingCount = menuRatings.Count,
            CatererAvg = catererAvg,
            Groups = item.OptionGroups.OrderBy(g => g.Id).ToList(),
            Removables = item.RemovableIngredients.OrderBy(r => r.Id).ToList(),
            RecentComments = recentComments
        };

        ViewData["Title"] = item.Name;
        return View(vm);
    }
}
