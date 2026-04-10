using System.ComponentModel.DataAnnotations;

namespace CampusFlow.Models;

public class Club
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(400)]
    public string Description { get; set; } = string.Empty;

    public ICollection<CampusEvent> Events { get; set; } = new List<CampusEvent>();
}
