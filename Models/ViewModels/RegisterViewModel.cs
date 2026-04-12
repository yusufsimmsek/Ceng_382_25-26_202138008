using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class RegisterViewModel
{
    [Required(ErrorMessage = "Ad soyad zorunlu")]
    [StringLength(100)]
    [Display(Name = "Ad Soyad")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email zorunlu")]
    [EmailAddress(ErrorMessage = "Geçerli bir email gir")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [Display(Name = "Telefon")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Şifre zorunlu")]
    [DataType(DataType.Password)]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalı")]
    [Display(Name = "Şifre")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre tekrarı zorunlu")]
    [DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "Şifreler uyuşmuyor")]
    [Display(Name = "Şifre (Tekrar)")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required]
    [Display(Name = "Hesap Tipi")]
    public string Role { get; set; } = "User";

    [StringLength(500)]
    [Display(Name = "Adres")]
    public string? Address { get; set; }
}
