import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/auth/jwt.service'; // Asegúrate de la ruta correcta a tu TokenService

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRoles = route.data['roles'] as string[]; // Obtenemos los roles esperados de la data de la ruta
    const userRole = this.tokenService.getRole();
    console.log('User Role:', userRole);
    console.log('Expected Roles:', expectedRoles);

    if (!this.tokenService.getToken() || this.tokenService.isTokenExpired()) {
      return this.router.parseUrl('/login'); // Redirige si no está autenticado o el token expiró
    }

    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // Si no se especifican roles, permite el acceso (para rutas solo autenticadas)
    }

    if (userRole && expectedRoles.includes(userRole)) {
      return true; // Permite el acceso si el rol del usuario está entre los roles esperados
    } else {
      console.warn(`Acceso denegado: El rol '${userRole}' no tiene permiso para acceder a esta ruta.`);
      return this.router.parseUrl('/login'); // Redirige a /login si no tiene el rol
      // Podrías redirigir a una página de 'No Autorizado' si lo prefieres:
      // return this.router.parseUrl('/unauthorized');
    }
  }
}
