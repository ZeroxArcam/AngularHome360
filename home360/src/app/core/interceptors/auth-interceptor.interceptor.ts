import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from '../services/auth/token.service';
import { SESSION_MESSAGES } from '../../shared/constants/messages.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router, private tokenService: TokenService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = localStorage.getItem('authToken');
    const isLoginRequest = request.url.includes('/api/v1/users/login');

    let authRequest = request;
    if (authToken && !isLoginRequest) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${authToken}`)
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403 || this.tokenService.isTokenExpired()) {
          localStorage.removeItem('authToken');
          alert(SESSION_MESSAGES.EXPIRED);
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
