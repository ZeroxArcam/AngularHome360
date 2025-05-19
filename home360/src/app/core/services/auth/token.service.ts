import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(public jwtHelper: JwtHelperService) { }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  decodeToken(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        return this.jwtHelper.decodeToken(token);
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  getRole(): string | null {
    const decodedToken = this.decodeToken();
    if (decodedToken && decodedToken.roles) {
      let role: string | null = null;
      if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
        role = decodedToken.roles[0];
      } else if (typeof decodedToken.roles === 'string') {
        role = decodedToken.roles;
      }

      if (role && role.startsWith('ROLE_')) {
        return role.substring(5);
      }
    }
    return null;
  }

  getUserId(): string | number | null {
    const decodedToken = this.decodeToken();
    if (decodedToken && decodedToken.sub) {
      return decodedToken.sub;
    }
    return null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (token) {
      return this.jwtHelper.isTokenExpired(token);
    }
    return true;
  }
}
