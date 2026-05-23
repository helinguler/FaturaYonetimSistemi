// giriş yaparken gönderilecek veri modeli
export interface LoginRequest {
  userName: string;
  password: string;
}

// kayıt olurken gönderilecek veri modeli
export interface RegisterRequest {
  userName: string;
  password: string;
}

// giriş veya kayıt işleminden sonra APIden dönen cevabın şekli
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  userId: number;
  userName: string;
}