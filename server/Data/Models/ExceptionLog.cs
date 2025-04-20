using System;

namespace FoldsAndFlavors.API.Data.Models
{
    public class ExceptionLog
    {
        public int Id { get; set; }
        public string? FileName { get; set; }
        public string? MethodName { get; set; }
        public string Message { get; set; } = null!;
        public string? InnerMessage { get; set; }
        public DateTime Timestamp { get; set; }
    }
}