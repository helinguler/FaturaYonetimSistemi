using CustomerService.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Data;

// Customer modelinin dbde nasıl bir table a dönüşeceğini anlatır
public class CustomerDbContext : DbContext
{
    // Constractor
    public CustomerDbContext(DbContextOptions<CustomerDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();    // dbdeki customer table

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");

            entity.HasKey(x => x.CustomerId);   // primary key

            entity.Property(x => x.TaxNumber)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(x => x.Address)
                .HasMaxLength(500);

            entity.Property(x => x.EMail)
                .HasMaxLength(150);

            entity.Property(x => x.UserId)  // müşterinin hangi kullanıcıya ait olduğunu belirtir
                .IsRequired();

            entity.Property(x => x.RecordDate)
                .IsRequired();

            entity.HasIndex(x => x.UserId); // dbde aramaları hızlandırmak için

            // aynı kullanıcı aynı vergi numarasıyla iki kez müşteri ekleyemez
            entity.HasIndex(x => new { x.UserId, x.TaxNumber })
                .IsUnique();    
        });
    }
}