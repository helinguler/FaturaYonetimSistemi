using AuthService.Data;
using AuthService.DTOs;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

[ApiController]
[Route("api/auth")]    // endpoint
public class AuthController : ControllerBase
{
    // bağımlılıklar
    private readonly AuthDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    // constractor
    public AuthController(AuthDbContext dbContext, JwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    /// register method
    [HttpPost("register")]  //endpoint
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Kullanıcı adı ve şifre gereklidir.");
        }

        if (request.Password.Length < 8)
        {
            return BadRequest("Şifre en az 8 karakter uzunluğunda olmalıdır.");
        }

        var normalizedUserName = request.UserName.Trim();   // UserName boşluk temizleme

        var userExists = await _dbContext.Users
            .AnyAsync(x => x.UserName == normalizedUserName);

        if (userExists)
        {
            return Conflict("Kullanıcı adı zaten mevcut.");
        }

        // yeni kullanıcı oluşturma
        var user = new AppUser
        {
            UserName = normalizedUserName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RecordDate = DateTime.UtcNow
        };

        // kullanıcıyı db ye kaydetme
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        // jwt token üretme
        var token = _jwtTokenService.GenerateToken(user, out var expiresAt);

        return Ok(new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.UserId,
            UserName = user.UserName
        });
    }

    // Login Method
    [HttpPost("login")]   // endpoint
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Kullanıcı adı ve şifre gereklidir.");
        }

        var normalizedUserName = request.UserName.Trim();   // UserName boşluk temizleme

        // kullanıcıyı db de arama
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(x => x.UserName == normalizedUserName);

        if (user is null)
        {
            return Unauthorized("Geçersiz kullanıcı adı veya şifre.");
        }

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            return Unauthorized("Geçersiz kullanıcı adı veya şifre.");
        }

        // jwt token üretme
        var token = _jwtTokenService.GenerateToken(user, out var expiresAt);

        return Ok(new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.UserId,
            UserName = user.UserName
        });
    }
}