namespace Sofranet.Models.ViewModels;

public class CartViewModel
{
    public List<EnrichedCartItem> Items { get; set; } = new();
    public decimal Total { get; set; }

    public string? CatererId { get; set; }
    public string? CatererName { get; set; }

    public PendingCartItem? PendingItem { get; set; }
    public string? PendingItemName { get; set; }
}
