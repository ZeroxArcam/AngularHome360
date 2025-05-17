import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginResponse } from '../../models/login-response.model';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private loginUrl = `${environment.usersapiUrl}/users/login`;
  private userRoleSubject = new BehaviorSubject<string | null>(this.tokenService.getRole());
  public userRole$ = this.userRoleSubject.asObservable();

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials).pipe(
      tap(response => {
        localStorage.setItem('authToken', response.token);
        this.userRoleSubject.next(this.tokenService.getRole());
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.userRoleSubject.next(null);
    this.router.navigate(['/home']);
  }

  getUserRole(): Observable<string | null> {
    return this.userRole$;
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken() && !this.tokenService.isTokenExpired();
  }
}
