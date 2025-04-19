using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FoldsAndFlavors.API.Controllers;
using FoldsAndFlavors.API.Data;
using FoldsAndFlavors.API.Data.Models;

namespace FoldsAndFlavors.IntegrationTests
{
    public class AuthControllerUnitTests
    {
        static AuthControllerUnitTests()
        {
            // Ensure strong JWT secret for tests
            Environment.SetEnvironmentVariable("JWT_SECRET", "abcdefghijklmnopqrstuvwxyzABCDEFG");
        }
        private FoldsAndFlavorsContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<FoldsAndFlavorsContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var context = new FoldsAndFlavorsContext(options);
            context.Users.Add(new User
            {
                Id = 1,
                Username = "user1",
                Password = "pass1",
                IsAdmin = false
            });
            context.SaveChanges();
            return context;
        }

        [Fact]
        public async Task Login_MissingUsernameOrPassword_ReturnsBadRequest()
        {
            using var context = GetInMemoryContext();
            var controller = new AuthController(context);
            var result = await controller.Login(new AuthController.LoginRequest { Username = "", Password = "" });
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("required", badRequest.Value.ToString());
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            using var context = GetInMemoryContext();
            var controller = new AuthController(context);
            var result = await controller.Login(new AuthController.LoginRequest { Username = "user1", Password = "wrong" });
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsTokenAndUser()
        {
            using var context = GetInMemoryContext();
            var controller = new AuthController(context);
            var result = await controller.Login(new AuthController.LoginRequest { Username = "user1", Password = "pass1" });
            var okResult = Assert.IsType<OkObjectResult>(result);
            var value = okResult.Value;
            var tokenProp = value.GetType().GetProperty("token");
            Assert.NotNull(tokenProp);
            var token = tokenProp.GetValue(value) as string;
            Assert.False(string.IsNullOrEmpty(token));
            var userProp = value.GetType().GetProperty("user");
            Assert.NotNull(userProp);
            var userValue = userProp.GetValue(value);
            var idProp = userValue.GetType().GetProperty("id");
            var usernameProp = userValue.GetType().GetProperty("username");
            var isAdminProp = userValue.GetType().GetProperty("isAdmin");
            Assert.Equal(1, idProp.GetValue(userValue));
            Assert.Equal("user1", usernameProp.GetValue(userValue));
            Assert.Equal(false, isAdminProp.GetValue(userValue));
        }
    }
}