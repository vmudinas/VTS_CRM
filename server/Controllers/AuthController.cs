using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoldsAndFlavors.API.Utils;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FoldsAndFlavors.API.Data;
using FoldsAndFlavors.API.Data.Models;

namespace FoldsAndFlavors.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FoldsAndFlavorsContext _context;
        private readonly string _jwtSecret;

        public AuthController(FoldsAndFlavorsContext context)
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

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !PasswordHasher.Verify(user.Password, request.Password))
            {
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
