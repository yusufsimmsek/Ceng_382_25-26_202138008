namespace Sofranet.Models.ViewModels;

public class MenuListItemViewModel
{
    public MenuItem Item { get; set; } = null!;
    public string CatererName { get; set; } = string.Empty;
    public decimal? MenuAvg { get; set; }
    public int RatingCount { get; set; }
    public decimal? CatererAvg { get; set; }
}
