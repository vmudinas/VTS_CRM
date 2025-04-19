using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FoldsAndFlavors.API.Data;

namespace FoldsAndFlavors.IntegrationTests
{
    public class DatabaseIntegrationTests
    {
        private FoldsAndFlavorsContext CreateContext()
        {
            var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? "localhost";
            var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "1433";
            var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "FoldsAndFlavors";
            var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
            var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Kla1peda17!";
            var connectionString =
                $"Server={dbServer},{dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;";
            var optionsBuilder = new DbContextOptionsBuilder<FoldsAndFlavorsContext>();
            optionsBuilder.UseSqlServer(connectionString);
            return new FoldsAndFlavorsContext(optionsBuilder.Options);
        }

        [Fact]
        public void CanConnectToDatabase()
        {
            using var context = CreateContext();
            // Recreate database and schema
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            Assert.True(context.Database.CanConnect());
        }

        [Fact]
        public void UsersTableAccessible()
        {
            using var context = CreateContext();
            // Recreate database and schema
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            // Simple query to ensure table exists without error
            _ = context.Users.Take(1).ToList();
        }
    }
}