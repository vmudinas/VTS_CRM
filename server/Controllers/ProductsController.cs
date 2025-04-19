using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FoldsAndFlavors.API.Data;
using FoldsAndFlavors.API.Data.Models;

namespace FoldsAndFlavors.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly FoldsAndFlavorsContext _context;

        public ProductsController(FoldsAndFlavorsContext context)
        {
            _context = context;
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
        public async Task<IActionResult> CreateProduct([FromBody] Product product)
        {
            if (string.IsNullOrEmpty(product.Name) || product.Price <= 0 || string.IsNullOrEmpty(product.Image) || string.IsNullOrEmpty(product.Category))
            {
                return BadRequest(new { message = "Name, price, image, and category are required" });
            }

            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product updated)
        {
            if (string.IsNullOrEmpty(updated.Name) || updated.Price <= 0 || string.IsNullOrEmpty(updated.Image) || string.IsNullOrEmpty(updated.Category))
            {
                return BadRequest(new { message = "Name, price, image, and category are required" });
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Name = updated.Name;
            product.Price = updated.Price;
            product.Image = updated.Image;
            product.Badge = updated.Badge;
            product.Description = updated.Description;
            product.Category = updated.Category;
            product.Quantity = updated.Quantity;
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
    }
}
