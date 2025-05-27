import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private destroy$ = new Subject<void>();

  public showLoginModal: boolean = false;
  public isLoggedIn: boolean = false;
  public isLogoutDropdownVisible: boolean = false;

  ngOnInit(): void {
    this.authService.userRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(role => {
      this.isLoggedIn = !!role;
      if (!this.isLoggedIn) {
        this.isLogoutDropdownVisible = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  public openLoginModal(): void {
    this.showLoginModal = true;
    this.isLogoutDropdownVisible = false;
  }

  public closeLoginModal(): void {
    this.showLoginModal = false;
  }

  public toggleLogoutDropdown(): void {
    this.isLogoutDropdownVisible = !this.isLogoutDropdownVisible;
  }

  public confirmLogout(): void {
    const wantsToLogout = confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (wantsToLogout) {
      this.authService.logout();
      this.isLogoutDropdownVisible = false;
      this.router.navigate(['/home']);
    } else {
      this.isLogoutDropdownVisible = false;
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (this.isLogoutDropdownVisible) {
      const userActionsElement = this.elementRef.nativeElement.querySelector('.header__user-actions');
      if (userActionsElement && !userActionsElement.contains(event.target)) {
        this.isLogoutDropdownVisible = false;
      }
    }
  }
}
