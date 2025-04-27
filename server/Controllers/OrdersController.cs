using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.API.Data.Models;
using FAI.API.Services.Bitcoin; // Added using directive
using NBitcoin; // Added using directive for Network type

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly FAIContext _context;
        private readonly BitcoinWalletService _bitcoinWalletService; // Added BitcoinWalletService field

        public OrdersController(FAIContext context, BitcoinWalletService bitcoinWalletService) // Added BitcoinWalletService to constructor
        {
            _context = context;
            _bitcoinWalletService = bitcoinWalletService; // Assign the injected service
        }

        [HttpGet]
        // Allow public or authenticated users to view orders (removed strict JWT guard)
        [AllowAnonymous]
        public async Task<IActionResult> GetOrders()
        {
            var orders = await _context.Orders.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        // Allow public or authenticated users to view order details (removed strict JWT guard)
        [AllowAnonymous]
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
        [Authorize]
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

        /// <summary>
        /// Generates a Bitcoin address for a pending order.
        /// </summary>
        /// <param name="id">The ID of the order.</param>
        /// <returns>The generated Bitcoin address and amount.</returns>
        [HttpPost("{id}/generate-bitcoin-payment")]
        [AllowAnonymous] // Or apply appropriate authorization
        public async Task<IActionResult> GenerateBitcoinPayment(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            // Ensure the order is in a state ready for payment (e.g., "pending")
            if (order.Status != "pending")
            {
                return BadRequest(new { message = $"Order status is '{order.Status}', cannot generate Bitcoin payment." });
            }

            // TODO: Get current Bitcoin price (USD to BTC) from a reliable source
            // For now, using a placeholder conversion rate.
            decimal currentBitcoinPriceUsd = 70000; // Example: 1 BTC = 70000 USD
            if (currentBitcoinPriceUsd <= 0)
            {
                 return StatusCode(500, new { message = "Unable to retrieve current Bitcoin price." });
            }

            // Calculate the required Bitcoin amount
            // Use a high precision for the conversion
            decimal requiredBitcoinAmount = order.TotalAmount / currentBitcoinPriceUsd;

            // Generate a new Bitcoin address for this order
            // Using order ID as the index for deterministic address generation
            string bitcoinAddress = _bitcoinWalletService.GenerateNewAddress(order.Id);

            // Update the order with Bitcoin payment details
            order.BitcoinAddress = bitcoinAddress;
            order.BitcoinAmount = requiredBitcoinAmount;
            order.Status = "WaitingForBitcoinPayment"; // New status
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { bitcoinAddress = bitcoinAddress, bitcoinAmount = requiredBitcoinAmount });
        }

        /// <summary>
        /// Receives webhook notifications for confirmed Bitcoin payments.
        /// </summary>
        /// <param name="request">The webhook request containing payment details.</param>
        /// <returns>An IActionResult indicating the result of the operation.</returns>
        /// <summary>
        /// Receives webhook notifications for confirmed Bitcoin payments.
        /// </summary>
        /// <param name="request">The webhook request containing payment details.</param>
        /// <returns>An IActionResult indicating the result of the operation.</returns>
        [HttpPost("bitcoin-payment-webhook")]
        [AllowAnonymous] // Webhooks typically don't require authentication, but should be secured otherwise (e.g., shared secret)
        public async Task<IActionResult> ReceiveBitcoinPaymentWebhook() // Read body manually for signature verification
        {
            // Implement webhook signature verification for security
            if (string.IsNullOrEmpty(_webhookSecret))
            {
                Console.WriteLine("Webhook secret is not configured. Skipping signature verification.");
                // Depending on security requirements, you might return Unauthorized here
                // return Unauthorized();
            }
            else
            {
                // Get the signature from the header
                Request.Headers.TryGetValue("X-Hook-Signature", out var signatureHeader);
                var receivedSignature = signatureHeader.FirstOrDefault();

                if (string.IsNullOrEmpty(receivedSignature))
                {
                    Console.WriteLine("Webhook received without signature header.");
                    return Unauthorized(); // Signature is required
                }

                // Read the raw request body
                Request.EnableBuffering(); // Allow reading the body multiple times
                using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
                {
                    var rawBody = await reader.ReadToEndAsync();
                    Request.Body.Position = 0; // Reset stream position for model binding

                    // Compute the expected signature
                    var secretBytes = Encoding.UTF8.GetBytes(_webhookSecret);
                    var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

                    using (var hmac = new HMACSHA256(secretBytes))
                    {
                        var computedHash = hmac.ComputeHash(bodyBytes);
                        var computedSignature = BitConverter.ToString(computedHash).Replace("-", "").ToLowerInvariant();

                        // Compare signatures (case-insensitive)
                        if (!string.Equals(computedSignature, receivedSignature, StringComparison.OrdinalIgnoreCase))
                        {
                            Console.WriteLine($"Webhook signature mismatch. Received: {receivedSignature}, Computed: {computedSignature}");
                            return Unauthorized(); // Signature mismatch
                        }
                    }
                }
            }

            // Now that the signature is verified (or skipped if secret is missing),
            // deserialize the request body into the BitcoinPaymentWebhookRequest object.
            // Use System.Text.Json for deserialization.
            BitcoinPaymentWebhookRequest request;
            try
            {
                request = await System.Text.Json.JsonSerializer.DeserializeAsync<BitcoinPaymentWebhookRequest>(
                    Request.Body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
            }
            catch (System.Text.Json.JsonException ex)
            {
                Console.WriteLine($"Error deserializing webhook request: {ex.Message}");
                return BadRequest(new { message = "Invalid webhook data format." });
            }


            if (request == null || request.OrderId <= 0 || string.IsNullOrEmpty(request.TransactionId) || request.Amount <= 0 || request.Confirmations < 0)
            {
                Console.WriteLine("Invalid webhook data after deserialization.");
                return BadRequest(new { message = "Invalid webhook data." });
            }

            var order = await _context.Orders.FindAsync(request.OrderId);
            if (order == null)
            {
                // Log this, but return 200 OK to avoid webhook service retries on non-existent order
                Console.WriteLine($"Webhook received for non-existent Order ID: {request.OrderId}");
                return Ok();
            }

            // Check if the order is waiting for Bitcoin payment
            if (order.Status != "WaitingForBitcoinPayment")
            {
                 // Log this, but return 200 OK
                 Console.WriteLine($"Webhook received for Order ID: {request.OrderId} with status '{order.Status}', expected 'WaitingForBitcoinPayment'.");
                 return Ok();
            }

            // Check if the received amount matches the required amount (allowing for small variations if necessary)
            // Using decimal.Equals for exact match, consider tolerance for real-world scenarios
            if (order.BitcoinAmount == null || !decimal.Equals(request.Amount, order.BitcoinAmount.Value))
            {
                 // Log this, but return 200 OK
                 Console.WriteLine($"Webhook received for Order ID: {request.OrderId} with amount mismatch. Expected: {order.BitcoinAmount}, Received: {request.Amount}");
                 return Ok();
            }

            // Check for required confirmations
            if (request.Confirmations >= 6) // Using the planned 6 confirmations
            {
                order.Status = "BitcoinPaid"; // New status for confirmed payment
                order.UpdatedAt = DateTime.UtcNow;
                // Store transaction ID if needed
                // order.BitcoinTransactionId = request.TransactionId;

                await _context.SaveChangesAsync();

                Console.WriteLine($"Order ID: {request.OrderId} marked as BitcoinPaid with {request.Confirmations} confirmations.");

                return Ok(); // Indicate successful processing
            }
            else
            {
                // Payment detected but not enough confirmations yet.
                // We might update the order status to indicate partial confirmation or just log it.
                // For now, just log and return OK.
                Console.WriteLine($"Webhook received for Order ID: {request.OrderId}. Payment detected but only {request.Confirmations} confirmations.");
                return Ok();
            }
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

    /// <summary>
    /// Request body for the Bitcoin payment webhook.
    /// </summary>
    public class BitcoinPaymentWebhookRequest
    {
        public int OrderId { get; set; }
        public string TransactionId { get; set; } = null!;
        public decimal Amount { get; set; }
        public int Confirmations { get; set; }
    }

    // Request class for generating Bitcoin payment (if needed, currently not used in endpoint signature)
    // public class GenerateBitcoinPaymentRequest
    // {
    //     // Any specific request parameters could go here
    // }
}
