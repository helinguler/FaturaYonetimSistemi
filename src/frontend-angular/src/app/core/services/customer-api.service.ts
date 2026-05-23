import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerResponse } from '../models/customer.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerApiService {
  private readonly apiUrl = 'http://localhost:5000/api/customers';

  constructor(private readonly http: HttpClient) {}

  getCustomers(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(this.apiUrl);
  }
}