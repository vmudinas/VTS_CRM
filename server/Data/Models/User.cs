using System;
using System.ComponentModel.DataAnnotations;

namespace FAI.API.Data.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string Username { get; set; } = null!;

        [Required, MaxLength(100)]
        public string Password { get; set; } = null!;

        [Required]
        public bool IsAdmin { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Set default value
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Set default value
    }
}
