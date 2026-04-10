using Sofranet.Models;

namespace Sofranet.Services;

// Placeholder - QuestPDF implementation Prompt 7'de gelecek
public class PdfService : IPdfService
{
    public byte[] GenerateReceipt(Order order)
    {
        // TODO: QuestPDF ile fatura
        return Array.Empty<byte>();
    }

    public byte[] GenerateAgreement(Order order)
    {
        // TODO: QuestPDF ile sözleşme
        return Array.Empty<byte>();
    }
}
