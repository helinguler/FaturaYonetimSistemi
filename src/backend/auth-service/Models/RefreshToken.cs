using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models;

// kullanıcının refresh token kaydı için
public class RefreshToken
{
    public int RefreshTokenId { get; set; }     // primary key

    public int UserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;   // refresh tokenın hashlenmiş hali tutulur

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RevokedAt { get; set; }    // refresh tokenın iptal edilip edilmediği

    public AppUser User { get; set; } = null!;

    [NotMapped]     // db ye yazılmaz, kod içinde hesaplanır
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

    [NotMapped]     // db ye yazılmaz, kod içinde hesaplanır
    public bool IsRevoked => RevokedAt.HasValue;

    [NotMapped]     // db ye yazılmaz, kod içinde hesaplanır
    public bool IsActive => !IsExpired && !IsRevoked;
}