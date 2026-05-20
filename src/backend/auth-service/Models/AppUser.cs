namespace AuthService.Models;

// AuthService içerisinde login işlemleri için
public class AppUser
{
    public int UserId { get; set; }     // primary key

    public string UserName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;    // passwordun hashlenmiş hali

    public DateTime RecordDate { get; set; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

}