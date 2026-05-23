import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InvoiceResponse,
  InvoiceSaveRequest,
  InvoiceUpdateRequest,
} from '../models/invoice.models';

@Injectable({
  providedIn: 'root',
})
export class InvoiceApiService {
  private readonly apiUrl = 'http://localhost:5000/api/invoices';

  constructor(private readonly http: HttpClient) {}

  getInvoices(
    startDate: string | null,
    endDate: string | null,
    customerId: number | null,
    allDates: boolean,
  ): Observable<InvoiceResponse[]> {
    let params = new HttpParams().set('allDates', allDates);

    if (!allDates && startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }

    if (customerId) {
      params = params.set('customerId', customerId);
    }

    return this.http.get<InvoiceResponse[]>(`${this.apiUrl}/list`, { params });
  }

  getInvoiceById(invoiceId: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/${invoiceId}`);
  }

  saveInvoice(request: InvoiceSaveRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/save`, request);
  }

  updateInvoice(invoiceId: number, request: InvoiceUpdateRequest): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.apiUrl}/update/${invoiceId}`, request);
  }

  deleteInvoice(invoiceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${invoiceId}`);
  }
}
