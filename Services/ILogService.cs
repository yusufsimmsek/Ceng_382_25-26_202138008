namespace Sofranet.Services;

public interface ILogService
{
    Task LogAsync(string action, string details, string? userId = null, string? ipAddress = null);
}
