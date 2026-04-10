using Microsoft.Extensions.Logging;

namespace Sofranet.Services;

// Placeholder - gerçek MailKit implementation Prompt 7'de
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _config;

    public EmailService(ILogger<EmailService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public Task SendAsync(string to, string subject, string htmlBody)
    {
        // TODO: MailKit ile SMTP gönderimi
        _logger.LogInformation("[Email] To={To} Subject={Subject}", to, subject);
        return Task.CompletedTask;
    }
}
