using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Xunit;
using FAI.API.Controllers;
using FAI.API.Data;
using FAI.API.Data.Models;

namespace FAI.IntegrationTests
{
    public class ProductsControllerUnitTests
    {
        [Fact]
        public async Task CreateProduct_MissingFormFields_ReturnsBadRequest()
        {
            // Arrange: in-memory context
            var options = new DbContextOptionsBuilder<FAIContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var context = new FAIContext(options);
            // Fake environment
            var env = new FakeEnv();
            var controller = new ProductsController(context, env)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };
            // Simulate empty multipart form
            controller.HttpContext.Request.ContentType = "multipart/form-data";
            controller.HttpContext.Request.Form = new FormCollection(new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>());

            // Act
            var result = await controller.CreateProduct();

            // Assert: should be BadRequest with expected message
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Name, price, and category are required", badRequest.Value.ToString());
        }

        // Minimal fake environment for testing
        private class FakeEnv : IWebHostEnvironment
        {
            public string WebRootPath { get; set; } = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot");
            public IFileProvider WebRootFileProvider { get; set; } = null;
            public string ContentRootPath { get; set; } = System.IO.Directory.GetCurrentDirectory();
            public IFileProvider ContentRootFileProvider { get; set; } = null;
            public string ApplicationName { get; set; }
            public string EnvironmentName { get; set; }
        }
    }
}