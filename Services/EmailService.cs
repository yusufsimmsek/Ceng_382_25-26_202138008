using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using Sofranet.Helpers;
using Sofranet.Models;

namespace Sofranet.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private bool IsConfigured()
    {
        var host = _config["Smtp:Host"];
        var user = _config["Smtp:User"];
        var pass = _config["Smtp:Pass"];
        return !string.IsNullOrWhiteSpace(host)
            && !string.IsNullOrWhiteSpace(user)
            && !string.IsNullOrWhiteSpace(pass);
    }

    private async Task<bool> SendAsync(string toEmail, string toName, string subject, string htmlBody, string textBody)
    {
        if (!IsConfigured())
        {
            _logger.LogWarning("SMTP config eksik, email atlandi: {Subject}", subject);
            return false;
        }
        try
        {
            var msg = new MimeMessage();
            msg.From.Add(new MailboxAddress(
                _config["Smtp:FromName"] ?? "Sofranet",
                _config["Smtp:FromEmail"] ?? _config["Smtp:User"]!));
            msg.To.Add(new MailboxAddress(toName, toEmail));
            msg.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody, TextBody = textBody };
            msg.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            var port = int.Parse(_config["Smtp:Port"] ?? "587");
            var secure = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

            await smtp.ConnectAsync(_config["Smtp:Host"]!, port, secure);
            await smtp.AuthenticateAsync(_config["Smtp:User"]!, _config["Smtp:Pass"]!);
            await smtp.SendAsync(msg);
            await smtp.DisconnectAsync(true);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email gonderim hatasi: {Subject}", subject);
            return false;
        }
    }

    private static string ItemRowsHtml(List<OrderItemDetail> items)
    {
        var sb = new StringBuilder();
        foreach (var it in items)
        {
            sb.Append("<tr><td style='padding:8px;border-bottom:1px solid #eee'>");
            sb.Append($"{it.Quantity} x <b>{System.Net.WebUtility.HtmlEncode(it.Name)}</b>");
            if (it.Options.Any())
            {
                sb.Append("<br><small style='color:#666'>");
                sb.Append(string.Join(", ", it.Options.Select(o =>
                    System.Net.WebUtility.HtmlEncode($"{o.GroupName}: {o.OptionName}"))));
                sb.Append("</small>");
            }
            if (it.Removals.Any())
            {
                sb.Append("<br><small style='color:#666'>Çıkarıldı: ");
                sb.Append(string.Join(", ", it.Removals.Select(System.Net.WebUtility.HtmlEncode)));
                sb.Append("</small>");
            }
            sb.Append($"</td><td style='padding:8px;text-align:right;border-bottom:1px solid #eee'>₺{it.Subtotal:0.00}</td></tr>");
        }
        return sb.ToString();
    }

    private static string WrapEmail(string title, string body)
    {
        return $@"<!DOCTYPE html>
<html><body style='font-family:Arial,sans-serif;background:#FFF8F0;padding:20px;margin:0'>
<div style='max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)'>
<div style='background:linear-gradient(135deg,#E63946,#B5232E);color:white;padding:24px;text-align:center'>
<h1 style='margin:0;font-size:28px'>🍽️ Sofranet</h1>
<div style='opacity:0.9;font-size:14px;margin-top:4px'>{title}</div>
</div>
<div style='padding:24px'>{body}</div>
<div style='background:#f8f9fa;padding:16px;text-align:center;color:#999;font-size:12px'>
Sofranet © 2026 · Bu otomatik gönderilen bir bildirimdir.
</div>
</div></body></html>";
    }

    public Task<bool> SendOrderConfirmationToUserAsync(FullOrderInfo info)
    {
        var body = $@"
<p>Merhaba <b>{System.Net.WebUtility.HtmlEncode(info.User.FullName)}</b>,</p>
<p>Siparişin başarıyla alındı. Detaylar aşağıda:</p>
<table style='width:100%;border-collapse:collapse;margin:16px 0'>
<tr><td style='padding:6px;color:#666'>Sipariş No:</td><td style='padding:6px'><b>#{info.Order.Id}</b></td></tr>
<tr><td style='padding:6px;color:#666'>Restoran:</td><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(info.Caterer.FullName)}</td></tr>
<tr><td style='padding:6px;color:#666'>Tarih:</td><td style='padding:6px'>{info.Order.CreatedAt:dd.MM.yyyy HH:mm}</td></tr>
<tr><td style='padding:6px;color:#666'>Teslimat:</td><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(info.Order.DeliveryAddress ?? "-")}</td></tr>
</table>
<h3>Sipariş İçeriği</h3>
<table style='width:100%;border-collapse:collapse'>{ItemRowsHtml(info.Items)}
<tr><td style='padding:12px;font-size:18px;font-weight:bold'>Toplam</td>
<td style='padding:12px;text-align:right;font-size:18px;font-weight:bold;color:#E63946'>₺{info.Order.TotalAmount:0.00}</td></tr>
</table>
<p style='margin-top:24px;color:#666;font-size:14px'>Afiyet olsun!</p>";

        var text = $"Sofranet - Sipariş #{info.Order.Id} alındı. Toplam: ₺{info.Order.TotalAmount:0.00}";
        return SendAsync(
            info.User.Email!,
            info.User.FullName,
            $"Sofranet - Sipariş #{info.Order.Id} alındı",
            WrapEmail("Siparişin Alındı", body),
            text);
    }

    public Task<bool> SendOrderNotificationToCatererAsync(FullOrderInfo info)
    {
        var appUrl = _config["AppUrl"] ?? "http://localhost:5099";
        var body = $@"
<p>Merhaba <b>{System.Net.WebUtility.HtmlEncode(info.Caterer.FullName)}</b>,</p>
<p>Yeni bir siparişin var!</p>
<table style='width:100%;border-collapse:collapse;margin:16px 0'>
<tr><td style='padding:6px;color:#666'>Sipariş No:</td><td style='padding:6px'><b>#{info.Order.Id}</b></td></tr>
<tr><td style='padding:6px;color:#666'>Müşteri:</td><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(info.User.FullName)} ({System.Net.WebUtility.HtmlEncode(info.User.Email!)})</td></tr>
<tr><td style='padding:6px;color:#666'>Telefon:</td><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(info.User.PhoneNumber ?? "-")}</td></tr>
<tr><td style='padding:6px;color:#666'>Tarih:</td><td style='padding:6px'>{info.Order.CreatedAt:dd.MM.yyyy HH:mm}</td></tr>
<tr><td style='padding:6px;color:#666'>Teslimat:</td><td style='padding:6px'>{System.Net.WebUtility.HtmlEncode(info.Order.DeliveryAddress ?? "-")}</td></tr>
</table>
<h3>Sipariş İçeriği</h3>
<table style='width:100%;border-collapse:collapse'>{ItemRowsHtml(info.Items)}
<tr><td style='padding:12px;font-size:18px;font-weight:bold'>Toplam</td>
<td style='padding:12px;text-align:right;font-size:18px;font-weight:bold;color:#E63946'>₺{info.Order.TotalAmount:0.00}</td></tr>
</table>
<p style='margin-top:24px'>
<a href='{appUrl}/Caterer/Orders' style='display:inline-block;background:#E63946;color:white;padding:12px 24px;border-radius:6px;text-decoration:none'>Siparişi Görüntüle</a>
</p>";

        var text = $"Sofranet - Yeni sipariş #{info.Order.Id} - {info.User.FullName}";
        return SendAsync(
            info.Caterer.Email!,
            info.Caterer.FullName,
            $"Sofranet - Yeni Sipariş #{info.Order.Id}",
            WrapEmail("Yeni Sipariş", body),
            text);
    }

    public Task<bool> SendTwoFactorCodeAsync(ApplicationUser user, string code)
    {
        var body = $@"
<p>Merhaba <b>{System.Net.WebUtility.HtmlEncode(user.FullName)}</b>,</p>
<p>Hesabına giriş için doğrulama kodun:</p>
<div style='background:#FFF8F0;border:2px solid #E63946;border-radius:12px;padding:24px;text-align:center;margin:20px 0'>
<div style='font-size:2.5rem;font-family:monospace;font-weight:700;letter-spacing:8px;color:#E63946'>{code}</div>
</div>
<p style='color:#666;font-size:14px'>Bu kod 5 dakika içinde geçerliliğini yitirecek.</p>";

        return SendAsync(
            user.Email!,
            user.FullName,
            "Sofranet - Doğrulama Kodun",
            WrapEmail("İki Adımlı Doğrulama", body),
            $"Doğrulama kodun: {code}");
    }
}
