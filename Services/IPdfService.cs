using Sofranet.Models;

namespace Sofranet.Services;

public interface IPdfService
{
    byte[] GenerateReceipt(Order order);
    byte[] GenerateAgreement(Order order);
}
