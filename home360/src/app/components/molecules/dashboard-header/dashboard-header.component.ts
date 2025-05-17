import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  welcomeMessage: string = 'Bienvenido';
  userName: string | null = null;
  isLogoutDropdownVisible: boolean = false;
  private storageSubscription: Subscription = new Subscription();
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName');
    this.updateWelcomeMessage();

    this.storageSubscription = new Subscription(() => {
      window.addEventListener('storage', (event) => {
        if (event.key === 'userName') {
          this.userName = localStorage.getItem('userName');
          this.updateWelcomeMessage();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.storageSubscription.unsubscribe();
  }

  private updateWelcomeMessage(): void {
    if (this.userName) {
      this.welcomeMessage = `Bienvenido, ${this.userName}`;
    } else {
      this.welcomeMessage = 'Bienvenido';
    }
  }

  toggleLogoutDropdown(): void {
    this.isLogoutDropdownVisible = !this.isLogoutDropdownVisible;
  }

  confirmLogout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const userIcon = document.querySelector('.dashboard-header__user-icon');
    const logoutDropdown = document.querySelector('.dashboard-header__logout-dropdown');

    if (this.isLogoutDropdownVisible && userIcon && logoutDropdown &&
      !userIcon.contains(event.target as Node) &&
      !logoutDropdown.contains(event.target as Node)) {
      this.isLogoutDropdownVisible = false;
    }
  }
}
