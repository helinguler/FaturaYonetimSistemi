namespace CustomerService.DTOs;

// müşteri update request attığında dışarıdan gelen veri
public class UpdateCustomerRequest
{
    public string TaxNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string EMail { get; set; } = string.Empty;
}