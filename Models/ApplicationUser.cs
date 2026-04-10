using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Sofranet.Models;

public class ApplicationUser : IdentityUser
{
    [Required]
    [StringLength(150)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Address { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Caterer için menü itemları
    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();

    // User olarak verilen siparişler
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    // Caterer'a gelen siparişler
    public ICollection<Order> CatererOrders { get; set; } = new List<Order>();
}
