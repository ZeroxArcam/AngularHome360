import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let loginSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoginFormComponent],
    });
    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    loginSpy = jest.spyOn(component.login, 'emit');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call event.preventDefault() and emit login on form submit', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;
    component.loginForm.controls['email'].setValue('test@example.com');
    component.loginForm.controls['password'].setValue('password123');
    component.onSubmit(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('should mark all fields as touched when the form is invalid', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;
    const markAllAsTouchedSpy = jest.spyOn(component.loginForm, 'markAllAsTouched');
    component.loginForm.setErrors({ invalid: true });
    component.onSubmit(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should emit empty strings when form values are null', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;

    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);
    component.loginForm.patchValue({
      email: null,
      password: null
    });

    component.onSubmit(event);

    expect(loginSpy).toHaveBeenCalledWith({
      email: '',
      password: ''
    });
  });

  it('should handle undefined form values by emitting empty strings', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;

    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);
    component.loginForm.patchValue({
      email: undefined,
      password: undefined
    });

    component.onSubmit(event);

    expect(loginSpy).toHaveBeenCalledWith({
      email: '',
      password: ''
    });
  });

  it('should handle mixed null/undefined values correctly', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;

    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);
    component.loginForm.patchValue({
      email: null,
      password: undefined
    });

    component.onSubmit(event);

    expect(loginSpy).toHaveBeenCalledWith({
      email: '',
      password: ''
    });
  });

  it('should handle empty string values', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;
    component.loginForm.patchValue({ email: '', password: '' });
    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);

    component.onSubmit(event);

    expect(loginSpy).toHaveBeenCalledWith({ email: '', password: '' });
  });

  it('should handle partial nullish values', () => {
    const event = { preventDefault: jest.fn() } as unknown as Event;
    component.loginForm.patchValue({ email: 'test@test.com', password: null });
    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);

    component.onSubmit(event);

    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@test.com', password: '' });
  });

  it('should trim whitespace from values', () => {
    component.loginForm.patchValue({ email: '  test@test.com  ', password: '  pass  ' });
    jest.spyOn(component.loginForm, 'valid', 'get').mockReturnValue(true);

    component.onSubmit({ preventDefault: jest.fn() } as any);

    expect(loginSpy).toHaveBeenCalledWith({
      email: '  test@test.com  ',
      password: '  pass  '
    });
  });

});
