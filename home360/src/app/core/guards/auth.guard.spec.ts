import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/auth/token.service';
import { jest } from '@jest/globals';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    tokenServiceMock = {
      getToken: jest.fn().mockReturnValue('fake-token'),
      isTokenExpired: jest.fn().mockReturnValue(false),
      getRole: jest.fn().mockReturnValue('admin')
    };

    routerMock = {
      parseUrl: jest.fn().mockImplementation((url) => ({ url }))
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should allow access if token is valid and role matches', () => {
    const routeMock = {
      data: {
        roles: ['admin']
      }
    } as any;

    const result = guard.canActivate(routeMock);
    expect(result).toBe(true);
  });

  it('should deny access if token is missing', () => {
    tokenServiceMock.getToken.mockReturnValue(null);
    const routeMock = { data: {} } as any;

    const result = guard.canActivate(routeMock);
    expect(result).toEqual(routerMock.parseUrl('/login'));
  });

  it('should deny access if token is expired', () => {
    tokenServiceMock.isTokenExpired.mockReturnValue(true);
    const routeMock = { data: {} } as any;

    const result = guard.canActivate(routeMock);
    expect(result).toEqual(routerMock.parseUrl('/login'));
  });

  it('should allow access if no roles are specified', () => {
    const routeMock = {
      data: {
        roles: []
      }
    } as any;

    const result = guard.canActivate(routeMock);
    expect(result).toBe(true);
  });

  it('should deny access if user role does not match expected roles', () => {
    tokenServiceMock.getRole.mockReturnValue('user');
    const routeMock = {
      data: {
        roles: ['admin']
      }
    } as any;

    const result = guard.canActivate(routeMock);
    expect(result).toEqual(routerMock.parseUrl('/login'));
  });
});
