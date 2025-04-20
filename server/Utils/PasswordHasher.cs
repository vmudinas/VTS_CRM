using System;
using System.Security.Cryptography;

namespace FoldsAndFlavors.API.Utils
{
    public static class PasswordHasher
    {
        // Generate a hashed password: PBKDF2 with SHA256
        public static string Hash(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(32);
            byte[] result = new byte[1 + salt.Length + hash.Length];
            result[0] = 0x01;
            Buffer.BlockCopy(salt, 0, result, 1, salt.Length);
            Buffer.BlockCopy(hash, 0, result, 1 + salt.Length, hash.Length);
            return Convert.ToBase64String(result);
        }

        // Verify a password against stored hash
        public static bool Verify(string storedHash, string password)
        {
            if (string.IsNullOrEmpty(storedHash) || string.IsNullOrEmpty(password))
                return false;
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(storedHash);
            }
            catch (FormatException)
            {
                // Stored password is not in hashed format: fallback to plain-text comparison
                return storedHash == password;
            }
            if (bytes.Length != 1 + 16 + 32 || bytes[0] != 0x01)
                return false;
            byte[] salt = new byte[16];
            Buffer.BlockCopy(bytes, 1, salt, 0, salt.Length);
            byte[] hash = new byte[32];
            Buffer.BlockCopy(bytes, 1 + salt.Length, hash, 0, hash.Length);
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            byte[] hash2 = pbkdf2.GetBytes(32);
            return CryptographicOperations.FixedTimeEquals(hash, hash2);
        }
    }
}