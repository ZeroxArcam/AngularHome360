import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  welcomeMessage: string = DASHBOARD_MESSAGES.WELCOME;
  userName: string | null = null;
  isLogoutDropdownVisible: boolean = false;
  private storageSubscription: Subscription = new Subscription();
  private authService = inject(AuthService);
  private router = inject(Router);

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'userName') {
      this.userName = localStorage.getItem('userName');
      this.updateWelcomeMessage();
    }
  };
  ngOnInit(): void {
    this.userName = localStorage.getItem('userName');
    this.updateWelcomeMessage();
    window.addEventListener('storage', this.handleStorageChange);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.handleStorageChange);
  }

  private updateWelcomeMessage(): void {
    this.welcomeMessage = this.userName
      ? DASHBOARD_MESSAGES.WELCOME_WITH_NAME(this.userName)
      : DASHBOARD_MESSAGES.WELCOME;
  }
  toggleLogoutDropdown(): void {
    this.isLogoutDropdownVisible = !this.isLogoutDropdownVisible;
  }

  confirmLogout(): void {
    if (confirm(DASHBOARD_MESSAGES.CONFIRM_LOGOUT)) {
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
