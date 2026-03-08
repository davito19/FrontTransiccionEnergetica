import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthSession, JwtPayload, LoginRequest, LoginResponse, UserRole } from '../models/auth.model';
import { CreateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly tokenStorageKey = 'te_token';
  private readonly sessionStorageKey = 'te_session';

  private readonly _session = signal<AuthSession | null>(this.loadSession());

  readonly session = computed(() => this._session());
  readonly isAuthenticated = computed(() => !!this._session()?.token);
  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, payload).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.persistSession(session)),
      catchError((error) => {
        if (error?.status === 0) {
          return throwError(() => new Error('No se pudo conectar con el backend. Verifica error de cors o que este activo en localhost:8083 y reinicia ng serve.'));
        }
        const message = error?.error?.message || 'No fue posible iniciar sesion.';
        return throwError(() => new Error(message));
      })
    );
  }

  register(payload: CreateUserRequest): Observable<CreateUserRequest> {
    return this.http.post<CreateUserRequest>(`${this.apiBaseUrl}/api/users`, payload).pipe(
      catchError((error) => {
        if (error?.status === 0) {
          return throwError(() => new Error('No se pudo conectar con el backend. Verifica que este activo en localhost:8083 y reinicia ng serve.'));
        }
        const message = error?.error?.message || 'No fue posible registrar el usuario.';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.sessionStorageKey);
  }

  getToken(): string | null {
    return this._session()?.token ?? localStorage.getItem(this.tokenStorageKey);
  }

  hasRole(role: UserRole): boolean {
    return this._session()?.role === role;
  }

  private toSession(response: LoginResponse): AuthSession {
    const tokenPayload = this.decodeJwtPayload(response.token);

    return {
      token: response.token,
      email: response.email || tokenPayload?.sub || '',
      role: response.role || 'USER'
    };
  }

  private loadSession(): AuthSession | null {
    const raw = localStorage.getItem(this.sessionStorageKey);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.token) {
        return null;
      }

      const payload = this.decodeJwtPayload(parsed.token);
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        this.logout();
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    this._session.set(session);
    localStorage.setItem(this.tokenStorageKey, session.token);
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
  }

  private decodeJwtPayload(token: string): JwtPayload | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) {
        return null;
      }

      const payload = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
      return JSON.parse(payload) as JwtPayload;
    } catch {
      return null;
    }
  }
}
