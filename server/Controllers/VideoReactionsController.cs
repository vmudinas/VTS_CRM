using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.Data.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System.ComponentModel.DataAnnotations; // Add this using directive

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize] // Temporarily remove authorization for testing
    public class VideoReactionsController : ControllerBase
    {
        private readonly FAIContext _context;

        public VideoReactionsController(FAIContext context)
        {
            _context = context;
        }

        // Helper to get the current authenticated user's ID (or placeholder if auth is off)
        private int GetCurrentUserId()
        {
             // In a real app, this would get the authenticated user ID from claims.
             // For now, we'll use the userId sent in the request body for testing without full auth.
             // This is INSECURE and for development only.
             // With [Authorize], you would use:
             // var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
             // if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
             // {
             //     throw new UnauthorizedAccessException("User ID not found in claims.");
             // }
             // return userId;

             // Placeholder for development without auth:
             // Expect userId in the request body for POST.
             // For GET, the action method will handle getting userId from query params.
             throw new NotImplementedException("GetCurrentUserId should not be called directly without proper authentication. User ID should be handled in action methods based on auth status.");
        }

        // POST: api/VideoReactions
        // Adds or updates a user's reaction (like/dislike) to a video
        [HttpPost]
        // [Authorize] // Temporarily remove authorization for testing
        public async Task<IActionResult> AddOrUpdateReaction([FromBody] VideoReactionRequest request)
        {
            // In a real app with [Authorize], get userId from claims:
            // var userId = GetCurrentUserId();

            // For development without [Authorize], get userId from request body (INSECURE):
            if (request.UserId == 0) // Assuming 0 is not a valid user ID
            {
                 return Unauthorized(new { message = "User ID is required." }); // Or BadRequest
            }
            var userId = request.UserId;

            // Check if the video exists
            var videoExists = await _context.Videos.AnyAsync(v => v.Id == request.VideoId);
            if (!videoExists)
            {
                return NotFound(new { message = "Video not found." });
            }

            // Find existing reaction for this user and video
            var existingReaction = await _context.VideoReactions
                .FirstOrDefaultAsync(vr => vr.UserId == userId && vr.VideoId == request.VideoId);

            if (existingReaction == null)
            {
                // No existing reaction, create a new one
                var newReaction = new VideoReaction
                {
                    UserId = userId,
                    VideoId = request.VideoId,
                    Type = request.Type,
                    CreatedAt = DateTime.UtcNow
                };
                _context.VideoReactions.Add(newReaction);
            }
            else
            {
                // Existing reaction found
                if (existingReaction.Type == request.Type)
                {
                    // Same reaction type, user is un-reacting (e.g., unliking a liked video)
                    _context.VideoReactions.Remove(existingReaction);
                }
                else
                {
                    // Different reaction type, update the reaction (e.g., changing like to dislike)
                    existingReaction.Type = request.Type;
                    existingReaction.CreatedAt = DateTime.UtcNow; // Update timestamp
                    _context.VideoReactions.Update(existingReaction);
                }
            }

            await _context.SaveChangesAsync();

            // Optionally, return the updated reaction state or counts
            // For simplicity, we'll just return success for now
            return Ok(new { message = "Reaction updated successfully." });
        }

        // GET: api/VideoReactions/{videoId}
        // Gets the current user's reaction for a specific video
        [HttpGet("{videoId}")]
        // [Authorize] // Temporarily remove authorization for testing
        public async Task<ActionResult<VideoReaction?>> GetUserReaction(int videoId, [FromQuery] int userId) // Get userId from query param for GET
        {
            // In a real app with [Authorize], get userId from claims:
            // var userId = GetCurrentUserId();

            // For development without [Authorize], get userId from query param (INSECURE):
             if (userId == 0) // Assuming 0 is not a valid user ID
            {
                 return Unauthorized(new { message = "User ID is required." }); // Or BadRequest
            }
            // userId is already available from [FromQuery]

            var reaction = await _context.VideoReactions
                .FirstOrDefaultAsync(vr => vr.UserId == userId && vr.VideoId == videoId);

            if (reaction == null)
            {
                // Return 204 No Content if no reaction found
                return NoContent();
            }

            return Ok(reaction);
        }

        // DTO for incoming reaction requests
        public class VideoReactionRequest
        {
            [Required]
            public int VideoId { get; set; }
            [Required]
            public ReactionType Type { get; set; } // Use the enum
            // Include UserId in the request body for development without auth (INSECURE)
            [Required]
            public int UserId { get; set; }
        }
    }
}
