import { FormBuilder, Validators } from '@angular/forms';

export function createCustomerForm(formBuilder: FormBuilder) {
  return formBuilder.group({
    taxNumber: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    address: ['', [Validators.maxLength(500)]],
    eMail: ['', [Validators.email, Validators.maxLength(150)]],
  });
}