using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models;

public class RemovableIngredient
{
    public int Id { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
}
