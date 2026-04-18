namespace Sofranet.Models.ViewModels;

public class MenuDetailViewModel
{
    public MenuItem Item { get; set; } = null!;
    public string CatererName { get; set; } = string.Empty;
    public string? CatererAddress { get; set; }
    public double? CatererLat { get; set; }
    public double? CatererLng { get; set; }

    public decimal? MenuAvg { get; set; }
    public int RatingCount { get; set; }
    public decimal? CatererAvg { get; set; }

    public List<OptionGroup> Groups { get; set; } = new();
    public List<RemovableIngredient> Removables { get; set; } = new();
    public List<RecentCommentViewModel> RecentComments { get; set; } = new();
}
