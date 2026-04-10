using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sofranet.Models;

namespace Sofranet.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<MenuItem> MenuItems { get; set; } = null!;
    public DbSet<OptionGroup> OptionGroups { get; set; } = null!;
    public DbSet<MenuOption> MenuOptions { get; set; } = null!;
    public DbSet<RemovableIngredient> RemovableIngredients { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<OrderItemOption> OrderItemOptions { get; set; } = null!;
    public DbSet<OrderItemRemoval> OrderItemRemovals { get; set; } = null!;
    public DbSet<Rating> Ratings { get; set; } = null!;
    public DbSet<LogEntry> LogEntries { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // MenuItem -> ApplicationUser (Caterer)
        builder.Entity<MenuItem>()
            .HasOne(m => m.Caterer)
            .WithMany(u => u.MenuItems)
            .HasForeignKey(m => m.CatererId)
            .OnDelete(DeleteBehavior.Restrict);

        // OptionGroup -> MenuItem
        builder.Entity<OptionGroup>()
            .HasOne(og => og.MenuItem)
            .WithMany(m => m.OptionGroups)
            .HasForeignKey(og => og.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // MenuOption -> OptionGroup
        builder.Entity<MenuOption>()
            .HasOne(o => o.Group)
            .WithMany(g => g.Options)
            .HasForeignKey(o => o.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        // RemovableIngredient -> MenuItem
        builder.Entity<RemovableIngredient>()
            .HasOne(r => r.MenuItem)
            .WithMany(m => m.RemovableIngredients)
            .HasForeignKey(r => r.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order -> User (one-to-many)
        builder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Order -> Caterer (one-to-many) - cycle önlemek için Restrict
        builder.Entity<Order>()
            .HasOne(o => o.Caterer)
            .WithMany(u => u.CatererOrders)
            .HasForeignKey(o => o.CatererId)
            .OnDelete(DeleteBehavior.Restrict);

        // OrderItem -> Order (cascade)
        builder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // OrderItem -> MenuItem (restrict, snapshot mantığı)
        builder.Entity<OrderItem>()
            .HasOne(oi => oi.MenuItem)
            .WithMany()
            .HasForeignKey(oi => oi.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // OrderItemOption
        builder.Entity<OrderItemOption>()
            .HasOne(oio => oio.OrderItem)
            .WithMany(oi => oi.SelectedOptions)
            .HasForeignKey(oio => oio.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OrderItemOption>()
            .HasOne(oio => oio.Option)
            .WithMany()
            .HasForeignKey(oio => oio.OptionId)
            .OnDelete(DeleteBehavior.Restrict);

        // OrderItemRemoval
        builder.Entity<OrderItemRemoval>()
            .HasOne(oir => oir.OrderItem)
            .WithMany(oi => oi.Removals)
            .HasForeignKey(oir => oir.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OrderItemRemoval>()
            .HasOne(oir => oir.RemovableIngredient)
            .WithMany()
            .HasForeignKey(oir => oir.RemovableIngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        // Rating - Order one-to-one (unique)
        builder.Entity<Rating>()
            .HasOne(r => r.Order)
            .WithOne(o => o.Rating)
            .HasForeignKey<Rating>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Rating>()
            .HasIndex(r => r.OrderId)
            .IsUnique();

        // Rating'de iki ApplicationUser FK var (User + Caterer), NoAction kullan
        builder.Entity<Rating>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Rating>()
            .HasOne(r => r.Caterer)
            .WithMany()
            .HasForeignKey(r => r.CatererId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Rating>()
            .HasOne(r => r.MenuItem)
            .WithMany()
            .HasForeignKey(r => r.MenuItemId)
            .OnDelete(DeleteBehavior.SetNull);

        // LogEntry
        builder.Entity<LogEntry>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexler
        builder.Entity<LogEntry>().HasIndex(l => l.CreatedAt);
        builder.Entity<LogEntry>().HasIndex(l => l.Action);
        builder.Entity<Order>().HasIndex(o => o.Status);
        builder.Entity<Order>().HasIndex(o => o.CreatedAt);
    }
}
