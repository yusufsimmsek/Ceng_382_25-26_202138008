using System.Diagnostics;
using Lab3.Data;
using Microsoft.AspNetCore.Mvc;
using Lab3.Models;
using Lab3.Models.Media;
using Lab3.Models.ViewModels.Home;
using Microsoft.EntityFrameworkCore;

namespace Lab3.Controllers;

public class HomeController(ApplicationDbContext db) : Controller
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var images = await db.Images
            .AsNoTracking()
            .OrderByDescending(x => x.Id)
            .Take(20)
            .ToListAsync();

        var model = new HomeIndexViewModel
        {
            Images = images
        };

        return View(model);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Upload(List<IFormFile>? files)
    {
        if (files is null || files.Count == 0)
        {
            TempData["UploadError"] = "Please select at least one image.";
            return RedirectToAction(nameof(Index));
        }

        const long maxSize = 5 * 1024 * 1024;
        var uploaded = 0;

        foreach (var file in files)
        {
            var isImage = file.ContentType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true;
            if (!isImage || file.Length == 0 || file.Length > maxSize)
            {
                continue;
            }

            await using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            db.Images.Add(new ImageModel
            {
                FileName = Path.GetFileName(file.FileName),
                ContentType = file.ContentType ?? "application/octet-stream",
                Size = file.Length,
                Data = stream.ToArray()
            });

            uploaded++;
        }

        if (uploaded == 0)
        {
            TempData["UploadError"] = "No valid image uploaded. Use image files under 5 MB.";
            return RedirectToAction(nameof(Index));
        }

        await db.SaveChangesAsync();
        TempData["UploadMessage"] = $"{uploaded} image(s) uploaded.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Image(int id)
    {
        var image = await db.Images.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (image is null)
        {
            return NotFound();
        }

        return File(image.Data, image.ContentType);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
