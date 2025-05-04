import { Component, OnDestroy, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { LoginResponse } from 'src/app/core/models/login-response.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  loginResponse$: Observable<LoginResponse> | null = null;
  loginError: string | null = null;
  loggedInUserName: string | null = null;
  private loginSubscription: Subscription | null = null;

  @Output() closeModalEvent = new EventEmitter<void>();

  constructor(private authService: AuthService, private router: Router) { }

  handleLogin(credentials: { email: string, password: string }) {
    this.loginResponse$ = this.authService.login(credentials);
    this.loginSubscription = this.loginResponse$.subscribe({
      next: (response) => {
        this.loggedInUserName = response.name;
        this.loginError = null;
        localStorage.setItem('authToken', response.token);
        this.closeModal(); // Cierra el modal después del login exitoso
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.loginError = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
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
