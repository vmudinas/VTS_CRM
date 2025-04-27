using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FAI.API.Data;

namespace FAI.IntegrationTests
{
    public class DatabaseIntegrationTests
    {
        private FAIContext CreateContext()
        {
            var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? "localhost";
            var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "1433";
            var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "FAI";
            var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
            var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Kla1peda17!";
            var connectionString =
                $"Server={dbServer},{dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;";
            var optionsBuilder = new DbContextOptionsBuilder<FAIContext>();
            optionsBuilder.UseSqlServer(connectionString);
            return new FAIContext(optionsBuilder.Options);
        }

        [Fact(Skip = "Requires SQL Server instance; skipped in non-containerized environments")]
        public void CanConnectToDatabase()
        {
            using var context = CreateContext();
            // Recreate database and schema
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            Assert.True(context.Database.CanConnect());
        }

        [Fact(Skip = "Requires SQL Server instance; skipped in non-containerized environments")]
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