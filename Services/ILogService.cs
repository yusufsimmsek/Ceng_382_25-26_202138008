namespace Sofranet.Services;

public interface ILogService
{
    Task LogAsync(HttpContext? ctx, string action, string details = "", string? userIdOverride = null);
}
