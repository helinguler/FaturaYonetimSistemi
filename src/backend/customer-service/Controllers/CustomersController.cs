using System.Security.Claims;
using System.Text.RegularExpressions;
using CustomerService.Data;
using CustomerService.DTOs;
using CustomerService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Controllers;

// giriş yapmış kullanıcıya ait customerları listelemek, görüntülemek, eklemek, güncellemek ve silmek için
[ApiController]
[Route("api/customers")]    // endpoint
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly CustomerDbContext _dbContext;

    // customer tableına erişim
    public CustomersController(CustomerDbContext dbContext)
    {
        _dbContext = dbContext; 
    }

    // customer listeleme -> GET /api/customers
    [HttpGet]
    public async Task<ActionResult<List<CustomerResponse>>> GetCustomers()
    {
        var userId = GetCurrentUserId();

        var customers = await _dbContext.Customers
            .AsNoTracking()     // performans iyileştirme
            .Where(x => x.UserId == userId)     // sadece o kullanıcıya ait customerlar getirilir
            .OrderByDescending(x => x.RecordDate)
            .Select(x => ToResponse(x))
            .ToListAsync();

        return Ok(customers);
    }

    // ıd’ye göre customer getirme -> GET /api/customers/x
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerResponse>> GetCustomerById(int id)
    {
        var userId = GetCurrentUserId();

        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.CustomerId == id && x.UserId == userId);

        if (customer is null)
        {
            return NotFound("Customer not found.");
        }

        return Ok(ToResponse(customer));
    }

    // yeni customer oluşturma -> POST /api/customers
    [HttpPost]
    public async Task<ActionResult<CustomerResponse>> CreateCustomer(CreateCustomerRequest request)
    {
        var userId = GetCurrentUserId();

        var validationError = ValidateCustomerInput(request.TaxNumber, request.Title);

        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var taxNumber = request.TaxNumber.Trim();
        var title = request.Title.Trim();

        // aynı kullanıcının aynı vergi numarasına sahip başka bir customerı var mı
        var exists = await _dbContext.Customers
            .AnyAsync(x => x.UserId == userId && x.TaxNumber == taxNumber);

        if (exists)
        {
            return Conflict("Aynı vergi numarasına sahip bir müşteri zaten mevcut.");
        }

        var customer = new Customer
        {
            TaxNumber = taxNumber,
            Title = title,
            Address = request.Address?.Trim() ?? string.Empty,
            EMail = request.EMail?.Trim() ?? string.Empty,
            UserId = userId,
            RecordDate = DateTime.UtcNow
        };

        // db ye ekleme
        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCustomerById),
            new { id = customer.CustomerId },
            ToResponse(customer)
        );
    }

    // customer güncelleme -> PUT /api/customers/x
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerResponse>> UpdateCustomer(int id, UpdateCustomerRequest request)
    {
        var userId = GetCurrentUserId();

        var validationError = ValidateCustomerInput(request.TaxNumber, request.Title);

        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        // kullanıcı sadece kendi customerını güncelleyebilir
        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.CustomerId == id && x.UserId == userId);

        if (customer is null)
        {
            return NotFound("Müşteri bulunamadı.");
        }

        var taxNumber = request.TaxNumber.Trim();
        var title = request.Title.Trim();

        var duplicateExists = await _dbContext.Customers
            .AnyAsync(x =>
                x.UserId == userId &&
                x.CustomerId != id &&
                x.TaxNumber == taxNumber);

        if (duplicateExists)
        {
            return Conflict("Aynı vergi numarasına sahip bir müşteri zaten mevcut.");
        }

        customer.TaxNumber = taxNumber;
        customer.Title = title;
        customer.Address = request.Address?.Trim() ?? string.Empty;
        customer.EMail = request.EMail?.Trim() ?? string.Empty;

        await _dbContext.SaveChangesAsync();

        return Ok(ToResponse(customer));
    }

    // customer silme -> DELETE /api/customers/x
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var userId = GetCurrentUserId();

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.CustomerId == id && x.UserId == userId);

        if (customer is null)
        {
            return NotFound("Customer not found.");
        }

        _dbContext.Customers.Remove(customer);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    
    // ─────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────

    // Bu metot JWT token içindeki kullanıcı id bilgisini alır
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            throw new UnauthorizedAccessException("Kullanıcı id bilgisi eksik.");
        }

        return int.Parse(userIdClaim);
    }

    // Bu metot temel doğrulama yapar
    private static string? ValidateCustomerInput(string taxNumber, string title)
    {
        if (string.IsNullOrWhiteSpace(taxNumber))
        {
            return "Vergi numarası gereklidir.";
        }

        var normalizedTaxNumber = taxNumber.Trim();

        if (!Regex.IsMatch(normalizedTaxNumber, @"^\d{10,11}$"))
        {
            return "Tax number must be 10 or 11 digits.";
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            return "Başlık zorunludur.";
        }

        if (title.Length > 200)
        {
            return "Başlık 200 karakteri geçemez.";
        }

        return null;
    }

    // bu metot Customer entity’sini CustomerResponse DTO’suna çevirir
    private static CustomerResponse ToResponse(Customer customer)
    {
        return new CustomerResponse
        {
            CustomerId = customer.CustomerId,
            TaxNumber = customer.TaxNumber,
            Title = customer.Title,
            Address = customer.Address,
            EMail = customer.EMail,
            UserId = customer.UserId,
            RecordDate = customer.RecordDate
        };
    }
}