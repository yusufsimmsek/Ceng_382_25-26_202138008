using System.ComponentModel.DataAnnotations.Schema;

namespace Sofranet.Models;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    public int Quantity { get; set; } = 1;

    // snapshot - sipariş anındaki base fiyat
    [Column(TypeName = "numeric(10,2)")]
    public decimal ItemPrice { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal CustomizationExtra { get; set; } = 0;

    public ICollection<OrderItemOption> SelectedOptions { get; set; } = new List<OrderItemOption>();
    public ICollection<OrderItemRemoval> Removals { get; set; } = new List<OrderItemRemoval>();
}
