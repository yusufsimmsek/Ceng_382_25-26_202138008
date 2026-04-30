using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models.ViewModels;

public class RateOrderViewModel
{
    public int OrderId { get; set; }

    public string CatererName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public List<string> ItemNames { get; set; } = new();

    [Range(1, 5, ErrorMessage = "1-5 arası puan ver")]
    public int MenuRating { get; set; }

    [Range(1, 5, ErrorMessage = "1-5 arası puan ver")]
    public int CatererRating { get; set; }

    [StringLength(500)]
    public string? Comment { get; set; }
}
