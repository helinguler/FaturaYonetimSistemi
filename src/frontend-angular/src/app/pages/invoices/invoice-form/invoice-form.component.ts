import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerResponse } from '../../../core/models/customer.models';
import { InvoiceSaveRequest, InvoiceUpdateRequest } from '../../../core/models/invoice.models';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { InvoiceApiService } from '../../../core/services/invoice-api.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss',
})
export class InvoiceFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly customerApiService = inject(CustomerApiService);
  private readonly invoiceApiService = inject(InvoiceApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  customers: CustomerResponse[] = [];

  invoiceId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  invoiceForm = this.formBuilder.group({
    customerId: [null as number | null, Validators.required],
    invoiceNumber: ['', [Validators.required, Validators.maxLength(50)]],
    invoiceDate: ['', Validators.required],
    lines: this.formBuilder.array<FormGroup>([]),
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.invoiceId = Number(idParam);
      this.isEditMode = true;
    }

    this.loadCustomers();

    if (this.isEditMode && this.invoiceId) {
      this.loadInvoice(this.invoiceId);
    } else {
      this.addLine();

      this.invoiceForm.patchValue({
        invoiceDate: this.toDateInputValue(new Date()),
      });
    }
  }

  goToCustomers(): void {
    this.router.navigate(['/customers']);
  }

  get lines(): FormArray<FormGroup> {
    return this.invoiceForm.controls.lines;
  }

  addLine(): void {
    this.lines.push(
      this.formBuilder.group({
        itemName: ['', [Validators.required, Validators.maxLength(200)]],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        price: [0, [Validators.required, Validators.min(0)]],
      }),
    );

    this.changeDetectorRef.detectChanges();
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      this.errorMessage = 'At least one invoice line is required.';
      return;
    }

    this.errorMessage = '';
    this.lines.removeAt(index);

    this.changeDetectorRef.detectChanges();
  }

  getLineTotal(index: number): number {
    const line = this.lines.at(index);
    const quantity = Number(line.get('quantity')?.value || 0);
    const price = Number(line.get('price')?.value || 0);

    return quantity * price;
  }

  getTotalAmount(): number {
    return this.lines.controls.reduce((total, _, index) => {
      return total + this.getLineTotal(index);
    }, 0);
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required invoice fields.';
      return;
    }

    const request = this.buildRequest();

    this.isSaving = true;

    const operation =
      this.isEditMode && this.invoiceId
        ? this.invoiceApiService.updateInvoice(this.invoiceId, request as InvoiceUpdateRequest)
        : this.invoiceApiService.saveInvoice(request as InvoiceSaveRequest);

    operation.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Invoice updated successfully.'
          : 'Invoice created successfully.';

        this.router.navigate(['/invoices']);
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }

  hasControlError(controlName: 'customerId' | 'invoiceNumber' | 'invoiceDate'): boolean {
    const control = this.invoiceForm.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  hasLineError(index: number, controlName: 'itemName' | 'quantity' | 'price'): boolean {
    const control = this.lines.at(index).get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private loadCustomers(): void {
    this.customerApiService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = [...customers];
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private loadInvoice(invoiceId: number): void {
    this.isLoading = true;
    this.changeDetectorRef.detectChanges();

    this.invoiceApiService
      .getInvoiceById(invoiceId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.lines.clear();

          for (const line of invoice.lines ?? []) {
            this.lines.push(
              this.formBuilder.group({
                itemName: [line.itemName, [Validators.required, Validators.maxLength(200)]],
                quantity: [line.quantity, [Validators.required, Validators.min(0.01)]],
                price: [line.price, [Validators.required, Validators.min(0)]],
              }),
            );
          }

          if (this.lines.length === 0) {
            this.addLine();
          }

          this.invoiceForm.patchValue({
            customerId: invoice.customerId,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: this.toDateInputValue(new Date(invoice.invoiceDate)),
          });

          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private buildRequest(): InvoiceSaveRequest | InvoiceUpdateRequest {
    const formValue = this.invoiceForm.getRawValue();

    const lines = formValue.lines as Array<{
      itemName: string | null;
      quantity: number | null;
      price: number | null;
    }>;

    return {
      customerId: Number(formValue.customerId),
      invoiceNumber: formValue.invoiceNumber!.trim(),
      invoiceDate: formValue.invoiceDate!,
      lines: lines.map((line) => ({
        itemName: line.itemName!.trim(),
        quantity: Number(line.quantity),
        price: Number(line.price),
      })),
    };
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
      return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
    }

    if (error?.status === 409) {
      return 'Fatura numarası zaten mevcut.';
    }

    if (error?.status === 0) {
      return 'API bağlantısı başarısız oldu. Lütfen backend servislerinin çalıştığından emin olun.';
    }

    return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}
