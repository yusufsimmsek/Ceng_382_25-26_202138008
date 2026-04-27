using Microsoft.EntityFrameworkCore;
using Sofranet.Data;
using Sofranet.Models;

namespace Sofranet.Helpers;

public static class OrderHelper
{
    public static async Task<FullOrderInfo?> FetchOrderFullAsync(ApplicationDbContext db, int orderId)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .Include(o => o.Caterer)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Items).ThenInclude(i => i.SelectedOptions)
                .ThenInclude(s => s.Option!).ThenInclude(opt => opt.Group)
            .Include(o => o.Items).ThenInclude(i => i.Removals)
                .ThenInclude(r => r.RemovableIngredient)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return null;
        if (order.User == null || order.Caterer == null) return null;

        var items = order.Items.Select(oi => new OrderItemDetail
        {
            Name = oi.MenuItem?.Name ?? "?",
            Quantity = oi.Quantity,
            BasePrice = oi.ItemPrice,
            CustomizationExtra = oi.CustomizationExtra,
            Unit = oi.ItemPrice + oi.CustomizationExtra,
            Subtotal = (oi.ItemPrice + oi.CustomizationExtra) * oi.Quantity,
            Options = oi.SelectedOptions.Select(s => new OrderOptionDetail
            {
                GroupName = s.Option?.Group?.Name ?? "",
                OptionName = s.Option?.Name ?? "",
                Extra = s.Option?.ExtraPrice ?? 0
            }).ToList(),
            Removals = oi.Removals
                .Select(r => r.RemovableIngredient?.Name ?? "")
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList()
        }).ToList();

        return new FullOrderInfo
        {
            Order = order,
            User = order.User,
            Caterer = order.Caterer,
            Items = items
        };
    }
}

public class FullOrderInfo
{
    public Order Order { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
    public ApplicationUser Caterer { get; set; } = null!;
    public List<OrderItemDetail> Items { get; set; } = new();
}

public class OrderItemDetail
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal BasePrice { get; set; }
    public decimal CustomizationExtra { get; set; }
    public decimal Unit { get; set; }
    public decimal Subtotal { get; set; }
    public List<OrderOptionDetail> Options { get; set; } = new();
    public List<string> Removals { get; set; } = new();
}

public class OrderOptionDetail
{
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public decimal Extra { get; set; }
}
