using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using FoldsAndFlavors.API.Data;

var builder = WebApplication.CreateBuilder(args);

// JWT secret (must be >256 bits if using fallback default)
var defaultJwtSecret = "abcdefghijklmnopqrstuvwxyzABCDEFG"; // 33 chars, 264 bits
var envJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
// Determine JWT secret and derive a fixed-length key (256-bit) for HS256
var jwtSecret = !string.IsNullOrWhiteSpace(envJwtSecret)
    ? envJwtSecret
    : defaultJwtSecret;
// Derive signing key bytes by hashing the secret (SHA-256 produces 32 bytes)
using var _sha = System.Security.Cryptography.SHA256.Create();
var signingKeyBytes = _sha.ComputeHash(Encoding.UTF8.GetBytes(jwtSecret));

// Database connection parameters
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Kla1peda17!";
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? "db";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "FoldsAndFlavors";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "1433";

var connectionString = $"Server={dbServer},{dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;";

// Add services
builder.Services.AddDbContext<FoldsAndFlavorsContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
            // Use derived signing key bytes
            IssuerSigningKey = new SymmetricSecurityKey(signingKeyBytes),
        ValidateLifetime = true,
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireClaim("isAdmin", "True"));
});

// Add controllers and use Newtonsoft.Json for formatting
builder.Services.AddControllers()
       .AddNewtonsoftJson();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Apply database initialization: use Migrate for relational, EnsureCreated for in-memory
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FoldsAndFlavorsContext>();
    // Use relational migrations when supported, else create in-memory database
    if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
    {
        context.Database.EnsureCreated();
    }
    else
    {
        context.Database.Migrate();
    }

    // Seed default admin user if configured via environment variables
    var adminUsername = Environment.GetEnvironmentVariable("ADMIN_USERNAME");
    var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
    if (!string.IsNullOrEmpty(adminUsername) && !string.IsNullOrEmpty(adminPassword))
    {
        // Check if the admin user already exists
        if (!context.Users.Any(u => u.Username == adminUsername))
        {
            // Create and add the admin user with hashed password
            context.Users.Add(new FoldsAndFlavors.API.Data.Models.User
            {
                Username = adminUsername,
                Password = FoldsAndFlavors.API.Utils.PasswordHasher.Hash(adminPassword),
                IsAdmin = true
            });
            context.SaveChanges();
        }
    }
}

// Configure middleware
// Global exception logging middleware: catch and log exceptions to database
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var dbContext = context.RequestServices.GetRequiredService<FoldsAndFlavorsContext>();
        var stackTrace = new System.Diagnostics.StackTrace(ex, true);
        var frame = stackTrace.GetFrames()?.FirstOrDefault();
        var fileName = frame?.GetFileName();
        var methodName = frame?.GetMethod()?.Name;
        var exceptionLog = new FoldsAndFlavors.API.Data.Models.ExceptionLog
        {
            FileName = fileName,
            MethodName = methodName,
            Message = ex.Message,
            InnerMessage = ex.InnerException?.Message,
            Timestamp = DateTime.UtcNow
        };
        dbContext.ExceptionLogs.Add(exceptionLog);
        dbContext.SaveChanges();
        throw;
    }
});
// Enable Swagger middleware for API documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FoldsAndFlavors API V1");
});

// Serve React UI from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to serve SPA
app.MapFallbackToFile("index.html");

app.Run();

// Entry point for integration tests
public partial class Program { }
