using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Lab3.Models.ViewModels.Account;

public class RegisterInputModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "The password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    public IFormFile? ProfilePhoto { get; set; }
}
