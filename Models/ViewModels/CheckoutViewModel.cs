using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class CheckoutViewModel
{
    public List<EnrichedCartItem> Items { get; set; } = new();
    public decimal Total { get; set; }
    public string CatererName { get; set; } = string.Empty;

    public string? UserAddress { get; set; }
    public double? UserLat { get; set; }
    public double? UserLng { get; set; }

    [Required(ErrorMessage = "Kart üzerindeki isim zorunlu")]
    [StringLength(100)]
    [Display(Name = "Kart Üzerindeki İsim")]
    public string CardName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Kart numarası zorunlu")]
    [Display(Name = "Kart Numarası")]
    public string CardNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Son kullanma zorunlu")]
    [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{2}$", ErrorMessage = "MM/YY formatında girin")]
    [Display(Name = "Son Kullanma (MM/YY)")]
    public string CardExpiry { get; set; } = string.Empty;

    [Required(ErrorMessage = "CVV zorunlu")]
    [RegularExpression(@"^\d{3,4}$", ErrorMessage = "3 veya 4 haneli olmalı")]
    [Display(Name = "CVV")]
    public string CardCvv { get; set; } = string.Empty;

    public bool UseProfileAddress { get; set; } = true;

    [Display(Name = "Adres")]
    public string? ManualAddress { get; set; }
}
