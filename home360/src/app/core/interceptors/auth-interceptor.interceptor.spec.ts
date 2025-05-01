import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { AuthInterceptor } from './auth-interceptor.interceptor';
import { of } from 'rxjs';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let httpHandlerMock: { handle: jest.Mock };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthInterceptor]
    });

    interceptor = TestBed.inject(AuthInterceptor);
    httpHandlerMock = {
      handle: jest.fn()
    };
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header if token exists and is not login request', () => {
    const token = 'test-token';
    localStorage.setItem('authToken', token);

    const request = new HttpRequest('GET', '/api/v1/protected');
    interceptor.intercept(request, httpHandlerMock);

    const interceptedRequest = httpHandlerMock.handle.mock.calls[0][0];
    expect(interceptedRequest.headers.get('Authorization')).toBe(`Bearer ${token}`);
  });


  it('should NOT add Authorization header for login requests', () => {
    localStorage.setItem('authToken', 'test-token');

    const request = new HttpRequest('POST' as any, '/api/v1/users/login');

    interceptor.intercept(request, httpHandlerMock);

    // debe pasar el request original sin modificar
    expect(httpHandlerMock.handle).toHaveBeenCalledWith(request);
  });

  it('should NOT add Authorization header if no token is present', () => {
    localStorage.removeItem('authToken');

    const request = new HttpRequest('GET', '/api/v1/protected');
    interceptor.intercept(request, httpHandlerMock);

    expect(httpHandlerMock.handle).toHaveBeenCalledWith(request);
  });
});
