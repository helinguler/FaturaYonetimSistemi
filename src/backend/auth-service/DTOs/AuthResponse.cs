namespace AuthService.DTOs;

// login/register başarılı olunca frontend’e dönen veri
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public int UserId { get; set; }

    public string UserName { get; set; } = string.Empty;
}