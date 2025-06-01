import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/auth/token.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) { }

  canActivate(): boolean | UrlTree {
    if (this.tokenService.getToken() && !this.tokenService.isTokenExpired()) {
      return this.router.parseUrl('/home');
    }
    return true;
  }
}
