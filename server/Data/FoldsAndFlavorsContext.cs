using Microsoft.EntityFrameworkCore;
using FoldsAndFlavors.API.Data.Models;

namespace FoldsAndFlavors.API.Data
{
    public class FoldsAndFlavorsContext : DbContext
    {
        public FoldsAndFlavorsContext(DbContextOptions<FoldsAndFlavorsContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<ContactMessage> ContactMessages { get; set; } = null!;
        public DbSet<ExceptionLog> ExceptionLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Product>().ToTable("Products");
            modelBuilder.Entity<Order>().ToTable("Orders");
            modelBuilder.Entity<OrderItem>().ToTable("OrderItems");
            modelBuilder.Entity<ContactMessage>().ToTable("ContactMessages");

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>().Property(u => u.CreatedAt).HasDefaultValueSql("GETDATE()");
            modelBuilder.Entity<User>().Property(u => u.UpdatedAt).HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<Product>().Property(p => p.CreatedAt).HasDefaultValueSql("GETDATE()");
            modelBuilder.Entity<Product>().Property(p => p.UpdatedAt).HasDefaultValueSql("GETDATE()");

            modelBuilder.Entity<Order>().Property(o => o.CreatedAt).HasDefaultValueSql("GETDATE()");
            modelBuilder.Entity<Order>().Property(o => o.UpdatedAt).HasDefaultValueSql("GETDATE()");
            modelBuilder.Entity<Order>().Property(o => o.Status).HasDefaultValue("pending");

            modelBuilder.Entity<ContactMessage>().Property(m => m.CreatedAt).HasDefaultValueSql("GETDATE()");
            modelBuilder.Entity<ExceptionLog>().ToTable("ExceptionLogs");
            modelBuilder.Entity<ExceptionLog>().Property(e => e.Timestamp).HasDefaultValueSql("GETDATE()");
        }
    }
}
