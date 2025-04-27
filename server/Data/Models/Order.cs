using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FAI.API.Data.Models
{
    public class Order
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string CustomerName { get; set; } = null!;

        [Required, MaxLength(100)]
        public string CustomerEmail { get; set; } = null!;

        [MaxLength(20)]
        public string? CustomerPhone { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required, MaxLength(20)]
        public string Status { get; set; } = "pending";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // New fields for Bitcoin payment
        public string? BitcoinAddress { get; set; }
        [Column(TypeName = "decimal(18,8)")] // Use appropriate precision for BTC
        public decimal? BitcoinAmount { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
