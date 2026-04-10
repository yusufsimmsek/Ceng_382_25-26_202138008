namespace Sofranet.Models;

public class OrderItemRemoval
{
    public int Id { get; set; }

    public int OrderItemId { get; set; }
    public OrderItem? OrderItem { get; set; }

    public int RemovableIngredientId { get; set; }
    public RemovableIngredient? RemovableIngredient { get; set; }
}
