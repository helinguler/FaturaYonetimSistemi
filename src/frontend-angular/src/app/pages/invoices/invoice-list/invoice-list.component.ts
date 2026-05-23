import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import jsPDF from 'jspdf';

import { AuthService } from '../../../core/services/auth.service';
import { InvoiceApiService } from '../../../core/services/invoice-api.service';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { InvoiceResponse } from '../../../core/models/invoice.models';
import { CustomerResponse } from '../../../core/models/customer.models';

interface InvoiceListFilterState {
  startDate: string;
  endDate: string;
  selectedCustomerId: number | null;
  allDates: boolean;
}

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent implements OnInit {
  private readonly filterStorageKey = 'invoice_list_filter';

  userName: string | null;

  invoices: InvoiceResponse[] = [];
  customers: CustomerResponse[] = [];

  startDate = '';
  endDate = '';
  selectedCustomerId: number | null = null;
  allDates = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  selectedInvoice: InvoiceResponse | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly invoiceApiService: InvoiceApiService,
    private readonly customerApiService: CustomerApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.userName = this.authService.getUserName();

    const savedFilter = this.getSavedFilter();

    if (savedFilter) {
      this.startDate = savedFilter.startDate;
      this.endDate = savedFilter.endDate;
      this.selectedCustomerId = savedFilter.selectedCustomerId;
      this.allDates = savedFilter.allDates;
    } else {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      this.startDate = this.toDateInputValue(firstDayOfMonth);
      this.endDate = this.toDateInputValue(today);
      this.selectedCustomerId = null;
      this.allDates = false;
    }
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.allDates && (!this.startDate || !this.endDate)) {
      this.errorMessage = 'Başlangıç ve bitiş tarihleri gereklidir. Tüm faturaları görmek için "Tüm tarihleri göster" seçeneğini işaretleyin.';
      this.invoices = [];
      this.cdr.detectChanges();
      return;
    }

    if (!this.allDates && this.startDate > this.endDate) {
      this.errorMessage = 'Başlangıç tarihi bitiş tarihinden büyük olamaz.';
      this.invoices = [];
      this.cdr.detectChanges();
      return;
    }

    this.saveFilter();

    this.isLoading = true;
    this.cdr.detectChanges();

    this.invoiceApiService
      .getInvoices(
        this.allDates ? null : this.startDate,
        this.allDates ? null : this.endDate,
        this.selectedCustomerId,
        this.allDates,
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (invoices) => {
          this.invoices = [...invoices];
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.invoices = [];
          this.errorMessage = this.getErrorMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  loadCustomers(): void {
    this.customerApiService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = [...customers];
        this.cdr.detectChanges();
      },
      error: () => {
        this.customers = [];
        this.cdr.detectChanges();
      },
    });
  }

  onAllDatesChanged(): void {
    this.saveFilter();
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = this.toDateInputValue(firstDayOfMonth);
    this.endDate = this.toDateInputValue(today);
    this.selectedCustomerId = null;
    this.allDates = false;

    this.saveFilter();
    this.loadInvoices();
  }

  getCustomerTitle(customerId: number): string {
    const customer = this.customers.find((x) => x.customerId === customerId);

    return customer ? customer.title : `Customer #${customerId}`;
  }

  deleteInvoice(invoice: InvoiceResponse): void {
    const confirmed = confirm(`Delete invoice ${invoice.invoiceNumber}?`);

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.invoiceApiService.deleteInvoice(invoice.invoiceId).subscribe({
      next: () => {
        this.successMessage = 'Fatura başarıyla silindi.';
        this.loadInvoices();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
        this.cdr.detectChanges();
      },
    });
  }

  goToCreate(): void {
    this.saveFilter();
    this.router.navigate(['/invoices/new']);
  }

  goToEdit(invoiceId: number): void {
    this.saveFilter();
    this.router.navigate(['/invoices/edit', invoiceId]);
  }

  goToCustomers(): void {
    this.saveFilter();
    this.router.navigate(['/customers']);
  }

  openPreview(invoice: InvoiceResponse): void {
    this.selectedInvoice = invoice;
  }

  closePreview(): void {
    this.selectedInvoice = null;
  }

  getCustomerTaxNumber(customerId: number): string {
    const customer = this.customers.find((x) => x.customerId === customerId);

    return customer ? customer.taxNumber : '-';
  }

  getCustomerAddress(customerId: number): string {
    const customer = this.customers.find((x) => x.customerId === customerId);

    return customer ? customer.address : '-';
  }

  getCustomerEmail(customerId: number): string {
    const customer = this.customers.find((x) => x.customerId === customerId);

    return customer ? customer.eMail : '-';
  }

  downloadInvoicePdf(invoice: InvoiceResponse): void {
    const doc = new jsPDF();

    const customerTitle = this.getCustomerTitle(invoice.customerId);
    const customerTaxNumber = this.getCustomerTaxNumber(invoice.customerId);
    const customerAddress = this.getCustomerAddress(invoice.customerId);
    const customerEmail = this.getCustomerEmail(invoice.customerId);

    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('INVOICE', 14, y);

    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, y);
    y += 7;

    doc.text(`Customer: ${customerTitle}`, 14, y);
    y += 7;

    doc.text(`Tax Number: ${customerTaxNumber}`, 14, y);
    y += 7;

    doc.text(`Email: ${customerEmail}`, 14, y);
    y += 7;

    doc.text(`Address: ${customerAddress}`, 14, y);
    y += 7;

    doc.text(`Date: ${this.formatDate(invoice.invoiceDate)}`, 14, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.text('Item Name', 14, y);
    doc.text('Qty', 100, y);
    doc.text('Price', 125, y);
    doc.text('Total', 160, y);

    y += 3;
    doc.line(14, y, 195, y);
    y += 8;

    doc.setFont('helvetica', 'normal');

    for (const line of invoice.lines) {
      const lineTotal = line.quantity * line.price;

      doc.text(line.itemName.substring(0, 35), 14, y);
      doc.text(line.quantity.toString(), 100, y);
      doc.text(this.formatMoney(line.price), 125, y);
      doc.text(this.formatMoney(lineTotal), 160, y);

      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    y += 2;
    doc.line(14, y, 195, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ${this.formatMoney(invoice.totalAmount)}`, 130, y);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  }

  formatDate(dateValue: string): string {
    return new Date(dateValue).toLocaleDateString('tr-TR');
  }

  formatMoney(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  trackByInvoiceId(index: number, invoice: InvoiceResponse): number {
    return invoice.invoiceId;
  }

  private saveFilter(): void {
    const filterState: InvoiceListFilterState = {
      startDate: this.startDate,
      endDate: this.endDate,
      selectedCustomerId: this.selectedCustomerId,
      allDates: this.allDates,
    };

    localStorage.setItem(this.filterStorageKey, JSON.stringify(filterState));
  }

  private getSavedFilter(): InvoiceListFilterState | null {
    const savedFilter = localStorage.getItem(this.filterStorageKey);

    if (!savedFilter) {
      return null;
    }

    try {
      return JSON.parse(savedFilter) as InvoiceListFilterState;
    } catch {
      return null;
    }
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error?.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
    }

    if (error?.status === 0) {
      return 'API bağlantısı başarısız oldu. Lütfen backend servislerinin çalıştığından emin olun.';
    }

    return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}