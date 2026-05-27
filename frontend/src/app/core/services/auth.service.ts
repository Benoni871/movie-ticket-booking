import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthUser, Role } from '../models/user.model';

const STORAGE_KEY = 'cinebook.currentUser';
const TOKEN_KEY = 'cinebook.token';
const API = 'http://localhost:8181/api';

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterAdminRequest {
  username: string;
  password: string;
  theaterName: string;
  theaterLocation: string;
}

interface LoginResponse {
  token: string;
  id: number;
  username: string;
  role: Role;
  theaterId?: number | null;
  theaterName?: string | null;
  theaterLocation?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<AuthUser | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(this.loadTokenFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null && this._token() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, { username, password })
      .pipe(tap(res => this.storeSession(res)));
  }

  register(req: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/register`, req)
      .pipe(tap(res => this.storeSession(res)));
  }

  registerAdmin(req: RegisterAdminRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/register-admin`, req)
      .pipe(tap(res => this.storeSession(res)));
  }

  setupTheater(name: string, location: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/setup-theater`, { name, location })
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  getRole(): Role | null {
    return this._currentUser()?.role ?? null;
  }

  getToken(): string | null {
    return this._token();
  }

  private storeSession(res: LoginResponse) {
    const user: AuthUser = {
      id: res.id,
      username: res.username,
      role: res.role,
      theaterId: res.theaterId,
      theaterName: res.theaterName,
      theaterLocation: res.theaterLocation
    };
    this._currentUser.set(user);
    this._token.set(res.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, res.token);
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch {
      return null;
    }
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
