namespace CustomerService.DTOs;

// yeni customer oluştururken API ye gönderilen veri
public class CreateCustomerRequest
{
    public string TaxNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string EMail { get; set; } = string.Empty;
}