using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FAI.API.Data.Models
{
    public class PaymentRecord
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentType { get; set; } = null!; // bitcoin, applePay, paypal, zelle, etc.

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [MaxLength(100)]
        public string? Description { get; set; } // what the payment was for (order, donation, etc.)

        public int? OrderId { get; set; } // Optional link to order if payment is for an order

        [MaxLength(100)]
        public string? UserId { get; set; } // Who made the payment (if authenticated)

        [MaxLength(100)]
        public string? UserName { get; set; } // Who made the payment (name)

        [MaxLength(100)]
        public string? UserEmail { get; set; } // Email of the user who made the payment

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "pending"; // pending, completed, failed

        [MaxLength(45)] // Standard length for IPv6
        public string? IpAddress { get; set; } // IP address of the payment processor

        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}