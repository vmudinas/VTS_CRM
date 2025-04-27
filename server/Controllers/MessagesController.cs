using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.API.Data.Models;

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly FAIContext _context;

        public MessagesController(FAIContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetMessages()
        {
            var messages = await _context.ContactMessages.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return Ok(messages);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetMessage(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return NotFound(new { message = "Message not found" });

            message.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(message);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMessage([FromBody] CreateMessageRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Message))
                return BadRequest(new { message = "Name, email, and message are required" });

            var contactMessage = new ContactMessage
            {
                Name = request.Name,
                Email = request.Email,
                Subject = request.Subject,
                Message = request.Message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.ContactMessages.Add(contactMessage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMessage), new { id = contactMessage.Id }, new { id = contactMessage.Id, message = "Message sent successfully" });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return NotFound(new { message = "Message not found" });

            _context.ContactMessages.Remove(message);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Message deleted successfully" });
        }
    }

    public class CreateMessageRequest
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Subject { get; set; }
        public string Message { get; set; } = null!;
    }
}
