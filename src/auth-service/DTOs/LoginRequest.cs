namespace AuthService.DTOs;

// kullanıcı giriş yaparken API ye gelen veri
public class LoginRequest
{
    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}