import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, AuthResponse, User, Nullable } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = API_BASE_URL;
  private readonly STORAGE_TOKEN_KEY = 'chat_token';
  private readonly STORAGE_USER_KEY = 'chat_user';

  private readonly http = inject(HttpClient);

  public currentUser = signal<Nullable<User>>(null);
  public token = signal<Nullable<string>>(null);

  constructor() {
    this.restoreSessionFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response) => {
        this.setAuth(response.token, response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_TOKEN_KEY);
    localStorage.removeItem(this.STORAGE_USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getToken(): Nullable<string> {
    return this.token();
  }

  getCurrentUser(): Nullable<User> {
    return this.currentUser();
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
    localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private restoreSessionFromStorage(): void {
    const savedToken = localStorage.getItem(this.STORAGE_TOKEN_KEY);
    const savedUserRaw = localStorage.getItem(this.STORAGE_USER_KEY);

    if (!savedToken || !savedUserRaw) {
      this.token.set(null);
      this.currentUser.set(null);
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUserRaw) as User;
      this.token.set(savedToken);
      this.currentUser.set(parsedUser);
    } catch {
      // Corrupt storage, clear to avoid inconsistent state
      localStorage.removeItem(this.STORAGE_TOKEN_KEY);
      localStorage.removeItem(this.STORAGE_USER_KEY);
      this.token.set(null);
      this.currentUser.set(null);
    }
  }
}
