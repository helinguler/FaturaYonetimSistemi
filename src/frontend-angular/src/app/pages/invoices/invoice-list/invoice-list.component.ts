import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { InvoiceApiService } from '../../../core/services/invoice-api.service';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { InvoiceResponse } from '../../../core/models/invoice.models';
import { CustomerResponse } from '../../../core/models/customer.models';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  userName: string | null;

  invoices: InvoiceResponse[] = [];
  customers: CustomerResponse[] = [];

  startDate = '';
  endDate = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly invoiceApiService: InvoiceApiService,
    private readonly customerApiService: CustomerApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.userName = this.authService.getUserName();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = this.toDateInputValue(firstDayOfMonth);
    this.endDate = this.toDateInputValue(today);
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Başlangıç ve bitiş tarihleri gereklidir.';
      this.invoices = [];
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.invoiceApiService.getInvoices(this.startDate, this.endDate)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: invoices => {
          this.invoices = [...invoices];
          this.cdr.detectChanges();
        },
        error: error => {
          this.invoices = [];
          this.errorMessage = this.getErrorMessage(error);
          this.cdr.detectChanges();
        }
      });
  }

  loadCustomers(): void {
    this.customerApiService.getCustomers().subscribe({
      next: customers => {
        this.customers = [...customers];
        this.cdr.detectChanges();
      },
      error: () => {
        this.customers = [];
        this.cdr.detectChanges();
      }
    });
  }

  getCustomerTitle(customerId: number): string {
    const customer = this.customers.find(x => x.customerId === customerId);

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
      error: error => {
        this.errorMessage = this.getErrorMessage(error);
        this.cdr.detectChanges();
      }
    });
  }

  goToCreate(): void {
    this.router.navigate(['/invoices/new']);
  }

  goToEdit(invoiceId: number): void {
    this.router.navigate(['/invoices/edit', invoiceId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  trackByInvoiceId(index: number, invoice: InvoiceResponse): number {
    return invoice.invoiceId;
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