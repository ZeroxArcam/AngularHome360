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
    component.email = 'test@example.com';
    component.password = 'password123';
    component.onSubmit(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });
});
