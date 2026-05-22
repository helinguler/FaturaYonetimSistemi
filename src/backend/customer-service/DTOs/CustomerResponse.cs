namespace CustomerService.DTOs;

// API nin kullanıcıya döneceği müşteri bilgisi
public class CustomerResponse
{
    public int CustomerId { get; set; }

    public string TaxNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string EMail { get; set; } = string.Empty;

    public int UserId { get; set; }

    public DateTime RecordDate { get; set; }
}