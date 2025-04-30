import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/auth/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRoles = route.data['roles'] as string[];
    const userRole = this.tokenService.getRole();
    console.log('User Role:', userRole);
    console.log('Expected Roles:', expectedRoles);

    if (!this.tokenService.getToken() || this.tokenService.isTokenExpired()) {
      return this.router.parseUrl('/login');
    }

    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    if (userRole && expectedRoles.includes(userRole)) {
      return true;
    } else {
      console.warn(`Acceso denegado: El rol '${userRole}' no tiene permiso para acceder a esta ruta.`);
      return this.router.parseUrl('/login');

    }
  }
}
