using InvoiceService.Data;
using InvoiceService.DTOs;
using InvoiceService.Mappers;
using InvoiceService.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceService.Services;

// faturaları dbye ekler, günceller, siler, listeler ve tek tek getirir
public class InvoiceAppService : IInvoiceAppService
{
    private readonly InvoiceDbContext _dbContext;

    // Constractor
    public InvoiceAppService(InvoiceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // yeni fatura kaydetmek için kullanılır
    public async Task<InvoiceResponse> SaveAsync(InvoiceSaveRequest request, int userId)
    {
        ValidateInvoiceInput(request.CustomerId, request.InvoiceNumber, request.Lines);

        var invoiceNumber = request.InvoiceNumber.Trim();   // fatura no başındaki ve sonundaki boşlukları siler

        // aynı kullanıcıda aynı fatura numarası var mı diye kontrol eder
        var duplicateExists = await _dbContext.Invoices
            .AnyAsync(x => x.UserId == userId && x.InvoiceNumber == invoiceNumber);

        if (duplicateExists)
        {
            throw new InvalidOperationException("Aynı fatura numarasına sahip bir fatura zaten mevcut.");
        }

        var invoice = new Invoice
        {
            CustomerId = request.CustomerId,
            InvoiceNumber = invoiceNumber,
            InvoiceDate = request.InvoiceDate.Date,
            UserId = userId,
            RecordDate = DateTime.UtcNow,
            InvoiceLines = InvoiceMapper.CreateInvoiceLines(request.Lines, userId)
        };

        invoice.TotalAmount = CalculateTotalAmount(invoice.InvoiceLines);

        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        return InvoiceMapper.ToResponse(invoice);
    }

    // var olan faturayı günceller
    public async Task<InvoiceResponse?> UpdateAsync(
        int invoiceId,
        InvoiceUpdateRequest request,
        int userId)
    {
        ValidateInvoiceInput(request.CustomerId, request.InvoiceNumber, request.Lines);

        // güncellenecek faturayı veritabanından bulur
        var invoice = await _dbContext.Invoices
            .Include(x => x.InvoiceLines)
            .FirstOrDefaultAsync(x => x.InvoiceId == invoiceId && x.UserId == userId);

        if (invoice is null)
        {
            return null;
        }

        var invoiceNumber = request.InvoiceNumber.Trim();

        var duplicateExists = await _dbContext.Invoices
            .AnyAsync(x =>
                x.UserId == userId &&
                x.InvoiceId != invoiceId &&
                x.InvoiceNumber == invoiceNumber);

        if (duplicateExists)
        {
            throw new InvalidOperationException("Aynı fatura numarasına sahip bir fatura zaten mevcut.");
        }

        invoice.CustomerId = request.CustomerId;
        invoice.InvoiceNumber = invoiceNumber;
        invoice.InvoiceDate = request.InvoiceDate.Date;

        _dbContext.InvoiceLines.RemoveRange(invoice.InvoiceLines);  // eski fatura satırlarını siler.

        invoice.InvoiceLines = InvoiceMapper.CreateInvoiceLines(request.Lines, userId);   // yeni fatura satırlarını oluşturur
        invoice.TotalAmount = CalculateTotalAmount(invoice.InvoiceLines);   // yeni satırlara göre toplam tutarı tekrar hesaplar

        await _dbContext.SaveChangesAsync();    

        return InvoiceMapper.ToResponse(invoice);
    }

    // faturayı silmek için kullanılır
    public async Task<bool> DeleteAsync(int invoiceId, int userId)
    {
        var invoice = await _dbContext.Invoices
            .FirstOrDefaultAsync(x => x.InvoiceId == invoiceId && x.UserId == userId);

        if (invoice is null)
        {
            return false;
        }

        _dbContext.Invoices.Remove(invoice);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    // belirli tarih aralığındaki faturaları listeler
    public async Task<List<InvoiceResponse>> ListAsync(
    DateTime? startDate,
    DateTime? endDate,
    int? customerId,
    bool allDates,
    int userId)
{
    if (!allDates)
    {
        if (!startDate.HasValue || !endDate.HasValue)
        {
            throw new ArgumentException("Start date and end date are required.");
        }

        if (startDate.Value.Date > endDate.Value.Date)
        {
            throw new ArgumentException("Start date cannot be later than end date.");
        }
    }

    var query = _dbContext.Invoices
        .AsNoTracking()
        .Include(x => x.InvoiceLines)
        .Where(x => x.UserId == userId);

    if (!allDates && startDate.HasValue && endDate.HasValue)
    {
        var start = startDate.Value.Date;
        var endExclusive = endDate.Value.Date.AddDays(1);

        query = query.Where(x =>
            x.InvoiceDate >= start &&
            x.InvoiceDate < endExclusive);
    }

    if (customerId.HasValue && customerId.Value > 0)
    {
        query = query.Where(x => x.CustomerId == customerId.Value);
    }

    var invoices = await query
        .OrderByDescending(x => x.InvoiceDate)
        .ThenByDescending(x => x.InvoiceId)
        .ToListAsync();

    return invoices
        .Select(InvoiceMapper.ToResponse)
        .ToList();
}

    // belirli IDye sahip faturayı getirir
    public async Task<InvoiceResponse?> GetByIdAsync(int invoiceId, int userId)
    {
        var invoice = await _dbContext.Invoices
            .AsNoTracking()
            .Include(x => x.InvoiceLines)
            .FirstOrDefaultAsync(x => x.InvoiceId == invoiceId && x.UserId == userId);

        return invoice is null ? null : InvoiceMapper.ToResponse(invoice);
    }

    // fatura bilgilerinin geçerli olup olmadığını kontrol eder
    private static void ValidateInvoiceInput(
        int customerId,
        string invoiceNumber,
        List<InvoiceLineRequest> lines)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException("Müşteri id gereklidir.");
        }

        if (string.IsNullOrWhiteSpace(invoiceNumber))
        {
            throw new ArgumentException("Fatura numarası gereklidir.");
        }

        if (invoiceNumber.Length > 50)
        {
            throw new ArgumentException("Fatura numarası 50 karakteri geçemez.");
        }

        if (lines.Count == 0)
        {
            throw new ArgumentException("En az bir fatura satırı gereklidir.");
        }

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line.ItemName))
            {
                throw new ArgumentException("Ürün adı zorunludur.");
            }

            if (line.ItemName.Length > 200)
            {
                throw new ArgumentException("Ürün adı 200 karakteri geçemez.");
            }

            if (line.Quantity <= 0)
            {
                throw new ArgumentException("Miktar sıfırdan büyük olmalıdır.");
            }

            if (line.Price < 0)
            {
                throw new ArgumentException("Fiyat negatif olamaz.");
            }
        }
    }

    // faturanın toplam tutarını hesaplar
    private static decimal CalculateTotalAmount(IEnumerable<InvoiceLine> lines)
    {
        return lines.Sum(x => x.Quantity * x.Price);
    }
}