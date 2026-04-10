using System.ComponentModel.DataAnnotations;

namespace CampusFlow.Models;

public class CampusEvent
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(700)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [StringLength(60)]
    public string Category { get; set; } = string.Empty;

    public int ClubId { get; set; }
    public Club? Club { get; set; }

    public int CreatedById { get; set; }
    public CampusUser? CreatedBy { get; set; }

    public ICollection<UserEvent> Participants { get; set; } = new List<UserEvent>();
}
