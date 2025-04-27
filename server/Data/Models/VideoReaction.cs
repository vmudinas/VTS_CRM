using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FAI.API.Data.Models; // Assuming User model is here

namespace FAI.Data.Models
{
    public class VideoReaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int VideoId { get; set; }

        [Required]
        public ReactionType Type { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("VideoId")]
        public Video Video { get; set; } = null!;
    }

    public enum ReactionType
    {
        Like,
        Dislike
    }
}
