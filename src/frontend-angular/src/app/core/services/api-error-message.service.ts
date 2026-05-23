import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorMessageService {
  getCustomerErrorMessage(error: unknown): string {
    const httpError = error as HttpErrorResponse;

    if (typeof httpError.error === 'string' && httpError.error.trim()) {
      return httpError.error;
    }

    if (httpError.status === 409) {
      return 'Aynı vergi numarasına sahip bir müşteri zaten mevcut.';
    }

    if (httpError.status === 0) {
      return 'API bağlantısı başarısız oldu. Lütfen backend servislerinin çalıştığından emin olun.';
    }

    return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}