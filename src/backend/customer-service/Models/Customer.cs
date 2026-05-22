namespace CustomerService.Models;

public class Customer
{
    public int CustomerId { get; set; }     // primary key

    public string TaxNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string EMail { get; set; } = string.Empty;

    public int UserId { get; set; }     // her customer kaydı hangi kullanıcıya aitse onu tutar

    public DateTime RecordDate { get; set; } = DateTime.UtcNow;
}