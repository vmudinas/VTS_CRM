using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace FAI.API.Data
{
    public class FAIContextFactory : IDesignTimeDbContextFactory<FAIContext>
    {
        public FAIContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<FAIContext>();

            // Configure the DbContext to use SQLite for design-time operations
            // This connection string should match the one used for SQLite in Program.cs
            optionsBuilder.UseSqlite("Data Source=FAIDev.db");

            return new FAIContext(optionsBuilder.Options);
        }
    }
}
