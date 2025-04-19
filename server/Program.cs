using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using FoldsAndFlavors.API.Data;

var builder = WebApplication.CreateBuilder(args);

// JWT secret
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "your-secret-key";

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
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
}

// Configure middleware
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
