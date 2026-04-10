using CampusFlow.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusFlow.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<CampusUser> Users => Set<CampusUser>();
    public DbSet<Club> Clubs => Set<Club>();
    public DbSet<CampusEvent> Events => Set<CampusEvent>();
    public DbSet<UserEvent> UserEvents => Set<UserEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CampusUser>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<CampusEvent>()
            .HasOne(campusEvent => campusEvent.Club)
            .WithMany(club => club.Events)
            .HasForeignKey(campusEvent => campusEvent.ClubId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CampusEvent>()
            .HasOne(campusEvent => campusEvent.CreatedBy)
            .WithMany(user => user.CreatedEvents)
            .HasForeignKey(campusEvent => campusEvent.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserEvent>()
            .HasIndex(userEvent => new { userEvent.UserId, userEvent.EventId })
            .IsUnique();

        modelBuilder.Entity<UserEvent>()
            .HasOne(userEvent => userEvent.User)
            .WithMany(user => user.JoinedEvents)
            .HasForeignKey(userEvent => userEvent.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserEvent>()
            .HasOne(userEvent => userEvent.Event)
            .WithMany(campusEvent => campusEvent.Participants)
            .HasForeignKey(userEvent => userEvent.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
