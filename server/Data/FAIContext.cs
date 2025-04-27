using Microsoft.EntityFrameworkCore;
using FAI.API.Data.Models;
using FAI.Data.Models;

namespace FAI.API.Data
{
    public class FAIContext : DbContext
    {
        public FAIContext(DbContextOptions<FAIContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<ContactMessage> ContactMessages { get; set; } = null!;
        public DbSet<ExceptionLog> ExceptionLogs { get; set; } = null!;
        public DbSet<Video> Videos { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<PlaybackHistory> PlaybackHistory { get; set; } = null!; // Add DbSet for PlaybackHistory
        public DbSet<VideoReaction> VideoReactions { get; set; } = null!; // Add DbSet for VideoReaction

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Category>().ToTable("Categories");
            modelBuilder.Entity<Product>().ToTable("Products");
            modelBuilder.Entity<Order>().ToTable("Orders");
            modelBuilder.Entity<OrderItem>().ToTable("OrderItems");
            modelBuilder.Entity<ContactMessage>().ToTable("ContactMessages");
            modelBuilder.Entity<Video>().ToTable("Videos");
            modelBuilder.Entity<PlaybackHistory>().ToTable("PlaybackHistory"); // Map PlaybackHistory to table
            modelBuilder.Entity<VideoReaction>().ToTable("VideoReactions"); // Map VideoReaction to table

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure relationships for PlaybackHistory
            modelBuilder.Entity<PlaybackHistory>()
                .HasOne(ph => ph.User)
                .WithMany() // Assuming User doesn't have a direct collection of PlaybackHistory
                .HasForeignKey(ph => ph.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Delete history if user is deleted

            modelBuilder.Entity<PlaybackHistory>()
                .HasOne(ph => ph.Video)
                .WithMany() // Assuming Video doesn't have a direct collection of PlaybackHistory
                .HasForeignKey(ph => ph.VideoId)
                .OnDelete(DeleteBehavior.Cascade); // Delete history if video is deleted

            // Configure relationships for VideoReaction
            modelBuilder.Entity<VideoReaction>()
                .HasOne(vr => vr.User)
                .WithMany() // Assuming User doesn't have a direct collection of VideoReactions
                .HasForeignKey(vr => vr.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Delete reactions if user is deleted

            modelBuilder.Entity<VideoReaction>()
                .HasOne(vr => vr.Video)
                .WithMany() // Assuming Video doesn't have a direct collection of VideoReactions
                .HasForeignKey(vr => vr.VideoId)
                .OnDelete(DeleteBehavior.Cascade); // Delete reactions if video is deleted

            // Ensure unique reaction entry per user and video
            modelBuilder.Entity<VideoReaction>()
                .HasIndex(vr => new { vr.UserId, vr.VideoId })
                .IsUnique();

            // Ensure unique history entry per user and video
            modelBuilder.Entity<PlaybackHistory>()
                .HasIndex(ph => new { ph.UserId, ph.VideoId })
                .IsUnique();

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
