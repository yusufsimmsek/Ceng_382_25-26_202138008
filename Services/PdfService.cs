using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sofranet.Helpers;

namespace Sofranet.Services;

public class PdfService : IPdfService
{
    public byte[] GenerateReceipt(FullOrderInfo info)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Helvetica"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("SOFRANET").FontSize(24).Bold().FontColor("#E63946");
                        c.Item().Text("Mahallendeki lezzet").FontSize(10).FontColor(Colors.Grey.Medium);
                    });
                    row.RelativeItem().AlignRight().Column(c =>
                    {
                        c.Item().Text("MAKBUZ").FontSize(18).Bold().FontColor(Colors.Grey.Darken3);
                        c.Item().Text($"#{info.Order.Id}").FontSize(12).FontColor(Colors.Grey.Medium);
                    });
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Item().LineHorizontal(2).LineColor("#E63946");

                    col.Item().PaddingTop(12).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Tarih:").SemiBold();
                            c.Item().Text(info.Order.CreatedAt.ToString("dd.MM.yyyy HH:mm"));
                            c.Item().PaddingTop(8).Text("Durum:").SemiBold();
                            c.Item().Text(StatusTr(info.Order.Status));
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text("Ödeme:").SemiBold();
                            c.Item().Text("Kart (Simülasyon)");
                        });
                    });

                    col.Item().PaddingTop(20).Row(row =>
                    {
                        row.RelativeItem().Padding(10).Border(1).BorderColor(Colors.Grey.Lighten2).Column(c =>
                        {
                            c.Item().Text("MÜŞTERİ").Bold().FontColor("#E63946").FontSize(10);
                            c.Item().PaddingTop(4).Text(info.User.FullName).SemiBold();
                            c.Item().Text(info.User.Email ?? "-").FontSize(10);
                            c.Item().Text("Tel: " + (info.User.PhoneNumber ?? "-")).FontSize(10);
                            c.Item().PaddingTop(4).Text(info.Order.DeliveryAddress ?? "-").FontSize(10);
                        });
                        row.ConstantItem(20);
                        row.RelativeItem().Padding(10).Border(1).BorderColor(Colors.Grey.Lighten2).Column(c =>
                        {
                            c.Item().Text("RESTORAN").Bold().FontColor("#E63946").FontSize(10);
                            c.Item().PaddingTop(4).Text(info.Caterer.FullName).SemiBold();
                            c.Item().Text(info.Caterer.Email ?? "-").FontSize(10);
                            c.Item().Text(info.Caterer.Address ?? "-").FontSize(10);
                        });
                    });

                    col.Item().PaddingTop(20).Table(t =>
                    {
                        t.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(4);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        t.Header(h =>
                        {
                            h.Cell().Background("#FAF5F0").Padding(8).Text("Ürün").Bold();
                            h.Cell().Background("#FAF5F0").Padding(8).Text("Adet").Bold();
                            h.Cell().Background("#FAF5F0").Padding(8).Text("Birim").Bold();
                            h.Cell().Background("#FAF5F0").Padding(8).AlignRight().Text("Toplam").Bold();
                        });

                        foreach (var it in info.Items)
                        {
                            t.Cell().Padding(8).Column(c =>
                            {
                                c.Item().Text(it.Name).SemiBold();
                                if (it.Options.Any())
                                {
                                    c.Item().Text("+ " + string.Join(", ", it.Options.Select(o => o.OptionName)))
                                        .FontSize(9).FontColor(Colors.Grey.Medium);
                                }
                                if (it.Removals.Any())
                                {
                                    c.Item().Text("- Çıkarıldı: " + string.Join(", ", it.Removals))
                                        .FontSize(9).FontColor(Colors.Grey.Medium);
                                }
                            });
                            t.Cell().Padding(8).Text(it.Quantity.ToString());
                            t.Cell().Padding(8).Text($"₺{it.Unit:0.00}");
                            t.Cell().Padding(8).AlignRight().Text($"₺{it.Subtotal:0.00}");
                        }
                    });

                    col.Item().PaddingTop(12).AlignRight()
                        .Text($"GENEL TOPLAM: ₺{info.Order.TotalAmount:0.00}")
                        .FontSize(16).Bold().FontColor("#E63946");
                });

                page.Footer().AlignCenter().Column(c =>
                {
                    c.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
                    c.Item().PaddingTop(6)
                        .Text("Bu makbuz Sofranet sistemi tarafından otomatik üretilmiştir.")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                    c.Item().Text("Bu bir simülasyon işlemidir, gerçek ödeme yapılmamıştır.")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });
        return doc.GeneratePdf();
    }

    public byte[] GenerateAgreement(FullOrderInfo info)
    {
        var year = info.Order.CreatedAt.Year;
        var agreementNo = $"SOF-{info.Order.Id}-{year}";

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(50);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                page.Header().Column(c =>
                {
                    c.Item().AlignCenter().Text("HİZMET SÖZLEŞMESİ").FontSize(18).Bold();
                    c.Item().AlignCenter().Text(agreementNo).FontSize(11).FontColor(Colors.Grey.Medium);
                    c.Item().AlignRight().Text("Tarih: " + info.Order.CreatedAt.ToString("dd.MM.yyyy")).FontSize(9);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Item().LineHorizontal(1).LineColor("#E63946");

                    col.Item().PaddingTop(15).Text("TARAFLAR").Bold().FontColor("#E63946");

                    col.Item().PaddingTop(8).Text("1. TARAF (HİZMET SAĞLAYICI)").SemiBold();
                    col.Item().Text($"Unvan: {info.Caterer.FullName}");
                    col.Item().Text($"E-posta: {info.Caterer.Email ?? "-"}");
                    col.Item().Text($"Telefon: {info.Caterer.PhoneNumber ?? "-"}");
                    col.Item().Text($"Adres: {info.Caterer.Address ?? "-"}");

                    col.Item().PaddingTop(8).Text("2. TARAF (ALICI/MÜŞTERİ)").SemiBold();
                    col.Item().Text($"Ad Soyad: {info.User.FullName}");
                    col.Item().Text($"E-posta: {info.User.Email ?? "-"}");
                    col.Item().Text($"Telefon: {info.User.PhoneNumber ?? "-"}");
                    col.Item().Text($"Teslimat Adresi: {info.Order.DeliveryAddress ?? "-"}");

                    col.Item().PaddingTop(15).Text("SÖZLEŞME KONUSU").Bold().FontColor("#E63946");
                    col.Item().PaddingTop(5).Text(
                        $"İşbu sözleşme, 2. Taraf'ın 1. Taraf'tan Sofranet platformu üzerinden almış olduğu yiyecek ve içecek hizmetlerinin koşullarını düzenler. " +
                        $"Sipariş No: #{info.Order.Id}, sipariş tarihi {info.Order.CreatedAt:dd.MM.yyyy}, " +
                        $"sipariş tutarı toplam ₺{info.Order.TotalAmount:0.00}'dir.")
                        .Justify();

                    col.Item().PaddingTop(15).Text("SİPARİŞ İÇERİĞİ").Bold().FontColor("#E63946");
                    col.Item().PaddingTop(5).Table(t =>
                    {
                        t.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(30);
                            cols.RelativeColumn(4);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                        });
                        t.Header(h =>
                        {
                            h.Cell().Background("#FAF5F0").Padding(6).Text("#").Bold();
                            h.Cell().Background("#FAF5F0").Padding(6).Text("Ürün").Bold();
                            h.Cell().Background("#FAF5F0").Padding(6).Text("Adet").Bold();
                            h.Cell().Background("#FAF5F0").Padding(6).AlignRight().Text("Tutar").Bold();
                        });
                        int idx = 1;
                        foreach (var it in info.Items)
                        {
                            t.Cell().Padding(6).Text(idx.ToString());
                            t.Cell().Padding(6).Text(it.Name);
                            t.Cell().Padding(6).Text(it.Quantity.ToString());
                            t.Cell().Padding(6).AlignRight().Text($"₺{it.Subtotal:0.00}");
                            idx++;
                        }
                    });
                    col.Item().PaddingTop(8).AlignRight()
                        .Text($"TOPLAM: ₺{info.Order.TotalAmount:0.00}").Bold();

                    col.Item().PaddingTop(15).Text("GENEL HÜKÜMLER").Bold().FontColor("#E63946");
                    var maddeler = new[]
                    {
                        "1. 1. Taraf, sipariş edilen ürünleri tarif edildiği şekilde ve uygun hijyen koşullarında hazırlamayı taahhüt eder.",
                        "2. 2. Taraf, sipariş tutarını sipariş anında ödediğini ve ödemenin Sofranet platformu üzerinden başarıyla gerçekleştirildiğini beyan eder.",
                        "3. Teslimat süresi, sipariş onaylandıktan sonra makul bir süre içerisinde gerçekleşecektir. Olağandışı durumlarda 1. Taraf, 2. Taraf'ı bilgilendirir.",
                        "4. Sipariş edilen ürünlerde bir uygunsuzluk olması halinde 2. Taraf, teslimattan itibaren 30 dakika içerisinde 1. Taraf veya Sofranet üzerinden durumu bildirebilir.",
                        "5. Sipariş, hazırlık aşamasına geçtikten sonra iptal edilemez. Hazırlık öncesi iptaller için 2. Taraf, Sofranet üzerinden talepte bulunabilir.",
                        "6. Taraflar, kişisel verilerin Sofranet Gizlilik Politikası çerçevesinde işlendiğini kabul eder.",
                        "7. İşbu sözleşmeden doğabilecek uyuşmazlıklarda Türkiye Cumhuriyeti yasaları geçerli olup, taraflar İstanbul Mahkemeleri'nin yetkili olduğunu kabul eder."
                    };
                    foreach (var madde in maddeler)
                    {
                        col.Item().PaddingTop(4).Text(madde).Justify();
                    }

                    col.Item().PaddingTop(25)
                        .Text("Bu sözleşme, 2. Taraf'ın sipariş onayı ile dijital olarak kabul edilmiştir.")
                        .Italic().FontColor(Colors.Grey.Darken1);

                    col.Item().PaddingTop(30).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("1. TARAF").Bold();
                            c.Item().PaddingTop(20).LineHorizontal(0.5f);
                            c.Item().PaddingTop(4).Text(info.Caterer.FullName).Italic();
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("2. TARAF").Bold();
                            c.Item().PaddingTop(20).LineHorizontal(0.5f);
                            c.Item().PaddingTop(4).Text(info.User.FullName).Italic();
                        });
                    });
                });

                page.Footer().AlignCenter().Column(c =>
                {
                    c.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
                    c.Item().PaddingTop(6)
                        .Text($"Sofranet © 2026 · Sözleşme No: {agreementNo}")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });
        return doc.GeneratePdf();
    }

    private static string StatusTr(string status) => status switch
    {
        "pending" => "Bekliyor",
        "preparing" => "Hazırlanıyor",
        "completed" => "Tamamlandı",
        "cancelled" => "İptal Edildi",
        _ => status
    };
}
