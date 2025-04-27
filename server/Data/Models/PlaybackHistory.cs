using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FAI.API.Data.Models; // Add this using directive

namespace FAI.Data.Models
{
    public class PlaybackHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int VideoId { get; set; }

        [Required]
        public double PositionSeconds { get; set; }

        public DateTime WatchedAt { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("VideoId")]
        public Video Video { get; set; } = null!;
    }
}
