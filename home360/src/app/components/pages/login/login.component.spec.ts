import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError, Subscription } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, NgZone } from '@angular/core';

@Component({ template: '' })
class DummyComponent { }

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let router: Router;
  let ngZone: NgZone;

  beforeEach(() => {
    authServiceMock = {
      login: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'admin', component: DummyComponent }
        ])
      ],
      declarations: [LoginComponent, DummyComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    ngZone = TestBed.inject(NgZone);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call login method from AuthService on handleLogin', fakeAsync(() => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { name: 'Test User', token: '123456' };
    authServiceMock.login.mockReturnValue(of(mockResponse));

    ngZone.run(() => {
      component.handleLogin(credentials);
    });
    tick();

    expect(authServiceMock.login).toHaveBeenCalledWith(credentials);
    expect(component.loggedInUserName).toBe('Test User');
    expect(component.loginError).toBeNull();
  }));

  it('should set loginError on failed login', fakeAsync(() => {
    const credentials = { email: 'test@example.com', password: 'wrongpassword' };
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

    ngZone.run(() => {
      component.handleLogin(credentials);
    });
    tick();

    expect(component.loginError).toBe('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    expect(component.loggedInUserName).toBeNull();
  }));

  it('should unsubscribe on ngOnDestroy', () => {
    component['loginSubscription'] = new Subscription();
    const unsubscribeSpy = jest.spyOn(component['loginSubscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should navigate to /admin after successful login', fakeAsync(() => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { name: 'Test User', token: '123456' };
    authServiceMock.login.mockReturnValue(of(mockResponse));
    const navigateSpy = jest.spyOn(router, 'navigate');

    ngZone.run(() => {
      component.handleLogin(credentials);
    });
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  }));

});
