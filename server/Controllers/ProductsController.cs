using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.API.Data.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Linq;

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly FAIContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductsController(FAIContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.Products.OrderBy(p => p.Name).ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Policy = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateProduct()
        {
            var form = await Request.ReadFormAsync();
            string? name = form["name"].FirstOrDefault();
            string? priceString = form["price"].FirstOrDefault();
            string? category = form["category"].FirstOrDefault();
            string? quantityString = form["quantity"].FirstOrDefault();
            string? badge = form["badge"].FirstOrDefault();
            string? description = form["description"].FirstOrDefault();

            if (string.IsNullOrEmpty(name) || !decimal.TryParse(priceString, out var price) || string.IsNullOrEmpty(category))
            {
                return BadRequest(new { message = "Name, price, and category are required" });
            }

            int quantity = 0;
            if (!string.IsNullOrEmpty(quantityString) && !int.TryParse(quantityString, out quantity))
            {
                return BadRequest(new { message = "Quantity must be a number" });
            }

            // Handle image upload or URL
            var file = form.Files.FirstOrDefault(f => f.Name == "image");
            string imageUrl;
            if (file != null && file.Length > 0)
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var uploadsFolder = Path.Combine(webRoot, "uploads");
                Directory.CreateDirectory(uploadsFolder);
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);
                imageUrl = $"/uploads/{fileName}";
            }
            else
            {
                string? imageField = form["image"].FirstOrDefault();
                imageUrl = imageField!;
                if (string.IsNullOrEmpty(imageUrl))
                {
                    return BadRequest(new { message = "Image file or URL is required" });
                }
            }

            var product = new Product
            {
                Name = name,
                Price = price,
                Category = category,
                Quantity = quantity,
                Badge = string.IsNullOrEmpty(badge) ? null : badge,
                Description = string.IsNullOrEmpty(description) ? null : description,
                Image = imageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProduct(int id)
        {
            var form = await Request.ReadFormAsync();
            string? name = form["name"].FirstOrDefault();
            string? priceString = form["price"].FirstOrDefault();
            string? category = form["category"].FirstOrDefault();
            string? quantityString = form["quantity"].FirstOrDefault();
            string? badge = form["badge"].FirstOrDefault();
            string? description = form["description"].FirstOrDefault();

            if (string.IsNullOrEmpty(name) || !decimal.TryParse(priceString, out var price) || string.IsNullOrEmpty(category))
            {
                return BadRequest(new { message = "Name, price, and category are required" });
            }

            int quantity = 0;
            if (!string.IsNullOrEmpty(quantityString) && !int.TryParse(quantityString, out quantity))
            {
                return BadRequest(new { message = "Quantity must be a number" });
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            // Handle image upload or URL
            var file = form.Files.FirstOrDefault(f => f.Name == "image");
            var imageUrl = product.Image;
            if (file != null && file.Length > 0)
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var uploadsFolder = Path.Combine(webRoot, "uploads");
                Directory.CreateDirectory(uploadsFolder);
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);
                imageUrl = $"/uploads/{fileName}";
            }
            else
            {
                string? imageField = form["image"].FirstOrDefault();
                if (!string.IsNullOrEmpty(imageField))
                {
                    imageUrl = imageField!;
                }
            }

            product.Name = name;
            product.Price = price;
            product.Category = category;
            product.Quantity = quantity;
            product.Badge = string.IsNullOrEmpty(badge) ? null : badge;
            product.Description = string.IsNullOrEmpty(description) ? null : description;
            product.Image = imageUrl;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            var hasOrderItems = await _context.OrderItems.AnyAsync(oi => oi.ProductId == id);
            if (hasOrderItems)
                return BadRequest(new { message = "Cannot delete product as it is associated with existing orders" });

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.Select(c => c.Name).ToListAsync();
            return Ok(categories);
        }
    }
}
