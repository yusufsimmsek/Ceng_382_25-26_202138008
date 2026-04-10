using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models;

public class OptionGroup
{
    public int Id { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; }

    public int MinSelect { get; set; } = 0;
    public int MaxSelect { get; set; } = 1;

    public ICollection<MenuOption> Options { get; set; } = new List<MenuOption>();
}
