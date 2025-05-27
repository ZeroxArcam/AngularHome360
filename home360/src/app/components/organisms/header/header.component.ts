import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service'; // Ajusta la ruta si es necesario
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// Asumiendo que tienes constantes para mensajes, si las usas para el confirm de logout
// import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Asegúrate que este SCSS tiene los estilos del dropdown
})
export class HeaderComponent implements OnInit, OnDestroy {
  // --- Inyección de Dependencias ---
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef); // Para el HostListener

  // --- Propiedades Privadas ---
  private destroy$ = new Subject<void>();

  // --- Propiedades Públicas para la Plantilla ---
  public showLoginModal: boolean = false;
  public isLoggedIn: boolean = false;
  public userName: string | null = null;
  public isLogoutDropdownVisible: boolean = false;

  ngOnInit(): void {
    // Suscribirse a un observable de AuthService que indique el estado de autenticación
    // y preferiblemente también los detalles del usuario como el nombre.
    // Asumiremos que userRole$ te dice si está logueado y que AuthService puede darte el nombre.
    this.authService.userRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(role => {
      this.isLoggedIn = !!role; // Si hay un rol, el usuario está logueado
      if (this.isLoggedIn) {
        // Para obtener el nombre del usuario:
        // Idealmente, AuthService expone un observable como currentUser$ o currentUserDetails$
        // o un método síncrono si el estado se mantiene en un BehaviorSubject.
        // Ejemplo: this.userName = this.authService.getCurrentUserName();
        // O, si AuthService actualiza un BehaviorSubject para los detalles del usuario:
        // this.authService.currentUserDetails$.pipe(takeUntil(this.destroy$)).subscribe(details => {
        //   this.userName = details ? details.name : null;
        // });

        // Por ahora, como en tu LoginComponent se obtenía 'response.name',
        // tu AuthService debería almacenar ese nombre tras el login y exponerlo.
        // Si tu AuthService tiene un método como el siguiente (deberías implementarlo en AuthService):
        this.userName = localStorage.getItem('userName');// Implementa este método en AuthService
        if (!this.userName) {
          console.warn('Nombre de usuario no disponible desde AuthService. Mostrando genérico.');
          // this.userName = 'Usuario'; // Opcional: un nombre genérico
        }

      } else {
        this.userName = null;
        this.isLogoutDropdownVisible = false; // Asegurar que el dropdown se cierre al hacer logout
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Métodos Públicos para la Plantilla ---

  public openLoginModal(): void {
    this.showLoginModal = true;
    this.isLogoutDropdownVisible = false; // Cierra el dropdown si estaba abierto
  }

  public closeLoginModal(): void {
    this.showLoginModal = false;
    // La suscripción en ngOnInit debería actualizar el estado si el login fue exitoso.
  }

  public toggleLogoutDropdown(): void {
    this.isLogoutDropdownVisible = !this.isLogoutDropdownVisible;
  }

  public confirmLogout(): void {
    // Puedes usar un mensaje de tus constantes si las tienes:
    // const wantsToLogout = confirm(DASHBOARD_MESSAGES.CONFIRM_LOGOUT);
    const wantsToLogout = confirm("¿Estás seguro de que quieres cerrar sesión?"); // Confirmación simple
    if (wantsToLogout) {
      this.authService.logout();
      this.isLogoutDropdownVisible = false; // Asegúrate de cerrar el dropdown
      this.router.navigate(['/home']); // Redirigir a home después del logout
    } else {
      // Si el usuario cancela, simplemente cierra el dropdown si estaba abierto por un clic accidental
      this.isLogoutDropdownVisible = false;
    }
  }

  // Cierra el dropdown si se hace clic fuera del área del header__user-actions
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (this.isLogoutDropdownVisible) {
      const userActionsElement = this.elementRef.nativeElement.querySelector('.header__user-actions');
      if (userActionsElement && !userActionsElement.contains(event.target as Node)) {
        this.isLogoutDropdownVisible = false;
      }
    }
  }
}
