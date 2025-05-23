using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using FAI.API.Data;
using FAI.API.Data.Models;
using FAI.API.Utils; // Added using directive for PasswordHasher
using Microsoft.AspNetCore.Hosting; // Added using directive for UseContentRoot
using Microsoft.AspNetCore.TestHost; // Added using directive for ConfigureTestServices

namespace FAI.IntegrationTests
{
    public class AuthApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public AuthApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            // Ensure a valid JWT secret for signing tokens in tests
            Environment.SetEnvironmentVariable("JWT_SECRET", "abcdefghijklmnopqrstuvwxyzABCDEFG");

            // Explicitly set the content root for the WebApplicationFactory
            var projectDir = "/home/shared/dev/foldsandflavors/my-store/server"; // Path to the FAI.API project directory
            factory.WithWebHostBuilder(builder =>
            {
                builder.UseContentRoot(projectDir);
                builder.UseEnvironment("IntegrationTesting"); // Set a custom environment for integration tests
                builder.ConfigureTestServices(services =>
                {
                    // Find and remove the existing FAIContext service descriptor
                    var contextDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(FAIContext));
                    if (contextDescriptor != null)
                    {
                        services.Remove(contextDescriptor);
                    }

                    // Add FAIContext using InMemoryDatabase for testing
                    services.AddTransient<FAIContext>(sp =>
                    {
                        var options = new DbContextOptionsBuilder<FAIContext>()
                            .UseInMemoryDatabase("TestDbForAuth") // Use a unique name for the in-memory database
                            .Options;
                        return new FAIContext(options);
                    });

                    // Build the service provider
                    var sp = services.BuildServiceProvider();

                    // Create a scope to obtain a DbContext instance
                    using (var scope = sp.CreateScope())
                    {
                        var scopedServices = scope.ServiceProvider;
                        var context = scopedServices.GetRequiredService<FAIContext>();

                        // Ensure the database is created and seeded
                        Console.WriteLine("Ensuring database is deleted...");
                        context.Database.EnsureDeleted(); // Start with a clean database for each test run
                        Console.WriteLine("Ensuring database is created...");
                        context.Database.EnsureCreated();
                        Console.WriteLine("Database ensured.");

                        // Seed test data
                        // Ensure test user 'user1' is always seeded for this test fixture
                        Console.WriteLine("Seeding test user 'user1'...");
                        // Hash the password before storing it
                        var hashedPasswordForTestSetup = PasswordHasher.Hash("pass1"); // Renamed variable
                        context.Users.Add(new User { Id = 1, Username = "user1", Password = hashedPasswordForTestSetup, IsAdmin = false }); // Use renamed variable
                        context.SaveChanges();
                        Console.WriteLine("Test user 'user1' seeded.");
                    }
                });
            });

            _client = factory.CreateClient(); // Keep this line to assign the HttpClient
        }

        [Fact]
        public async Task Login_MissingFields_ReturnsBadRequest()
        {
            var request = new { Username = "", Password = "" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/auth/login", content);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            var request = new { Username = "user1", Password = "wrong" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/auth/login", content);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsTokenAndUser()
        {
            var request = new { Username = "user1", Password = "pass1" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/auth/login", content);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("token", out _));
            Assert.True(doc.RootElement.TryGetProperty("user", out var userElement));
            Assert.Equal(1, userElement.GetProperty("id").GetInt32());
            Assert.Equal("user1", userElement.GetProperty("username").GetString());
            Assert.False(userElement.GetProperty("isAdmin").GetBoolean());
        }
    }
}
