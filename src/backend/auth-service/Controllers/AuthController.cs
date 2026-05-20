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

        return Ok(await CreateAuthResponse(user));
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

        return Ok(await CreateAuthResponse(user));
    }

    // yeni access token + yeni refresh token üretme
    [HttpPost("refresh")]   // endpoint
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest("Refresh token gereklidir.");
        }

        var tokenHash = _jwtTokenService.HashRefreshToken(request.RefreshToken);    // gelen token hashlenir

        var storedToken = await _dbContext.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

        if (storedToken is null || !storedToken.IsActive)
        {
            return Unauthorized("Geçersiz veya süresi dolmuş refresh token.");
        }

        storedToken.RevokedAt = DateTime.UtcNow;    // eski refresh tokenın iptali

        return Ok(await CreateAuthResponse(storedToken.User));
    }

    // refresh tokenı iptal etme
    [HttpPost("revoke")]    // endpoint
    public async Task<IActionResult> Revoke(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest("Refresh token gereklidir.");
        }

        var tokenHash = _jwtTokenService.HashRefreshToken(request.RefreshToken);    // token hashlenir

        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

        if (storedToken is null)
        {
            return Ok();
        }

        if (!storedToken.IsRevoked)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        return Ok();
    }

    // access token + refresh token üretip response dönme
    private async Task<AuthResponse> CreateAuthResponse(AppUser user)
    {
        var accessToken = _jwtTokenService.GenerateAccessToken(user, out var expiresAt);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        var refreshTokenHash = _jwtTokenService.HashRefreshToken(refreshToken);

        // yeni refresh token kaydı
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = refreshTokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            UserId = user.UserId,
            UserName = user.UserName
        };
    }
}