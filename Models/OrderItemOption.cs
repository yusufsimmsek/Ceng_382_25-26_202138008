namespace Sofranet.Models;

public class OrderItemOption
{
    public int Id { get; set; }

    public int OrderItemId { get; set; }
    public OrderItem? OrderItem { get; set; }

    public int OptionId { get; set; }
    public MenuOption? Option { get; set; }
}
