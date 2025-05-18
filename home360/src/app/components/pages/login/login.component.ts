import { Component, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Observable, Subscription, take } from 'rxjs';
import { LoginResponse } from 'src/app/core/models/login-response.model';
import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  loginResponse$: Observable<LoginResponse> | null = null;
  loginError: string | null = null;
  loggedInUserName: string | null = null;
  private loginSubscription: Subscription | null = null;

  @Output() closeModalEvent = new EventEmitter<void>();

  handleLogin(credentials: { email: string, password: string }) {
    this.loginResponse$ = this.authService.login(credentials);
    this.loginSubscription = this.loginResponse$.subscribe({
      next: (response) => {
        this.loggedInUserName = response.name;
        this.loginError = null;
        localStorage.setItem('authToken', response.token);
        this.closeModal();
        this.authService.userRole$.pipe(take(1)).subscribe(role => {
          if (role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else if (role === 'SELLER') {
            this.router.navigate(['/seller']);
          } else {
            this.router.navigate(['/home']);
          }
        });
      }, error: (error) => {
        this.loginError = error?.error?.message
          ? this.translationService.translate(error.error.message)
          : DASHBOARD_MESSAGES.SERVER_LOGIN_ERROR;
        this.loggedInUserName = null;
      }
    });
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  ngOnDestroy(): void {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }
}
