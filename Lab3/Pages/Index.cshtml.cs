using Lab3.Data;
using Lab3.Models.Media;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Lab3.Pages;

public class IndexModel(ApplicationDbContext context) : PageModel
{
    private readonly ApplicationDbContext _context = context;

    [BindProperty]
    public IFormFile? GalleryFile { get; set; }

    public List<UserRowViewModel> Users { get; private set; } = [];
    public List<GalleryImageViewModel> GalleryImages { get; private set; } = [];

    public async Task OnGetAsync()
    {
        await LoadPageDataAsync();
    }

    public async Task<IActionResult> OnPostUploadImageAsync()
    {
        if (GalleryFile is { Length: > 0 })
        {
            using var memoryStream = new MemoryStream();
            await GalleryFile.CopyToAsync(memoryStream);

            var image = new ImageModel
            {
                FileName = Path.GetFileName(GalleryFile.FileName),
                ContentType = string.IsNullOrWhiteSpace(GalleryFile.ContentType) ? "application/octet-stream" : GalleryFile.ContentType,
                Size = GalleryFile.Length,
                Data = memoryStream.ToArray()
            };

            _context.Images.Add(image);
            await _context.SaveChangesAsync();
        }

        return RedirectToPage();
    }

    private async Task LoadPageDataAsync()
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

        var gallery = await _context.Images
            .AsNoTracking()
            .OrderByDescending(image => image.Id)
            .ToListAsync();

        GalleryImages = gallery.Select(image => new GalleryImageViewModel
        {
            FileName = image.FileName,
            ContentType = image.ContentType,
            Size = image.Size,
            DataUrl = $"data:{image.ContentType};base64,{Convert.ToBase64String(image.Data)}"
        }).ToList();
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
