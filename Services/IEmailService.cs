using Sofranet.Helpers;
using Sofranet.Models;

namespace Sofranet.Services;

public interface IEmailService
{
    Task<bool> SendOrderConfirmationToUserAsync(FullOrderInfo info);
    Task<bool> SendOrderNotificationToCatererAsync(FullOrderInfo info);
    Task<bool> SendTwoFactorCodeAsync(ApplicationUser user, string code);
}
