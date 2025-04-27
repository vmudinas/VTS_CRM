using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FAI.API.Data.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Required, MaxLength(255)]
        public string Image { get; set; } = null!;

        [MaxLength(50)]
        public string? Badge { get; set; }

        public string? Description { get; set; }

        [Required, MaxLength(50)]
        public string Category { get; set; } = null!;

        public int Quantity { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
