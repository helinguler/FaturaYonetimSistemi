import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  loginForm = this.formBuilder.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Kullanıcı adı ve şifre zorunludur.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    const { userName, password } = this.loginForm.getRawValue();

    this.isLoading = true;
    this.changeDetectorRef.detectChanges();

    this.authService.login({
      userName: userName!.trim(),
      password: password!
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/invoices']);
        },
        error: error => {
          this.errorMessage = this.getErrorMessage(error);
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  register(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Kullanıcı adı ve şifre zorunludur.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    const { userName, password } = this.loginForm.getRawValue();

    this.isLoading = true;
    this.changeDetectorRef.detectChanges();

    this.authService.register({
      userName: userName!.trim(),
      password: password!
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/invoices']);
        },
        error: error => {
          this.errorMessage = this.getErrorMessage(error);
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  hasError(controlName: 'userName' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  private getErrorMessage(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error?.status === 401) {
      return 'Kullanıcı adı veya şifre hatalı.';
    }

    if (error?.status === 409) {
      return 'Bu kullanıcı adı zaten kullanılıyor.';
    }

    if (error?.status === 0) {
      return 'Backend bağlantısı kurulamadı. Servislerin çalıştığını kontrol edin.';
    }

    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}