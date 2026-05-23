import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest
} from '../models/customer.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerApiService {
  private readonly apiUrl = '/api/customers';

  constructor(private readonly http: HttpClient) {}

  getCustomers(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(this.apiUrl);
  }

  getCustomerById(customerId: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${customerId}`);
  }

  createCustomer(request: CreateCustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.apiUrl, request);
  }

  updateCustomer(
    customerId: number,
    request: UpdateCustomerRequest
  ): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${customerId}`, request);
  }

  deleteCustomer(customerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${customerId}`);
  }
}