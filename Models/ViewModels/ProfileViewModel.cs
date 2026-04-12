using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class ProfileViewModel
{
    [Display(Name = "Ad Soyad")]
    public string FullName { get; set; } = string.Empty;

    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Telefon")]
    public string? Phone { get; set; }

    [Display(Name = "Adres")]
    public string? Address { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public bool TwoFactorEnabled { get; set; }
}
