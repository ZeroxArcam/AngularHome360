import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError, Subscription, BehaviorSubject } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, NgZone, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';

@Component({ template: '' })
class DummyComponent { }

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let router: Router;
  let ngZone: NgZone;
  let userRoleSubject: BehaviorSubject<string>;
  let translationServiceMock: any;

  beforeEach(() => {
    userRoleSubject = new BehaviorSubject<string>('CUSTOMER');

    authServiceMock = {
      login: jest.fn(),
      userRole$: userRoleSubject.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'admin', component: DummyComponent },
          { path: 'seller', component: DummyComponent },
          { path: 'home', component: DummyComponent }
        ])
      ],
      declarations: [LoginComponent, DummyComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: 'TranslationService',
          useValue: {
            translate: jest.fn()
          }
        }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    ngZone = TestBed.inject(NgZone);
    translationServiceMock = TestBed.inject(TranslationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    userRoleSubject.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /admin after successful login', fakeAsync(() => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { name: 'Test User', token: '123456' };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    userRoleSubject.next('ADMIN');

    const navigateSpy = jest.spyOn(router, 'navigate');

    ngZone.run(() => {
      component.handleLogin(credentials);
    });
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  }));

  it('should navigate to /seller if userRole$ is SELLER', fakeAsync(() => {
    const credentials = { email: 'seller@example.com', password: 'password' };
    const mockResponse = { name: 'Seller User', token: 'seller-token' };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    userRoleSubject.next('SELLER');

    const navigateSpy = jest.spyOn(router, 'navigate');

    component.handleLogin(credentials);
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/seller']);
  }));

  it('should navigate to /home if userRole$ is CUSTOMER', fakeAsync(() => {
    const credentials = { email: 'customer@example.com', password: 'password' };
    const mockResponse = { name: 'Customer User', token: 'customer-token' };

    authServiceMock.login.mockReturnValue(of(mockResponse));
    userRoleSubject.next('CUSTOMER');

    const navigateSpy = jest.spyOn(router, 'navigate');

    component.handleLogin(credentials);
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  }));

  describe('Error Handling Tests', () => {
    it('should handle error with translated message', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'wrongpass' };
      const errorResponse = {
        error: {
          message: 'INVALID_CREDENTIALS'
        },
        status: 401
      };

      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));
      translationServiceMock.translate = jest.fn((msg: string) => `TRADUCIDO: ${msg}`);

      component.handleLogin(credentials);
      tick();

      expect(translationServiceMock.translate).toHaveBeenCalledWith('INVALID_CREDENTIALS');
      expect(component.loginError).toBe('TRADUCIDO: INVALID_CREDENTIALS');
      expect(component.loggedInUserName).toBeNull();
    }));

    it('should handle error without specific message', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'wrongpass' };
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));
      jest.spyOn(translationServiceMock, 'translate');

      component.handleLogin(credentials);
      tick();

      expect(translationServiceMock.translate).not.toHaveBeenCalled();
      expect(component.loginError).toBe(DASHBOARD_MESSAGES.SERVER_LOGIN_ERROR);
      expect(component.loggedInUserName).toBeNull();
    }));

    it('should handle malformed error response', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'wrongpass' };
      const errorResponse = {
        error: null,
        status: 0,
        statusText: 'Unknown Error'
      };

      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.handleLogin(credentials);
      tick();

      expect(component.loginError).toBe(DASHBOARD_MESSAGES.SERVER_LOGIN_ERROR);
      expect(component.loggedInUserName).toBeNull();
    }));

    it('should handle network error', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'wrongpass' };
      const errorResponse = new ErrorEvent('Network error', {
        message: 'Failed to connect'
      });

      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.handleLogin(credentials);
      tick();

      expect(component.loginError).toBe(DASHBOARD_MESSAGES.SERVER_LOGIN_ERROR);
      expect(component.loggedInUserName).toBeNull();
    }));
  });

});
