using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; // Keep using directive for now, will remove attribute
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.Data.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.ComponentModel.DataAnnotations; // Add this using directive

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize] // Temporarily remove authorization for testing
    public class PlaybackHistoryController : ControllerBase
    {
        private readonly FAIContext _context;

        public PlaybackHistoryController(FAIContext context)
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
             // Expect userId in the request body for POST, or figure out from context for GET if possible (less reliable without auth)
             // For GET, we'll rely on the frontend sending the user ID in the request body for now (not standard REST, but works for this temp setup)
             // A better temporary solution might be to pass userId as a query parameter for GET
             // Let's assume for GET, the frontend will pass userId as a query param ?userId=...
             // For POST, it's in the body.
             // This helper is primarily for the POST scenario where userId is in the body.
             // For GET, the action method will handle getting userId from query params.
             throw new NotImplementedException("GetCurrentUserId should not be called directly without proper authentication. User ID should be handled in action methods based on auth status.");
        }


        // POST: api/PlaybackHistory
        // Saves or updates a user's playback position for a video
        [HttpPost]
        // [Authorize] // Temporarily remove authorization for testing
        public async Task<IActionResult> SavePlaybackPosition([FromBody] PlaybackHistoryRequest request)
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

            // Find existing history entry for this user and video
            var existingHistory = await _context.PlaybackHistory
                .FirstOrDefaultAsync(ph => ph.UserId == userId && ph.VideoId == request.VideoId);

            if (existingHistory == null)
            {
                // No existing history, create a new one
                var newHistory = new PlaybackHistory
                {
                    UserId = userId,
                    VideoId = request.VideoId,
                    PositionSeconds = request.PositionSeconds,
                    WatchedAt = DateTime.UtcNow
                };
                _context.PlaybackHistory.Add(newHistory);
            }
            else
            {
                // Existing history found, update the position and timestamp
                existingHistory.PositionSeconds = request.PositionSeconds;
                existingHistory.WatchedAt = DateTime.UtcNow;
                _context.PlaybackHistory.Update(existingHistory);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Playback position saved successfully." });
        }

        // GET: api/PlaybackHistory/{videoId}
        // Gets the current user's last watched position for a specific video
        [HttpGet("{videoId}")]
        // [Authorize] // Temporarily remove authorization for testing
        public async Task<ActionResult<PlaybackHistory?>> GetPlaybackPosition(int videoId, [FromQuery] int userId) // Get userId from query param for GET
        {
            // In a real app with [Authorize], get userId from claims:
            // var userId = GetCurrentUserId();

            // For development without [Authorize], get userId from query param (INSECURE):
             if (userId == 0) // Assuming 0 is not a valid user ID
            {
                 return Unauthorized(new { message = "User ID is required." }); // Or BadRequest
            }
            // userId is already available from [FromQuery]


            var history = await _context.PlaybackHistory
                .FirstOrDefaultAsync(ph => ph.UserId == userId && ph.VideoId == videoId);

            if (history == null)
            {
                // Return 204 No Content if no history found
                return NoContent();
            }

            return Ok(history);
        }

        // DTO for incoming playback history requests
        public class PlaybackHistoryRequest
        {
            [Required]
            public int VideoId { get; set; }
            [Required]
            public double PositionSeconds { get; set; }
            // Include UserId in the request body for development without auth (INSECURE)
            [Required]
            public int UserId { get; set; }
        }
    }
}
