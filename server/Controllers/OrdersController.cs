using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FoldsAndFlavors.API.Data;
using FoldsAndFlavors.API.Data.Models;

namespace FoldsAndFlavors.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly FoldsAndFlavorsContext _context;

        public OrdersController(FoldsAndFlavorsContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> GetOrders()
        {
            var orders = await _context.Orders.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
                return NotFound(new { message = "Order not found" });
            return Ok(order);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (string.IsNullOrEmpty(request.CustomerName) || string.IsNullOrEmpty(request.CustomerEmail) || request.Items == null || !request.Items.Any())
                return BadRequest(new { message = "Customer name, email, and at least one item are required" });

            decimal totalAmount = 0;
            var validatedItems = new List<(Product Product, int Quantity)>();

            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                    return NotFound(new { message = $"Product with ID {item.ProductId} not found" });
                if (product.Quantity < item.Quantity)
                    return BadRequest(new { message = $"Insufficient quantity for product: {product.Name}" });

                validatedItems.Add((product, item.Quantity));
                totalAmount += product.Price * item.Quantity;
            }

            var order = new Order
            {
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerPhone = request.CustomerPhone,
                TotalAmount = totalAmount,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            foreach (var (product, qty) in validatedItems)
            {
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Price = product.Price,
                    Quantity = qty,
                    CreatedAt = DateTime.UtcNow
                };
                _context.OrderItems.Add(orderItem);
                product.Quantity -= qty;
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, new { id = order.Id, message = "Order created successfully" });
        }

        [HttpPut("{id}/status")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            if (string.IsNullOrEmpty(request.Status) || !new[] { "pending", "completed", "cancelled" }.Contains(request.Status))
                return BadRequest(new { message = "Valid status (pending, completed, cancelled) is required" });

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound(new { message = "Order not found" });

            order.Status = request.Status;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order status updated successfully" });
        }
    }

    public class CreateOrderRequest
    {
        public string CustomerName { get; set; } = null!;
        public string CustomerEmail { get; set; } = null!;
        public string? CustomerPhone { get; set; }
        public List<OrderItemDto> Items { get; set; } = null!;
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = null!;
    }
}
