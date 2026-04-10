using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sofranet.Models;

public class MenuItem
{
    public int Id { get; set; }

    [Required]
    public string CatererId { get; set; } = string.Empty;
    public ApplicationUser? Caterer { get; set; }

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "numeric(10,2)")]
    [Range(0.01, 100000)]
    public decimal Price { get; set; }

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    public string? ImagePath { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OptionGroup> OptionGroups { get; set; } = new List<OptionGroup>();
    public ICollection<RemovableIngredient> RemovableIngredients { get; set; } = new List<RemovableIngredient>();
}
