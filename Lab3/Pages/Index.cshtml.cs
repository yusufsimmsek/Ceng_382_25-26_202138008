using Lab3.Data;
using Lab3.Models.Media;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Lab3.Pages;

public class IndexModel(ApplicationDbContext context) : PageModel
{
    private const string CarouselPrefix = "[CAROUSEL] ";
    private readonly ApplicationDbContext _context = context;

    [BindProperty]
    public IFormFile? GalleryFile { get; set; }

    [BindProperty]
    public IFormFile? CarouselFile { get; set; }

    public List<UserRowViewModel> Users { get; private set; } = [];
    public List<GalleryImageViewModel> GalleryImages { get; private set; } = [];
    public List<GalleryImageViewModel> CarouselImages { get; private set; } = [];

    [TempData]
    public string? DatabaseErrorMessage { get; set; }

    public async Task OnGetAsync()
    {
        await LoadPageDataAsync();
    }

    public async Task<IActionResult> OnPostUploadImageAsync()
    {
        try
        {
            if (GalleryFile is { Length: > 0 })
            {
                using var memoryStream = new MemoryStream();
                await GalleryFile.CopyToAsync(memoryStream);

                var image = new ImageModel
                {
                    FileName = NormalizeGalleryFileName(Path.GetFileName(GalleryFile.FileName)),
                    ContentType = string.IsNullOrWhiteSpace(GalleryFile.ContentType) ? "application/octet-stream" : GalleryFile.ContentType,
                    Size = GalleryFile.Length,
                    Data = memoryStream.ToArray()
                };

                _context.Images.Add(image);
                await _context.SaveChangesAsync();
            }
        }
        catch
        {
            DatabaseErrorMessage = "Database connection failed. Check SQL Server connection settings.";
        }

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostUploadCarouselImageAsync()
    {
        try
        {
            if (CarouselFile is { Length: > 0 })
            {
                using var memoryStream = new MemoryStream();
                await CarouselFile.CopyToAsync(memoryStream);

                var image = new ImageModel
                {
                    FileName = BuildCarouselFileName(Path.GetFileName(CarouselFile.FileName)),
                    ContentType = string.IsNullOrWhiteSpace(CarouselFile.ContentType) ? "application/octet-stream" : CarouselFile.ContentType,
                    Size = CarouselFile.Length,
                    Data = memoryStream.ToArray()
                };

                _context.Images.Add(image);
                await _context.SaveChangesAsync();
            }
        }
        catch
        {
            DatabaseErrorMessage = "Database connection failed. Check SQL Server connection settings.";
        }

        return RedirectToPage();
    }

    private async Task LoadPageDataAsync()
    {
        try
        {
            var users = await _context.Users
                .AsNoTracking()
                .OrderBy(user => user.Email)
                .ToListAsync();

            Users = users.Select(user => new UserRowViewModel
            {
                Email = user.Email ?? "-",
                UserName = user.UserName ?? "-",
                ProfilePhotoDataUrl = user.ProfilePhoto is not null && !string.IsNullOrWhiteSpace(user.ProfilePhotoContentType)
                    ? $"data:{user.ProfilePhotoContentType};base64,{Convert.ToBase64String(user.ProfilePhoto)}"
                    : null
            }).ToList();

            var allImages = await _context.Images
                .AsNoTracking()
                .OrderByDescending(image => image.Id)
                .ToListAsync();

            GalleryImages = allImages
                .Where(image => !IsCarouselImage(image.FileName))
                .Select(image => new GalleryImageViewModel
                {
                    FileName = image.FileName,
                    ContentType = image.ContentType,
                    Size = image.Size,
                    DataUrl = $"data:{image.ContentType};base64,{Convert.ToBase64String(image.Data)}"
                }).ToList();

            CarouselImages = allImages
                .Where(image => IsCarouselImage(image.FileName))
                .Select(image => new GalleryImageViewModel
                {
                    FileName = GetDisplayFileName(image.FileName),
                    ContentType = image.ContentType,
                    Size = image.Size,
                    DataUrl = $"data:{image.ContentType};base64,{Convert.ToBase64String(image.Data)}"
                }).ToList();
        }
        catch
        {
            DatabaseErrorMessage ??= "Database connection failed. Check SQL Server connection settings.";
            Users = [];
            GalleryImages = [];
            CarouselImages = [];
        }
    }

    private static bool IsCarouselImage(string fileName)
    {
        return fileName.StartsWith(CarouselPrefix, StringComparison.Ordinal);
    }

    private static string BuildCarouselFileName(string fileName)
    {
        return $"{CarouselPrefix}{NormalizeGalleryFileName(fileName)}";
    }

    private static string NormalizeGalleryFileName(string fileName)
    {
        if (IsCarouselImage(fileName))
        {
            return fileName[CarouselPrefix.Length..];
        }

        return fileName;
    }

    private static string GetDisplayFileName(string fileName)
    {
        return NormalizeGalleryFileName(fileName);
    }

    public class UserRowViewModel
    {
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfilePhotoDataUrl { get; set; }
    }

    public class GalleryImageViewModel
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Size { get; set; }
        public string DataUrl { get; set; } = string.Empty;
    }
}
