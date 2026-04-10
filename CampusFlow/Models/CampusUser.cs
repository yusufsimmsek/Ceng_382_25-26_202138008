using System.ComponentModel.DataAnnotations;

namespace CampusFlow.Models;

public class CampusUser
{
    public int Id { get; set; }

    [Required]
    [StringLength(80)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(120)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(160)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.Student;

    public ICollection<CampusEvent> CreatedEvents { get; set; } = new List<CampusEvent>();
    public ICollection<UserEvent> JoinedEvents { get; set; } = new List<UserEvent>();

    public int EngagementScore => JoinedEvents.Count * 10;
}
