using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using FAI.API.Data;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
// Force Kestrel to listen on HTTP port 5003 for local testing (ports 5001/5002 may be in use)
builder.WebHost.UseUrls("http://0.0.0.0:4000");

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

// Configure database context: in Development always use in-memory; in Production require explicit SQL credentials
var dbServerEnv = Environment.GetEnvironmentVariable("DB_SERVER");
var dbUserEnv = Environment.GetEnvironmentVariable("DB_USER");
var dbPasswordEnv = Environment.GetEnvironmentVariable("DB_PASSWORD");
// Always attempt to use SQL Server if credentials are provided, regardless of environment
if (!string.IsNullOrWhiteSpace(dbServerEnv)
    && !string.IsNullOrWhiteSpace(dbUserEnv)
    && !string.IsNullOrWhiteSpace(dbPasswordEnv))
{
    var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "FAI";
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "1433";
    var connectionString = $"Server={dbServerEnv},{dbPort};Database={dbName};User Id={dbUserEnv};Password={dbPasswordEnv};TrustServerCertificate=True;";
    builder.Services.AddDbContext<FAIContext>(options =>
        options.UseSqlServer(connectionString));
}
else
{
    // Fallback to SQLite database if SQL credentials are missing
    builder.Services.AddDbContext<FAIContext>(options =>
        options.UseSqlite("Data Source=FAIDev.db"));
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
   .AddJwtBearer(options =>
   {
       // Force use of JwtSecurityTokenHandler instead of default JsonWebTokenHandler (ASP.NET Core 8+)
       // Clear and add to TokenHandlers which is used by default
       options.TokenHandlers.Clear();
       options.TokenHandlers.Add(new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler());
       options.RequireHttpsMetadata = false;
       options.SaveToken = true;
       // Log token events to help diagnose 401s
       options.Events = new JwtBearerEvents
       {
           OnMessageReceived = ctx =>
           {
               Console.WriteLine($"[JWT] OnMessageReceived: Authorization header='{ctx.Request.Headers["Authorization"]}'");
               return Task.CompletedTask;
           },
           OnAuthenticationFailed = ctx =>
           {
               Console.WriteLine($"[JWT] Authentication failed: {ctx.Exception.Message}");
               return Task.CompletedTask;
           },
           OnTokenValidated = ctx =>
           {
               Console.WriteLine($"[JWT] Token validated for issuer '{ctx.Principal.Identity.Name}'");
               return Task.CompletedTask;
           }
       };
       options.TokenValidationParameters = new TokenValidationParameters
       {
           ValidateIssuer = false,
           ValidateAudience = false,
           ValidateIssuerSigningKey = true,
           // Use derived signing key bytes
           IssuerSigningKey = new SymmetricSecurityKey(signingKeyBytes),
           // Disable lifetime validation for development tokens
           ValidateLifetime = false,
           RequireExpirationTime = false
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
 builder.Services.AddSwaggerGen(c =>
 {
     // Configure Swagger document
     c.SwaggerDoc("v1", new OpenApiInfo { Title = "FAI API", Version = "v1" });
     // Define the Bearer auth scheme
     c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
     {
         Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
         Name = "Authorization",
         In = ParameterLocation.Header,
         Type = SecuritySchemeType.Http,
         Scheme = "bearer",
         BearerFormat = "JWT"
     });
     // Require Bearer token for all operations
     c.AddSecurityRequirement(new OpenApiSecurityRequirement
     {
         {
             new OpenApiSecurityScheme
             {
                 Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
             },
             new string[] { }
         }
     });
 });
 // Enable CORS for development (allow any origin, header, and method)
 builder.Services.AddCors(options =>
 {
     options.AddPolicy("AllowAll", policy =>
         policy.AllowAnyOrigin()
               .AllowAnyHeader()
               .AllowAnyMethod());
 });

var app = builder.Build();
// Ensure uploads directory exists for file uploads
{
    var webRoot = app.Environment.WebRootPath
        ?? (app.Environment.ContentRootPath != null
            ? System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot")
            : throw new InvalidOperationException("Both WebRootPath and ContentRootPath are null."));
    var uploadsFolder = System.IO.Path.Combine(webRoot, "uploads");
    System.IO.Directory.CreateDirectory(uploadsFolder);
}

// Apply database initialization: use Migrate for relational, EnsureCreated for in-memory
// Moved database initialization and seeding to a separate method to avoid interference with integration tests
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<FAIContext>();
//     // Use relational migrations when supported, else create in-memory database
//     if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
//     {
//         // Reset in-memory database on each run to ensure seeding runs
//         context.Database.EnsureDeleted();
//         context.Database.EnsureCreated();
//     }
//     else
//     {
//         // Check if the database exists and can be connected to.
//         // If not, Migrate() will create it and apply migrations.
//         // If it exists, Migrate() will only apply pending migrations.
//         // This handles the "Database already exists" error on subsequent runs.
//         try
//         {
//             // Attempt to connect and apply migrations
//             context.Database.Migrate();
//         }
//         catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 1801)
//         {
//             // Handle the "Database 'FAI' already exists" error specifically
//             Console.WriteLine($"Database 'FAI' already exists. Skipping initial creation attempt.");
//             // The application should continue as Migrate() would have already
//             // checked for and applied pending migrations if the database was accessible.
//         }
//         catch (Exception ex)
//         {
//             // Log other potential database connection/migration errors
//             Console.WriteLine($"An error occurred while applying migrations: {ex.Message}");
//             throw; // Re-throw the exception if it's not the "database exists" error
//         }
//     }

//     // Seed default admin user: use env vars or fallback to known credentials
//     var adminUsernameEnv = Environment.GetEnvironmentVariable("ADMIN_USERNAME");
//     var adminPasswordEnv = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
//     // In Development ignore ADMIN_USERNAME/PASSWORD env vars and always seed fallback default
//     if (!app.Environment.IsDevelopment()
//         && !string.IsNullOrEmpty(adminUsernameEnv)
//         && !string.IsNullOrEmpty(adminPasswordEnv))
//     {
//         if (!context.Users.Any(u => u.Username == adminUsernameEnv))
//         {
//             context.Users.Add(new FAI.API.Data.Models.User
//             {
//                 Username = adminUsernameEnv,
//                 Password = FAI.API.Utils.PasswordHasher.Hash(adminPasswordEnv),
//                 IsAdmin = true,
//                 CreatedAt = DateTime.UtcNow,
//                 UpdatedAt = DateTime.UtcNow
//             });
//             context.SaveChanges();
//         }
//     }
//     else
//     {
//         // Fallback default admin: username=admin, password=letmein123 (stored as plain-text for development)
//         const string defaultUser = "admin";
//         const string defaultPass = "letmein123";
//         if (!context.Users.Any())
//         {
//             context.Users.Add(new FAI.API.Data.Models.User
//             {
//                 Username = defaultUser,
//                 // Store plain-text for development-only fallback to simplify login
//                 Password = defaultPass,
//                 IsAdmin = true,
//                 CreatedAt = DateTime.UtcNow,
//                 UpdatedAt = DateTime.UtcNow
//             });
//             context.SaveChanges();
//         }
//     }
//     // Debug: log all users in database
//     foreach (var u in context.Users)
//     {
//         Console.WriteLine($"[SEED] User: {u.Username ?? "null"}, PasswordHash: {u.Password ?? "null"}, IsAdmin: {u.IsAdmin}");
//     }
// }

// Moved database initialization and seeding to a separate method to avoid interference with integration tests
// Only initialize the database if not in the IntegrationTesting environment
if (app.Environment.EnvironmentName != "IntegrationTesting")
{
    InitializeDatabase(app);
}

// Separate method for database initialization and seeding
void InitializeDatabase(IApplicationBuilder applicationBuilder)
{
    using (var scope = applicationBuilder.ApplicationServices.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<FAIContext>();
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>(); // Get IWebHostEnvironment

        // Use relational migrations when supported, else create in-memory database
        if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            // Reset in-memory database on each run to ensure seeding runs
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
        }
        else
        {
            // Check if the database exists and can be connected to.
            // If not, Migrate() will create it and apply migrations.
            // If it exists, Migrate() will only apply pending migrations.
            // This handles the "Database already exists" error on subsequent runs.
            try
            {
                // Attempt to connect and apply migrations
                context.Database.Migrate();
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 1801)
            {
                // Handle the "Database 'FAI' already exists" error specifically
                Console.WriteLine($"Database 'FAI' already exists. Skipping initial creation attempt.");
                // The application should continue as Migrate() would have already
                // checked for and applied pending migrations if the database was accessible.
            }
            catch (Exception ex)
            {
                // Log other potential database connection/migration errors
                Console.WriteLine($"An error occurred while applying migrations: {ex.Message}");
                throw; // Re-throw the exception if it's not the "database exists" error
            }
        }

        // Seed default admin user: use env vars or fallback to known credentials
        var adminUsernameEnv = Environment.GetEnvironmentVariable("ADMIN_USERNAME");
        var adminPasswordEnv = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        // In Development ignore ADMIN_USERNAME/PASSWORD env vars and always seed fallback default
        if (!env.IsDevelopment() // Use env.IsDevelopment()
            && !string.IsNullOrEmpty(adminUsernameEnv)
            && !string.IsNullOrEmpty(adminPasswordEnv))
        {
            if (!context.Users.Any(u => u.Username == adminUsernameEnv))
            {
                context.Users.Add(new FAI.API.Data.Models.User
                {
                    Username = adminUsernameEnv,
                    Password = FAI.API.Utils.PasswordHasher.Hash(adminPasswordEnv),
                    IsAdmin = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }
        }
        else
        {
            // Fallback default admin: username=admin, password=letmein123 (stored as plain-text for development)
            const string defaultUser = "admin";
            const string defaultPass = "letmein123";
            if (!context.Users.Any())
            {
                context.Users.Add(new FAI.API.Data.Models.User
                {
                    Username = defaultUser,
                    // Store plain-text for development-only fallback to simplify login
                    Password = defaultPass,
                    IsAdmin = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }
        }
        // Debug: log all users in database
        foreach (var u in context.Users)
        {
            Console.WriteLine($"[SEED] User: {u.Username ?? "null"}, PasswordHash: {u.Password ?? "null"}, IsAdmin: {u.IsAdmin}");
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
        var dbContext = context.RequestServices.GetRequiredService<FAIContext>();
        var stackTrace = new System.Diagnostics.StackTrace(ex, true);
        var frame = stackTrace.GetFrames()?.FirstOrDefault();
        var fileName = frame?.GetFileName();
        var methodName = frame?.GetMethod()?.Name;
        var exceptionLog = new FAI.API.Data.Models.ExceptionLog
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
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FAI API V1");
});

// Serve React UI from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Serve uploaded files from the /uploads path
app.UseStaticFiles(new StaticFileOptions
{
    RequestPath = "/uploads",
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        System.IO.Path.Combine(app.Environment.WebRootPath, "uploads"))
});

// Enable CORS middleware
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to serve SPA
app.MapFallbackToFile("index.html");

app.Run();

// Entry point for integration tests
public partial class Program { }
