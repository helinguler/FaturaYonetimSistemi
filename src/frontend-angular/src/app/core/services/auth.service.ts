import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.models';

// uygulamada login, register, token saklama, refresh token alma ve logout işlemlerini 
// merkezi olarak yöneten servis

// singleton
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api/auth';

  // localStorage key değerleri
  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly expiresAtKey = 'expires_at';
  private readonly userNameKey = 'user_name';

  // kullanıcının giriş yapıp yapmadığını tutan özel bir state
  private readonly loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());

  loggedIn$ = this.loggedInSubject.asObservable();  // login durumunu dışarıya Observable olarak açar

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap(response => this.setSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap(response => this.setSession(response)));
  }

  // access token süresi dolduğunda yeni token almak için
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap(response => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.expiresAtKey);
    localStorage.removeItem(this.userNameKey);

    this.loggedInSubject.next(false);
  }

  // localStoragedan access tokenı getirir
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // localStoragedan refresh tokenı getirir.
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.userNameKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const expiresAt = localStorage.getItem(this.expiresAtKey);

    if (!token || !expiresAt) {
      return false;
    }

    return new Date(expiresAt).getTime() > Date.now();
  }

  // APIden gelen auth bilgisini localStorage a kaydeder
  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    localStorage.setItem(this.expiresAtKey, response.expiresAt);
    localStorage.setItem(this.userNameKey, response.userName);

    this.loggedInSubject.next(true);
  }
}