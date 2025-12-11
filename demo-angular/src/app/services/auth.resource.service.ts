import { Injectable, signal, resource } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, AuthResponse, User, Nullable } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthResourceService {
  private readonly API_URL = API_BASE_URL;
  private readonly STORAGE_TOKEN_KEY = 'chat_token';
  private readonly STORAGE_USER_KEY = 'chat_user';

  public currentUser = signal<Nullable<User>>(null);
  public token = signal<Nullable<string>>(null);

  // Signal pour déclencher la requête de login
  private loginRequest = signal<Nullable<LoginRequest>>(null);

  // Resource pour gérer la requête de login
  private loginResource = resource({
    params: () => this.loginRequest(),
    loader: async ({ params }) => {
      if (!params) return null;

      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = (await response.json()) as AuthResponse;
      this.setAuth(data.token, data.user);
      return data;
    },
  });

  constructor() {
    this.restoreSessionFromStorage();
  }

  login(credentials: LoginRequest): void {
    this.loginRequest.set(credentials);
  }

  // Accès au statut et aux données de la resource
  get loginStatus() {
    return {
      isLoading: this.loginResource.isLoading(),
      error: this.loginResource.error(),
      value: this.loginResource.value(),
    };
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_TOKEN_KEY);
    localStorage.removeItem(this.STORAGE_USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.loginRequest.set(null);
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
      localStorage.removeItem(this.STORAGE_TOKEN_KEY);
      localStorage.removeItem(this.STORAGE_USER_KEY);
      this.token.set(null);
      this.currentUser.set(null);
    }
  }
}
