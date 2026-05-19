using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

// AuthService in db bağlantısı
public class AuthDbContext : DbContext
{
    // Constractor
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    // AppUser entitysi için db table kullanılıyor
    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(x => x.UserId);   // primary key

            entity.Property(x => x.UserName)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(x => x.UserName)
                .IsUnique();    // aynı kullanıcı adıyla iki kullanıcı olamaz

            entity.Property(x => x.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(x => x.RecordDate)
                .IsRequired();
        });
    }
}