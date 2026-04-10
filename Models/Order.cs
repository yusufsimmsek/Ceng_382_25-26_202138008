using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sofranet.Models;

public class Order
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Required]
    public string CatererId { get; set; } = string.Empty;
    public ApplicationUser? Caterer { get; set; }

    [Required]
    [Column(TypeName = "numeric(10,2)")]
    public decimal TotalAmount { get; set; }

    // pending / preparing / completed / cancelled
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "pending";

    [StringLength(20)]
    public string PaymentStatus { get; set; } = "paid";

    [Column(TypeName = "text")]
    public string? DeliveryAddress { get; set; }
    public double? DeliveryLat { get; set; }
    public double? DeliveryLng { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Rating? Rating { get; set; }
}
