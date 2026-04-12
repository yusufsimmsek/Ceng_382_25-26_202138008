using System.Security.Claims;
using Microsoft.Extensions.Logging;
using Sofranet.Data;
using Sofranet.Models;

namespace Sofranet.Services;

public class LogService : ILogService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LogService> _logger;

    public LogService(IServiceScopeFactory scopeFactory, ILogger<LogService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task LogAsync(HttpContext? ctx, string action, string details = "", string? userIdOverride = null)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            string? userId = userIdOverride;
            if (userId == null && ctx?.User?.Identity?.IsAuthenticated == true)
            {
                userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            }

            var ip = ctx?.Connection?.RemoteIpAddress?.ToString() ?? string.Empty;

            db.LogEntries.Add(new LogEntry
            {
                UserId = userId,
                Action = action,
                Details = details.Length > 1000 ? details.Substring(0, 1000) : details,
                IpAddress = ip,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Log kaydi basarisiz: {Action}", action);
        }
    }
}
