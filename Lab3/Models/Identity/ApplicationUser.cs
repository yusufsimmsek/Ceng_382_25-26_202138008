using Microsoft.AspNetCore.Identity;

namespace Lab3.Models.Identity;

public class ApplicationUser : IdentityUser
{
    public byte[]? ProfilePhoto { get; set; }
    public string? ProfilePhotoContentType { get; set; }
}
