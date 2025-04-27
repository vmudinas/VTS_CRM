using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FAI.API.Data;
using FAI.Data.Models;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideosController : ControllerBase
    {
        private readonly FAIContext _context;
        private readonly IWebHostEnvironment _env;

        public VideosController(FAIContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/videos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Video>>> GetVideos()
        {
            return await _context.Videos.OrderByDescending(v => v.UploadedAt).ToListAsync();
        }

        // GET: api/videos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Video>> GetVideo(int id)
        {
            var video = await _context.Videos.FindAsync(id);
            if (video == null)
                return NotFound();
            return video;
        }

        // POST: api/videos (Admin only)
        [HttpPost]
        [Authorize(Policy = "Admin")]
        [RequestSizeLimit(500_000_000)] // 500MB max
        public async Task<IActionResult> UploadVideo([FromForm] VideoUploadDto dto)
        {
            // Debug: log received files for troubleshooting
            Console.WriteLine("[DEBUG] --- Media Upload Form Fields ---");
            foreach (var key in Request.Form.Keys)
            {
                Console.WriteLine($"[DEBUG] Field: {key} = {Request.Form[key]}");
            }
            foreach (var file in Request.Form.Files)
            {
                Console.WriteLine($"[DEBUG] Received file: {file.Name}, ContentType: {file.ContentType}, FileName: {file.FileName}, Length: {file.Length}");
            }

            // Validate required fields
            if (dto.VideoFile == null || dto.VideoFile.Length == 0)
                return BadRequest("Media file is required.");

            // Allowed media types (video and audio)
            var allowedMediaTypes = new[] {
                "video/mp4", "video/quicktime", // Video
                "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm" // Audio
            };
            var allowedMediaExts = new[] {
                ".mp4", ".mov", // Video
                ".mp3", ".wav", ".ogg", ".aac", ".webm" // Audio
            };

            var fileContentType = dto.VideoFile.ContentType.ToLowerInvariant();
            var fileExt = Path.GetExtension(dto.VideoFile.FileName).ToLowerInvariant();

            if (!allowedMediaTypes.Contains(fileContentType) && !allowedMediaExts.Contains(fileExt))
            {
                return BadRequest("Only MP4, MOV, MP3, WAV, OGG, AAC, and WebM media files are supported.");
            }

            if (dto.VideoFile.Length > 500_000_000)
                return BadRequest("Media file is too large (max 500MB).");

            // Save media file
            var mediaDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "media");
            Directory.CreateDirectory(mediaDir);
            var mediaFileName = $"{Guid.NewGuid()}{fileExt}";
            var mediaPath = Path.Combine(mediaDir, mediaFileName);
            using (var stream = new FileStream(mediaPath, FileMode.Create))
            {
                await dto.VideoFile.CopyToAsync(stream);
            }

            // Save thumbnail/cover image file (if provided)
            string thumbnailFileName;
            string thumbnailPath;
            if (dto.ThumbnailFile != null && dto.ThumbnailFile.Length > 0)
            {
                var thumbExt = Path.GetExtension(dto.ThumbnailFile.FileName);
                if (!thumbExt.Equals(".jpg", StringComparison.OrdinalIgnoreCase) && !thumbExt.Equals(".jpeg", StringComparison.OrdinalIgnoreCase) && !thumbExt.Equals(".png", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Thumbnail must be a JPG or PNG image.");
                thumbnailFileName = $"{Guid.NewGuid()}{thumbExt}";
                thumbnailPath = Path.Combine(mediaDir, thumbnailFileName); // Save thumbnails in the same media directory
                using (var stream = new FileStream(thumbnailPath, FileMode.Create))
                {
                    await dto.ThumbnailFile.CopyToAsync(stream);
                }
            }
            else
            {
                // Use a default placeholder thumbnail based on media type
                if (fileContentType.StartsWith("video/"))
                {
                     thumbnailFileName = "default-video-thumbnail.png"; // Assuming you have this
                }
                else // audio
                {
                     thumbnailFileName = "default-audio-thumbnail.png"; // Assuming you have this
                }
                 thumbnailPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "images", thumbnailFileName);
                 if (!System.IO.File.Exists(thumbnailPath))
                 {
                     // Optionally, generate a blank PNG if not present
                     // For simplicity, we'll just use an empty string if default is missing
                     thumbnailPath = "";
                     thumbnailFileName = "";
                 } else {
                     thumbnailPath = $"/images/{thumbnailFileName}";
                 }
            }

            // Store metadata in DB
            var video = new Video // Keeping Video model name for now
            {
                Title = dto.Title,
                Description = dto.Description ?? "",
                Category = dto.Category ?? "",
                VideoPath = $"/media/{mediaFileName}", // Use media directory
                ThumbnailPath = string.IsNullOrWhiteSpace(thumbnailFileName) ? "" : (thumbnailPath.StartsWith("/images/") ? thumbnailPath : $"/media/{thumbnailFileName}"), // Use media directory for uploaded thumbnails
                UploadedAt = DateTime.UtcNow
            };
            _context.Videos.Add(video);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVideo), new { id = video.Id }, video);
        }

        // PUT: api/videos/{id} (Admin only)
        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        [RequestSizeLimit(500_000_000)] // 500MB max
        public async Task<IActionResult> EditVideo(int id, [FromForm] VideoEditDto dto)
        {
            var video = await _context.Videos.FindAsync(id);
            if (video == null)
                return NotFound();

            // Update metadata
            if (!string.IsNullOrWhiteSpace(dto.Title))
                video.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Description))
                video.Description = dto.Description;
            if (!string.IsNullOrWhiteSpace(dto.Category))
                video.Category = dto.Category;

            var mediaDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "media");
            Directory.CreateDirectory(mediaDir); // Ensure media directory exists

            // Replace media file if provided
            if (dto.VideoFile != null && dto.VideoFile.Length > 0)
            {
                 var allowedMediaTypes = new[] {
                    "video/mp4", "video/quicktime", // Video
                    "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm" // Audio
                };
                var allowedMediaExts = new[] {
                    ".mp4", ".mov", // Video
                    ".mp3", ".wav", ".ogg", ".aac", ".webm" // Audio
                };

                var fileContentType = dto.VideoFile.ContentType.ToLowerInvariant();
                var fileExt = Path.GetExtension(dto.VideoFile.FileName).ToLowerInvariant();

                if (!allowedMediaTypes.Contains(fileContentType) && !allowedMediaExts.Contains(fileExt))
                {
                    return BadRequest("Only MP4, MOV, MP3, WAV, OGG, AAC, and WebM media files are supported.");
                }
                if (dto.VideoFile.Length > 500_000_000)
                    return BadRequest("Media file is too large (max 500MB).");

                // Delete old media file
                var oldMediaPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), video.VideoPath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(oldMediaPath))
                    System.IO.File.Delete(oldMediaPath);

                // Save new media file
                var mediaFileName = $"{Guid.NewGuid()}{fileExt}";
                var mediaPath = Path.Combine(mediaDir, mediaFileName);
                using (var stream = new FileStream(mediaPath, FileMode.Create))
                {
                    await dto.VideoFile.CopyToAsync(stream);
                }
                video.VideoPath = $"/media/{mediaFileName}"; // Update path
            }

            // Replace thumbnail/cover image if provided
            if (dto.ThumbnailFile != null && dto.ThumbnailFile.Length > 0)
            {
                var thumbExt = Path.GetExtension(dto.ThumbnailFile.FileName);
                if (!thumbExt.Equals(".jpg", StringComparison.OrdinalIgnoreCase) && !thumbExt.Equals(".jpeg", StringComparison.OrdinalIgnoreCase) && !thumbExt.Equals(".png", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Thumbnail must be a JPG or PNG image.");

                // Delete old thumbnail file (if not default)
                if (!string.IsNullOrWhiteSpace(video.ThumbnailPath) && !video.ThumbnailPath.StartsWith("/images/default-")) // Check if it's a default thumbnail
                {
                    var oldThumbPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), video.ThumbnailPath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldThumbPath))
                        System.IO.File.Delete(oldThumbPath);
                }

                // Save new thumbnail
                var thumbnailFileName = $"{Guid.NewGuid()}{thumbExt}";
                var thumbnailPath = Path.Combine(mediaDir, thumbnailFileName); // Save thumbnails in the media directory
                using (var stream = new FileStream(thumbnailPath, FileMode.Create))
                {
                    await dto.ThumbnailFile.CopyToAsync(stream);
                }
                video.ThumbnailPath = $"/media/{thumbnailFileName}"; // Update path
            }

            await _context.SaveChangesAsync();
            return Ok(video);
        }

        // DELETE: api/videos/{id} (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> DeleteVideo(int id)
        {
            var video = await _context.Videos.FindAsync(id);
            if (video == null)
                return NotFound();

            // Delete media file (video or audio)
            var mediaPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), video.VideoPath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (System.IO.File.Exists(mediaPath))
                System.IO.File.Delete(mediaPath);

            // Delete thumbnail/cover image file (if not default)
            if (!string.IsNullOrWhiteSpace(video.ThumbnailPath) && !video.ThumbnailPath.StartsWith("/images/default-")) // Check if it's a default thumbnail
            {
                var thumbPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), video.ThumbnailPath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(thumbPath))
                    System.IO.File.Delete(thumbPath);
            }

            _context.Videos.Remove(video);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // DTOs for upload/edit
    public class VideoUploadDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public IFormFile VideoFile { get; set; } = null!; // Renamed to MediaFile conceptually
        public IFormFile? ThumbnailFile { get; set; } // Renamed to CoverImageFile conceptually
    }

    public class VideoEditDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public IFormFile? VideoFile { get; set; } // Renamed to MediaFile conceptually
        public IFormFile? ThumbnailFile { get; set; } // Renamed to CoverImageFile conceptually
    }
}
