import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { LoginResponse } from '../../models/login-response.model';
import { Router } from '@angular/router';
import { TokenService } from './token.service';

const tokenServiceMock = {
  getRole: jest.fn().mockReturnValue('ADMIN'),
  getToken: jest.fn().mockReturnValue('fake-jwt-token'),
  isTokenExpired: jest.fn().mockReturnValue(false),
};

const routerMock = {
  navigate: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    jest.spyOn(localStorage['__proto__'], 'setItem');
    jest.spyOn(localStorage['__proto__'], 'removeItem');


  });


  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to login endpoint and store token', () => {
    const mockCredentials = { email: 'test@example.com', password: '123456' };
    const mockResponse: LoginResponse = {
      token: 'fake-jwt-token',
      userId: 30,
      name: 'Zerox',
      email: 'zeroxAdmin@example.com',
      role: 'ROLE_ADMIN',
    };

    service.login(mockCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
      expect(tokenServiceMock.getRole).toHaveBeenCalled();
    });

    const req = httpMock.expectOne(`${environment.usersapiUrl}/users/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should remove token and navigate on logout', () => {
    service.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should return true if token exists and not expired', () => {
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return false if token is missing or expired', () => {
    tokenServiceMock.getToken.mockReturnValue(null);
    expect(service.isAuthenticated()).toBe(false);

    tokenServiceMock.getToken.mockReturnValue('fake-token');
    tokenServiceMock.isTokenExpired.mockReturnValue(true);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return the user role as observable', (done) => {
    tokenServiceMock.getRole.mockReturnValue('ADMIN');
    const role$ = service.getUserRole();
    role$.subscribe(role => {
      expect(role).toBe('ADMIN');
      done();
    });
  });

});
