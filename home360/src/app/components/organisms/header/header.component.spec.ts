import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { ElementRef } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let elementRefMock: any;
  let userRoleSubject: BehaviorSubject<string | null>;

  beforeEach(() => {
    userRoleSubject = new BehaviorSubject<string | null>(null);

    authServiceMock = {
      userRole$: userRoleSubject.asObservable(),
      logout: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    elementRefMock = {
      nativeElement: {
        querySelector: jest.fn()
      }
    };

    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ElementRef, useValue: elementRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    userRoleSubject.next(null);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoggedIn to true when userRole$ emits a role', () => {
    userRoleSubject.next('ADMIN');
    fixture.detectChanges();
    expect(component.isLoggedIn).toBe(true);
  });

  it('should set isLoggedIn to false and hide dropdown when userRole$ emits null', () => {
    component.isLogoutDropdownVisible = true;
    userRoleSubject.next(null);
    fixture.detectChanges();
    expect(component.isLoggedIn).toBe(false);
    expect(component.isLogoutDropdownVisible).toBe(false);
  });

  it('should open login modal and hide logout dropdown', () => {
    component.isLogoutDropdownVisible = true;
    component.openLoginModal();
    expect(component.showLoginModal).toBe(true);
    expect(component.isLogoutDropdownVisible).toBe(false);
  });

  it('should close login modal', () => {
    component.showLoginModal = true;
    component.closeLoginModal();
    expect(component.showLoginModal).toBe(false);
  });

  it('should toggle logout dropdown', () => {
    component.isLogoutDropdownVisible = false;
    component.toggleLogoutDropdown();
    expect(component.isLogoutDropdownVisible).toBe(true);
    component.toggleLogoutDropdown();
    expect(component.isLogoutDropdownVisible).toBe(false);
  });

  describe('confirmLogout', () => {
    it('should logout and navigate to /home if confirmed', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      component.isLogoutDropdownVisible = true;
      component.confirmLogout();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(component.isLogoutDropdownVisible).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should only hide dropdown if not confirmed', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      component.isLogoutDropdownVisible = true;
      component.confirmLogout();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
      expect(component.isLogoutDropdownVisible).toBe(false);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('onDocumentClick', () => {

    it('should not hide dropdown if click is inside user actions', () => {
      component.isLogoutDropdownVisible = true;
      const fakeTarget = document.createElement('div');
      const fakeUserActions = document.createElement('div');
      elementRefMock.nativeElement.querySelector.mockReturnValue(fakeUserActions);
      jest.spyOn(fakeUserActions, 'contains').mockReturnValue(true);

      component.onDocumentClick({ target: fakeTarget } as any);

      expect(component.isLogoutDropdownVisible).toBe(true);
    });

    it('should do nothing if dropdown is not visible', () => {
      component.isLogoutDropdownVisible = false;
      component.onDocumentClick({ target: document.createElement('div') } as any);
      expect(component.isLogoutDropdownVisible).toBe(false);
    });
  });

  it('should clean up destroy$ on ngOnDestroy', () => {
    const nextSpy = jest.spyOn((component as any).destroy$, 'next');
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should NOT hide dropdown if userActionsElement is null', () => {
    component.isLogoutDropdownVisible = true;
    elementRefMock.nativeElement.querySelector.mockReturnValue(null);

    component.onDocumentClick({ target: {} } as any);

    expect(component.isLogoutDropdownVisible).toBe(true);
  });
});
