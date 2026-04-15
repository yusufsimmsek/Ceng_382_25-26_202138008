using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Helpers;
using Sofranet.Models;
using Sofranet.Services;

namespace Sofranet.Controllers;

[Authorize(Roles = "Caterer")]
public class CatererController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWebHostEnvironment _env;
    private readonly ILogService _logs;

    private const int PageSize = 15;

    public CatererController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env,
        ILogService logs)
    {
        _db = db;
        _userManager = userManager;
        _env = env;
        _logs = logs;
    }

    public IActionResult Index()
    {
        ViewData["Title"] = "Restoran Panel";
        return View();
    }

    // === MENU LIST ===
    public async Task<IActionResult> Menu(string? q, int page = 1)
    {
        if (page < 1) page = 1;
        var userId = _userManager.GetUserId(User);
        var query = _db.MenuItems.Where(m => m.CatererId == userId);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var qLower = q.Trim().ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(qLower));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * PageSize)
            .Take(PageSize)
            .ToListAsync();

        ViewBag.Query = q;
        ViewBag.Page = page;
        ViewBag.TotalPages = (int)Math.Ceiling(total / (double)PageSize);
        ViewBag.Total = total;

        ViewData["Title"] = "Menü Yönetimi";
        return View(items);
    }

    // === MENU CREATE ===
    [HttpGet]
    public IActionResult MenuCreate()
    {
        ViewData["Title"] = "Yeni Menü";
        return View(new MenuItem());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MenuCreate(MenuItem model, IFormFile? image)
    {
        ViewData["Title"] = "Yeni Menü";

        if (string.IsNullOrWhiteSpace(model.Name))
            ModelState.AddModelError(nameof(model.Name), "İsim zorunlu");
        if (model.Price < 0)
            ModelState.AddModelError(nameof(model.Price), "Fiyat negatif olamaz");
        if (image == null || image.Length == 0)
            ModelState.AddModelError("image", "Görsel zorunlu");

        if (!ModelState.IsValid) return View(model);

        var (ok, path, err) = await FileUploadHelper.SaveImageAsync(image!, _env);
        if (!ok)
        {
            ModelState.AddModelError("image", err ?? "Yükleme hatası");
            return View(model);
        }

        var userId = _userManager.GetUserId(User)!;
        var item = new MenuItem
        {
            CatererId = userId,
            Name = model.Name.Trim(),
            Price = model.Price,
            Description = model.Description,
            ImagePath = path,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();
        await _logs.LogAsync(HttpContext, "MENU_CREATED",
            $"item_id={item.Id} name={item.Name}", userId);

        TempData["SuccessMessage"] = "Menü eklendi";
        return RedirectToAction(nameof(Menu));
    }

    // === MENU EDIT ===
    [HttpGet]
    public async Task<IActionResult> MenuEdit(int id)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .FirstOrDefaultAsync(m => m.Id == id && m.CatererId == userId);
        if (item == null)
        {
            TempData["ErrorMessage"] = "Menü bulunamadı";
            return RedirectToAction(nameof(Menu));
        }
        ViewData["Title"] = "Menü Düzenle";
        return View(item);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MenuEdit(int id, MenuItem model, IFormFile? image)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .FirstOrDefaultAsync(m => m.Id == id && m.CatererId == userId);
        if (item == null)
        {
            TempData["ErrorMessage"] = "Menü bulunamadı";
            return RedirectToAction(nameof(Menu));
        }

        ViewData["Title"] = "Menü Düzenle";

        if (string.IsNullOrWhiteSpace(model.Name))
            ModelState.AddModelError(nameof(model.Name), "İsim zorunlu");
        if (model.Price < 0)
            ModelState.AddModelError(nameof(model.Price), "Fiyat negatif olamaz");

        if (!ModelState.IsValid)
        {
            // mevcut görseli koruyalım ki view'da görünsün
            model.ImagePath = item.ImagePath;
            model.Id = id;
            return View(model);
        }

        item.Name = model.Name.Trim();
        item.Price = model.Price;
        item.Description = model.Description;
        item.IsAvailable = model.IsAvailable;
        item.UpdatedAt = DateTime.UtcNow;

        if (image != null && image.Length > 0)
        {
            var (ok, path, err) = await FileUploadHelper.SaveImageAsync(image, _env);
            if (!ok)
            {
                ModelState.AddModelError("image", err ?? "Yükleme hatası");
                model.ImagePath = item.ImagePath;
                model.Id = id;
                return View(model);
            }
            FileUploadHelper.DeleteImage(item.ImagePath, _env);
            item.ImagePath = path;
        }

        await _db.SaveChangesAsync();
        await _logs.LogAsync(HttpContext, "MENU_UPDATED", $"item_id={id}", userId);
        TempData["SuccessMessage"] = "Menü güncellendi";
        return RedirectToAction(nameof(Menu));
    }

    // === MENU SOFT DELETE ===
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MenuDelete(int id)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .FirstOrDefaultAsync(m => m.Id == id && m.CatererId == userId);
        if (item == null)
        {
            TempData["ErrorMessage"] = "Menü bulunamadı";
            return RedirectToAction(nameof(Menu));
        }

        item.IsAvailable = false;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _logs.LogAsync(HttpContext, "MENU_DELETED", $"item_id={id}", userId);
        TempData["SuccessMessage"] = "Menü pasif yapıldı";
        return RedirectToAction(nameof(Menu));
    }

    // === CUSTOMIZATION ===
    public async Task<IActionResult> MenuCustomize(int id)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .Include(m => m.OptionGroups).ThenInclude(g => g.Options)
            .Include(m => m.RemovableIngredients)
            .FirstOrDefaultAsync(m => m.Id == id && m.CatererId == userId);
        if (item == null)
        {
            TempData["ErrorMessage"] = "Menü bulunamadı";
            return RedirectToAction(nameof(Menu));
        }
        ViewData["Title"] = $"{item.Name} - Seçenekler";
        return View(item);
    }

    // --- OptionGroup ---
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> OptionGroupCreate(int menuItemId, string name,
        bool isRequired, int minSelect, int maxSelect)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .FirstOrDefaultAsync(m => m.Id == menuItemId && m.CatererId == userId);
        if (item == null) return RedirectToAction(nameof(Menu));

        if (string.IsNullOrWhiteSpace(name) || maxSelect < 1 || maxSelect < minSelect || minSelect < 0)
        {
            TempData["ErrorMessage"] = "Geçersiz grup verisi (min>=0, max>=1, max>=min)";
            return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
        }

        _db.OptionGroups.Add(new OptionGroup
        {
            MenuItemId = menuItemId,
            Name = name.Trim(),
            IsRequired = isRequired,
            MinSelect = minSelect,
            MaxSelect = maxSelect
        });
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Grup eklendi";
        return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> OptionGroupDelete(int groupId)
    {
        var userId = _userManager.GetUserId(User);
        var group = await _db.OptionGroups
            .Include(g => g.MenuItem)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null || group.MenuItem == null || group.MenuItem.CatererId != userId)
        {
            TempData["ErrorMessage"] = "Grup bulunamadı";
            return RedirectToAction(nameof(Menu));
        }
        var menuItemId = group.MenuItemId;
        _db.OptionGroups.Remove(group);
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Grup silindi";
        return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
    }

    // --- MenuOption ---
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> OptionCreate(int groupId, string name, decimal extraPrice)
    {
        var userId = _userManager.GetUserId(User);
        var group = await _db.OptionGroups
            .Include(g => g.MenuItem)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null || group.MenuItem == null || group.MenuItem.CatererId != userId)
        {
            TempData["ErrorMessage"] = "Grup bulunamadı";
            return RedirectToAction(nameof(Menu));
        }

        if (string.IsNullOrWhiteSpace(name) || extraPrice < 0)
        {
            TempData["ErrorMessage"] = "Geçersiz seçenek";
            return RedirectToAction(nameof(MenuCustomize), new { id = group.MenuItemId });
        }

        _db.MenuOptions.Add(new MenuOption
        {
            GroupId = groupId,
            Name = name.Trim(),
            ExtraPrice = extraPrice
        });
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Seçenek eklendi";
        return RedirectToAction(nameof(MenuCustomize), new { id = group.MenuItemId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> OptionDelete(int optionId)
    {
        var userId = _userManager.GetUserId(User);
        var opt = await _db.MenuOptions
            .Include(o => o.Group).ThenInclude(g => g!.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == optionId);
        if (opt == null || opt.Group?.MenuItem == null || opt.Group.MenuItem.CatererId != userId)
        {
            TempData["ErrorMessage"] = "Seçenek bulunamadı";
            return RedirectToAction(nameof(Menu));
        }
        var menuItemId = opt.Group!.MenuItemId;
        _db.MenuOptions.Remove(opt);
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Seçenek silindi";
        return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
    }

    // --- RemovableIngredient ---
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RemovableCreate(int menuItemId, string name)
    {
        var userId = _userManager.GetUserId(User);
        var item = await _db.MenuItems
            .FirstOrDefaultAsync(m => m.Id == menuItemId && m.CatererId == userId);
        if (item == null) return RedirectToAction(nameof(Menu));

        if (string.IsNullOrWhiteSpace(name))
        {
            TempData["ErrorMessage"] = "İsim boş olamaz";
            return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
        }

        _db.RemovableIngredients.Add(new RemovableIngredient
        {
            MenuItemId = menuItemId,
            Name = name.Trim()
        });
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Malzeme eklendi";
        return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RemovableDelete(int removableId)
    {
        var userId = _userManager.GetUserId(User);
        var rem = await _db.RemovableIngredients
            .Include(r => r.MenuItem)
            .FirstOrDefaultAsync(r => r.Id == removableId);
        if (rem == null || rem.MenuItem == null || rem.MenuItem.CatererId != userId)
        {
            TempData["ErrorMessage"] = "Malzeme bulunamadı";
            return RedirectToAction(nameof(Menu));
        }
        var menuItemId = rem.MenuItemId;
        _db.RemovableIngredients.Remove(rem);
        await _db.SaveChangesAsync();
        TempData["SuccessMessage"] = "Malzeme silindi";
        return RedirectToAction(nameof(MenuCustomize), new { id = menuItemId });
    }
}
