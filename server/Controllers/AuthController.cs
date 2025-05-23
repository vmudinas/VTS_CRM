using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FAI.API.Utils;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FAI.API.Data;
using FAI.API.Data.Models;

namespace FAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FAIContext _context;
        private readonly string _jwtSecret;

        public AuthController(FAIContext context)
        {
            _context = context;
            // JWT secret: use environment variable if set and non-empty, otherwise fallback to default (must be >256 bits)
            var defaultSecret = "abcdefghijklmnopqrstuvwxyzABCDEFG"; // 33 chars, 264 bits
            var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
            _jwtSecret = !string.IsNullOrWhiteSpace(envSecret)
                ? envSecret
                : defaultSecret;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            Console.WriteLine($"[AUTH] Login attempt: Username='{request.Username}', Password='{request.Password}'");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            Console.WriteLine($"[AUTH_DEBUG] User retrieved from DB: Username='{user?.Username ?? "null"}', Password='{user?.Password ?? "null"}'"); // Debug log
            if (user == null)
            {
                Console.WriteLine($"[AUTH] No user found with username '{request.Username}'");
                return Unauthorized(new { message = "Invalid credentials" });
            }
            Console.WriteLine($"[AUTH] Found user: {user.Username}, StoredHash: '{user.Password}'");
            var passwordOk = PasswordHasher.Verify(user.Password, request.Password);
            Console.WriteLine($"[AUTH] Password verification result: {passwordOk}");
            if (!passwordOk)
            {
                Console.WriteLine($"[AUTH] Password mismatch for user '{user.Username}'");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var claims = new List<Claim>
            {
                new Claim("id", user.Id.ToString()),
                new Claim("username", user.Username),
                new Claim("isAdmin", user.IsAdmin.ToString())
            };

            // Derive a fixed-length signing key (256-bit) from the secret
            using var _sha = System.Security.Cryptography.SHA256.Create();
            var keyBytes = _sha.ComputeHash(Encoding.UTF8.GetBytes(_jwtSecret));
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                user = new { id = user.Id, username = user.Username, isAdmin = user.IsAdmin }
            });
        }

        public class LoginRequest
        {
            public string Username { get; set; } = null!;
            public string Password { get; set; } = null!;
        }
    }
}
