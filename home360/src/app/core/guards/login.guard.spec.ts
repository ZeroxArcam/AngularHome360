import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginGuard } from './login.guard';
import { TokenService } from '../services/auth/token.service';
import { UrlTree } from '@angular/router';
import { of } from 'rxjs';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let tokenService: TokenService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        {
          provide: TokenService,
          useValue: {
            getToken: jest.fn(),
            isTokenExpired: jest.fn(),
          },
        },
        {
          provide: Router,
          useValue: {
            parseUrl: jest.fn(),
          },
        },
      ],
    });
    guard = TestBed.inject(LoginGuard);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if the user does not have a token', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue(null);
    const result = guard.canActivate();
    expect(result).toBe(true);
  });

  it('should return true if the user has an expired token', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue('token');
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(true);
    const result = guard.canActivate();
    expect(result).toBe(true);
  });

  it('should return a UrlTree if the user has a valid token', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue('token');
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);
    (router.parseUrl as jest.Mock).mockReturnValue('/home');
    const result = guard.canActivate();
    expect(result).toEqual('/home');
  });

  it('should redirect to /home if the user has a valid token', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue('validToken');
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);
    const urlTree = {} as UrlTree;
    (router.parseUrl as jest.Mock).mockReturnValue(urlTree);

    const result = guard.canActivate();

    expect(result).toBe(urlTree);
    expect(router.parseUrl).toHaveBeenCalledWith('/home');
  });
});
