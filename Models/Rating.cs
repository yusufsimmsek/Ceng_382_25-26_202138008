using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models;

public class Rating
{
    public int Id { get; set; }

    // Order ile one-to-one (unique)
    public int OrderId { get; set; }
    public Order? Order { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public int? MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    [Required]
    public string CatererId { get; set; } = string.Empty;
    public ApplicationUser? Caterer { get; set; }

    [Range(1, 5)]
    public int MenuRating { get; set; }

    [Range(1, 5)]
    public int CatererRating { get; set; }

    [StringLength(500)]
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
