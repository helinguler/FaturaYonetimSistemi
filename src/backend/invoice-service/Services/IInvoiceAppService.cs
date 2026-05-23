using InvoiceService.DTOs;

namespace InvoiceService.Services;

public interface IInvoiceAppService
{
    // yeni fatura kaydetme
    Task<InvoiceResponse> SaveAsync(InvoiceSaveRequest request, int userId);

    // mevcut faturayı güncelleme
    Task<InvoiceResponse?> UpdateAsync(int invoiceId, InvoiceUpdateRequest request, int userId);

    // faturayı silme
    Task<bool> DeleteAsync(int invoiceId, int userId);

    // tarih aralığındaki faturaları
    Task<List<InvoiceResponse>> ListAsync(
    DateTime? startDate,
    DateTime? endDate,
    int? customerId,
    bool allDates,
    int userId);

    // belirli bir faturayı IDye göre getirme
    Task<InvoiceResponse?> GetByIdAsync(int invoiceId, int userId);
}