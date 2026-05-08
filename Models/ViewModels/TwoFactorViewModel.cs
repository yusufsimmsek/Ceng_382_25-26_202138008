using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class TwoFactorViewModel
{
    [Required(ErrorMessage = "Kod zorunlu")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Kod 6 haneli olmalı")]
    [Display(Name = "Doğrulama Kodu")]
    public string Code { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
    public string? ReturnUrl { get; set; }
}
