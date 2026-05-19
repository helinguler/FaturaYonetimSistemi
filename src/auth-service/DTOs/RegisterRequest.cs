namespace AuthService.DTOs;

// kullanıcı kayıt olurken API ye gelen veri
public class RegisterRequest
{
    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}