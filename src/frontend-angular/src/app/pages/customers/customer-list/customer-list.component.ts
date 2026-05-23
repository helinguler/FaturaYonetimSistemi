import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerResponse } from '../../../core/models/customer.models';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorMessageService } from '../../../core/services/api-error-message.service';
import { createCustomerForm } from '../../../features/customers/forms/customer-form.factory';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly customerApiService = inject(CustomerApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly apiErrorMessageService = inject(ApiErrorMessageService);

  customers: CustomerResponse[] = [];

  selectedCustomerId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  customerForm = createCustomerForm(this.formBuilder);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.changeDetectorRef.detectChanges();

    this.customerApiService
      .getCustomers()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  saveCustomer(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.errorMessage = 'Lütfen gerekli müşteri alanlarını doğru şekilde doldurun.';
      return;
    }

    const formValue = this.customerForm.getRawValue();

    const request = {
      taxNumber: formValue.taxNumber!.trim(),
      title: formValue.title!.trim(),
      address: formValue.address?.trim() ?? '',
      eMail: formValue.eMail?.trim() ?? '',
    };

    this.isSaving = true;

    const operation =
      this.isEditMode && this.selectedCustomerId
        ? this.customerApiService.updateCustomer(this.selectedCustomerId, request)
        : this.customerApiService.createCustomer(request);

    operation
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = this.isEditMode
            ? 'Müşteri bilgileri başarıyla güncellendi.'
            : 'Müşteri başarıyla oluşturuldu.';

          this.resetForm();
          this.loadCustomers();
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  editCustomer(customer: CustomerResponse): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.selectedCustomerId = customer.customerId;
    this.isEditMode = true;

    this.customerForm.patchValue({
      taxNumber: customer.taxNumber,
      title: customer.title,
      address: customer.address,
      eMail: customer.eMail,
    });
  }

  deleteCustomer(customer: CustomerResponse): void {
    const confirmed = confirm(`Delete customer ${customer.title}?`);

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.customerApiService.deleteCustomer(customer.customerId).subscribe({
      next: () => {
        this.successMessage = 'Müşteri başarıyla silindi.';

        if (this.selectedCustomerId === customer.customerId) {
          this.resetForm();
        }

        this.loadCustomers();
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
      },
    });
  }

  resetForm(): void {
    this.selectedCustomerId = null;
    this.isEditMode = false;

    this.customerForm.reset({
      taxNumber: '',
      title: '',
      address: '',
      eMail: '',
    });
  }

  goToInvoices(): void {
    this.router.navigate(['/invoices']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasError(controlName: 'taxNumber' | 'title' | 'address' | 'eMail'): boolean {
    const control = this.customerForm.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  private getErrorMessage(error: unknown): string {
    const httpError = error as { status?: number };

    if (httpError.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
    }

    return this.apiErrorMessageService.getCustomerErrorMessage(error);
  }
}
