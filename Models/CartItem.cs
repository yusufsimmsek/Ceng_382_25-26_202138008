namespace Sofranet.Models;

public class CartItem
{
    public int MenuItemId { get; set; }
    public string CatererId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public List<int> OptionIds { get; set; } = new();
    public List<int> RemovalIds { get; set; } = new();
}
