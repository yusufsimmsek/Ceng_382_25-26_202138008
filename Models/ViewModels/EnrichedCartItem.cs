namespace Sofranet.Models.ViewModels;

public class EnrichedCartItem
{
    public int Index { get; set; }
    public int MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public decimal BasePrice { get; set; }
    public int Quantity { get; set; }
    public decimal Extras { get; set; }

    public decimal UnitPrice => BasePrice + Extras;
    public decimal Subtotal => UnitPrice * Quantity;

    public List<EnrichedOptionInfo> Options { get; set; } = new();
    public List<string> Removals { get; set; } = new();
}

public class EnrichedOptionInfo
{
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public decimal ExtraPrice { get; set; }
}
