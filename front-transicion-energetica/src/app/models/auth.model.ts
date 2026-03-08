export type UserRole = 'ADMIN' | 'USER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
}
