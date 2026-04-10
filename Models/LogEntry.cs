using System.ComponentModel.DataAnnotations;

namespace Sofranet.Models;

public class LogEntry
{
    public long Id { get; set; }

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    [Required]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Details { get; set; } = string.Empty;

    [StringLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
