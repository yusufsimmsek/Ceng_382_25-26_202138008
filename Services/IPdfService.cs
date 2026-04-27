using Sofranet.Helpers;

namespace Sofranet.Services;

public interface IPdfService
{
    byte[] GenerateReceipt(FullOrderInfo info);
    byte[] GenerateAgreement(FullOrderInfo info);
}
