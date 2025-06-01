import { TestBed, inject } from '@angular/core/testing';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth-interceptor.interceptor';
import { Observable, of, throwError } from 'rxjs';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { TokenService } from '../services/auth/token.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;
  let router: Router;
  let httpHandlerMock: { handle: jest.Mock };

  const routerMock = {
    navigate: jest.fn()
  } as unknown as Router;

  const tokenServiceMock = {
    isTokenExpired: jest.fn(() => false)
  } as unknown as TokenService;

  const nextMock = {
    handle: jest.fn()
  } as unknown as HttpHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        {
          provide: TokenService,
          useValue: {
            getToken: jest.fn(),
            isTokenExpired: jest.fn()
          }
        }
      ]
    });

    interceptor = TestBed.inject(AuthInterceptor);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    httpHandlerMock = {
      handle: jest.fn().mockReturnValue(of(new HttpResponse<any>()))
    };
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });


  // it('should add Authorization header if token exists and is not login request', () => {
  //   const token = 'test-token';
  //   (tokenService.getToken as jest.Mock).mockReturnValue(token);
  //   (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);

  //   const httpClient = TestBed.inject(HttpClient);
  //   const http = TestBed.inject(HttpTestingController);

  //   httpClient.get('/api/v1/protected').subscribe();

  //   const req = http.expectOne('/api/v1/protected');
  //   expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
  //   req.flush({});

  //   http.verify();
  // });

  it('should NOT add Authorization header for login requests', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue('test-token');
    const req = new HttpRequest('GET', '/api/v1/users/login');

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe();

    expect(httpHandlerMock.handle).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.not.objectContaining({
        Authorization: expect.anything()
      })
    }));
  });

  it('should NOT add Authorization header if no token is present', () => {
    (tokenService.getToken as jest.Mock).mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/v1/protected');

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe();

    expect(httpHandlerMock.handle).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.not.objectContaining({
        Authorization: expect.anything()
      })
    }));
  });

  it('should remove token and navigate to login on 401 error', () => {
    const req = new HttpRequest('GET', '/api/v1/protected');
    const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    (httpHandlerMock.handle as jest.Mock).mockReturnValue(throwError(() => errorResponse));

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe({
      error: () => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      }
    });
  });

  it('should remove token and navigate to login on 403 error', () => {
    const req = new HttpRequest('GET', '/api/v1/protected');
    const errorResponse = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    (httpHandlerMock.handle as jest.Mock).mockReturnValue(throwError(() => errorResponse));
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe({
      error: () => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      }
    });
  });

  it('should remove token and navigate to login on expired token', () => {
    const req = new HttpRequest('GET', '/api/v1/protected');
    const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    (httpHandlerMock.handle as jest.Mock).mockReturnValue(throwError(() => errorResponse));
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(true);

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe({
      error: () => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      }
    });
  });

  it('should remove token and navigate to login on 403 error and expired token', () => {
    const req = new HttpRequest('GET', '/api/v1/protected');
    const errorResponse = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    (httpHandlerMock.handle as jest.Mock).mockReturnValue(throwError(() => errorResponse));
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(true);

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe({
      error: () => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      }
    });
  });

  it('should NOT remove token and navigate to login on no error', () => {
    const req = new HttpRequest('GET', '/api/v1/protected');
    const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    (httpHandlerMock.handle as jest.Mock).mockReturnValue(throwError(() => errorResponse));
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);

    interceptor.intercept(req, httpHandlerMock as HttpHandler).subscribe({
      error: () => {
        expect(localStorage.removeItem).not.toHaveBeenCalledWith('authToken');
        expect(router.navigate).not.toHaveBeenCalledWith(['/login']);
      }
    });
  });

});
