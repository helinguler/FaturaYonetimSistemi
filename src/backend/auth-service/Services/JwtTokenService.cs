using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Models;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Services;

// JWT access token üretme
public class JwtTokenService
{
    // appsettings.json  içindeki JWT ayarlarını okur
    private readonly IConfiguration _configuration;

    // Constractor
    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }


    // kullanıcıya ait JWT tokenı üretme
    public string GenerateAccessToken(AppUser user, out DateTime expiresAt)
    {
        // gizli keyin kısa veya zayıf olmaması için güvenlik önlemi
        var jwtSecret = _configuration["Jwt:Secret"];

        if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
        {
            throw new InvalidOperationException("JWT gizli kod en az 32 karakter uzunluğunda olmalıdır.");
        }

        var issuer = _configuration["Jwt:Issuer"];  // tokenı üreten taraf
        var audience = _configuration["Jwt:Audience"];  // tokenı kullanacak taraf

        expiresAt = DateTime.UtcNow.AddMinutes(15);

        // token decode edildiğinde görünecek bilgiler
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));  // jwt yi imzalamak için key haline getirme
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);   // HMAC SHA-256 jwt imzalama algo

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // random refresh token üretme
    public string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    // refresh tokenın hash değerini üretme
    public string HashRefreshToken(string refreshToken)
    {
        using var sha256 = SHA256.Create();
        var tokenBytes = Encoding.UTF8.GetBytes(refreshToken);
        var hashBytes = sha256.ComputeHash(tokenBytes);

        return Convert.ToBase64String(hashBytes);
    }
}