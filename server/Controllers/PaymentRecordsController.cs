using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using FAI.API.Data;
using FAI.API.Data.Models;
using System.Net;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentRecordsController : ControllerBase
    {
        private readonly FAIContext _context;
        private readonly ILogger<PaymentRecordsController> _logger;

        public PaymentRecordsController(
            FAIContext context,
            ILogger<PaymentRecordsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/PaymentRecords
        [HttpGet]
        public async Task<IActionResult> GetPaymentRecords()
        {
            var records = await Task.FromResult(_context.PaymentRecords.ToList());
            return Ok(records);
        }

        // GET: api/PaymentRecords/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentRecord(int id)
        {
            var paymentRecord = await Task.FromResult(_context.PaymentRecords.Find(id));

            if (paymentRecord == null)
            {
                return NotFound();
            }

            return Ok(paymentRecord);
        }

        // POST: api/PaymentRecords
        [HttpPost]
        public async Task<IActionResult> CreatePaymentRecord([FromBody] PaymentRecordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                
                var paymentRecord = new PaymentRecord
                {
                    PaymentType = request.PaymentType,
                    Amount = request.Amount,
                    Description = request.Description,
                    OrderId = request.OrderId,
                    UserId = request.UserId,
                    UserName = request.UserName,
                    UserEmail = request.UserEmail,
                    Status = request.Status ?? "pending",
                    IpAddress = ipAddress,
                    ProcessedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.PaymentRecords.Add(paymentRecord);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPaymentRecord), new { id = paymentRecord.Id }, paymentRecord);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating payment record");
                return StatusCode(500, "An error occurred while processing your request");
            }
        }

        // PUT: api/PaymentRecords/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] PaymentStatusUpdateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var paymentRecord = await Task.FromResult(_context.PaymentRecords.Find(id));

            if (paymentRecord == null)
            {
                return NotFound();
            }

            try
            {
                paymentRecord.Status = request.Status;
                paymentRecord.UpdatedAt = DateTime.UtcNow;
                
                if (request.Status == "completed" || request.Status == "success")
                {
                    paymentRecord.ProcessedAt = DateTime.UtcNow;
                }

                _context.PaymentRecords.Update(paymentRecord);
                await _context.SaveChangesAsync();

                return Ok(paymentRecord);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating payment record");
                return StatusCode(500, "An error occurred while processing your request");
            }
        }
    }

    public class PaymentRecordRequest
    {
        public string PaymentType { get; set; } = null!;
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public int? OrderId { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public string? Status { get; set; }
    }

    public class PaymentStatusUpdateRequest
    {
        public string Status { get; set; } = null!;
    }
}