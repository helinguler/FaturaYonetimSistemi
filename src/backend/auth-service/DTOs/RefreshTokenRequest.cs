namespace AuthService.DTOs;

// clienttan gelen refresh token isteğini temsil eder
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}