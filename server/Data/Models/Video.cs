using System.ComponentModel.DataAnnotations;

namespace FAI.Data.Models
{
    public class Video
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string VideoPath { get; set; } = string.Empty;

        [Required]
        public string ThumbnailPath { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
