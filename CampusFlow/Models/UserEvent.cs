namespace CampusFlow.Models;

public class UserEvent
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public CampusUser? User { get; set; }

    public int EventId { get; set; }
    public CampusEvent? Event { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
