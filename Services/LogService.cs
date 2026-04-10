using Microsoft.Extensions.Logging;
using Sofranet.Data;
using Sofranet.Models;

namespace Sofranet.Services;

public class LogService : ILogService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<LogService> _logger;

    public LogService(ApplicationDbContext db, ILogger<LogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task LogAsync(string action, string details, string? userId = null, string? ipAddress = null)
    {
        try
        {
            var entry = new LogEntry
            {
                Action = action,
                Details = details ?? string.Empty,
                UserId = userId,
                IpAddress = ipAddress ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };
            _db.LogEntries.Add(entry);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Log kaydı yazılamadı: {Action}", action);
        }
    }
}
