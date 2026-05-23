using System.Security.Claims;
using InvoiceService.DTOs;
using InvoiceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvoiceService.Controllers;
// dışarıdan gelen HTTP isteklerini alır ve InvoiceAppService classına yönlendirir
[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceAppService _invoiceAppService;

    // Constractor
    public InvoicesController(IInvoiceAppService invoiceAppService)
    {
        _invoiceAppService = invoiceAppService;
    }

    [HttpPost("save")]  // endpoint
    public async Task<ActionResult<InvoiceResponse>> InvoiceSave(InvoiceSaveRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var invoice = await _invoiceAppService.SaveAsync(request, userId);

            return CreatedAtAction(
                nameof(GetInvoiceById),
                new { id = invoice.InvoiceId },
                invoice
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPut("update/{id:int}")]
    public async Task<ActionResult<InvoiceResponse>> InvoiceUpdate(
        int id,
        InvoiceUpdateRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var invoice = await _invoiceAppService.UpdateAsync(id, request, userId);

            if (invoice is null)
            {
                return NotFound("Invoice not found.");
            }

            return Ok(invoice);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpDelete("delete/{id:int}")]
    public async Task<IActionResult> InvoiceDelete(int id)
    {
        var userId = GetCurrentUserId();

        var deleted = await _invoiceAppService.DeleteAsync(id, userId);

        if (!deleted)
        {
            return NotFound("Invoice not found.");
        }

        return NoContent();
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<InvoiceResponse>>> InvoiceList(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? customerId,
        [FromQuery] bool allDates = false)
    {
        try
        {
            var userId = GetCurrentUserId();

            var invoices = await _invoiceAppService.ListAsync(
                startDate,
                endDate,
                customerId,
                allDates,
                userId
            );

            return Ok(invoices);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
            }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceResponse>> GetInvoiceById(int id)
    {
        var userId = GetCurrentUserId();

        var invoice = await _invoiceAppService.GetByIdAsync(id, userId);

        if (invoice is null)
        {
            return NotFound("Invoice not found.");
        }

        return Ok(invoice);
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            throw new UnauthorizedAccessException("Kullanıcı id bilgisi eksik.");
        }

        return int.Parse(userIdClaim);
    }
}