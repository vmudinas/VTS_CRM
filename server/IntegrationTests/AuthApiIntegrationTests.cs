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

namespace FAI.IntegrationTests
{
    public class AuthApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public AuthApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            // Ensure a valid JWT secret for signing tokens in tests
            Environment.SetEnvironmentVariable("JWT_SECRET", "abcdefghijklmnopqrstuvwxyzABCDEFG");
            _client = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<FAIContext>));
                    if (descriptor != null) services.Remove(descriptor);
                    services.AddDbContext<FAIContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb");
                    });

                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<FAIContext>();
                    context.Database.EnsureDeleted();
                    context.Database.EnsureCreated();
                    context.Users.Add(new User { Id = 1, Username = "user1", Password = "pass1", IsAdmin = false });
                    context.SaveChanges();
                });
            }).CreateClient();
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