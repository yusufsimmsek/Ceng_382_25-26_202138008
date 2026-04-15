namespace Sofranet.Helpers;

public static class FileUploadHelper
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxSize = 5 * 1024 * 1024; // 5MB

    public static async Task<(bool Success, string? Path, string? Error)> SaveImageAsync(
        IFormFile file, IWebHostEnvironment env, string subfolder = "menu")
    {
        if (file == null || file.Length == 0)
            return (false, null, "Dosya boş");
        if (file.Length > MaxSize)
            return (false, null, "Dosya çok büyük (max 5MB)");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return (false, null, "Sadece JPG, PNG, WEBP destekleniyor");

        var uploadDir = Path.Combine(env.WebRootPath, "uploads", subfolder);
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{DateTime.UtcNow.Ticks}-{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadDir, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
            await file.CopyToAsync(stream);

        return (true, $"/uploads/{subfolder}/{fileName}", null);
    }

    public static void DeleteImage(string? path, IWebHostEnvironment env)
    {
        if (string.IsNullOrEmpty(path) || !path.StartsWith("/uploads/")) return;
        try
        {
            var fullPath = Path.Combine(env.WebRootPath, path.TrimStart('/'));
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch
        {
            // sessizce yut - logla istemiyoruz
        }
    }
}
