using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class LoginViewModel
{
    [Required(ErrorMessage = "Email zorunlu")]
    [EmailAddress(ErrorMessage = "Geçerli bir email gir")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre zorunlu")]
    [DataType(DataType.Password)]
    [Display(Name = "Şifre")]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Beni hatırla")]
    public bool RememberMe { get; set; }
}
