import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DASHBOARD_MESSAGES } from '@app/shared/constants/messages.constants';
import { JwtHelperService } from '@auth0/angular-jwt';

describe('DashboardHeaderComponent', () => {
  let component: DashboardHeaderComponent;
  let fixture: ComponentFixture<DashboardHeaderComponent>;
  let mockAuthService: { logout: jest.Mock };
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.setItem('userName', 'Juan');

    mockAuthService = {
      logout: jest.fn()
    };

    TestBed.configureTestingModule({
      declarations: [DashboardHeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: {} },
        {
          provide: JwtHelperService,
          useValue: { isTokenExpired: jest.fn() }
        }
      ]
    });

    fixture = TestBed.createComponent(DashboardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display welcome message with userName', () => {
    const welcomeEl = fixture.debugElement.query(By.css('.dashboard-header__welcome-message'));
    expect(welcomeEl.nativeElement.textContent.trim()).toBe(DASHBOARD_MESSAGES.WELCOME);
  });

  it('should display welcome message without userName', () => {
    localStorage.removeItem('userName');
    fixture = TestBed.createComponent(DashboardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const welcomeEl = fixture.debugElement.query(By.css('.dashboard-header__welcome-message'));
    expect(welcomeEl.nativeElement.textContent.trim()).toBe(DASHBOARD_MESSAGES.WELCOME);
  });


  it('should update welcome message when localStorage userName changes via storage event', () => {
    localStorage.setItem('userName', 'Juan');
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.welcomeMessage).toContain('Bienvenido');

    localStorage.setItem('userName', 'Carlos');
    const event = new StorageEvent('storage', {
      key: 'userName',
      newValue: 'Carlos',
      oldValue: 'Juan',
      storageArea: localStorage,
      url: window.location.href
    });
    window.dispatchEvent(event);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.welcomeMessage).toContain('Carlos');
    });
  });

  it('should toggle dropdown visibility on icon click', () => {
    const userIcon = fixture.debugElement.query(By.css('.dashboard-header__user-icon'));
    expect(component.isLogoutDropdownVisible).toBe(false);

    userIcon.triggerEventHandler('click');
    fixture.detectChanges();

    expect(component.isLogoutDropdownVisible).toBe(true);

    userIcon.triggerEventHandler('click');
    fixture.detectChanges();

    expect(component.isLogoutDropdownVisible).toBe(false);
  });

  it('should hide dropdown if clicked outside', () => {
    component.isLogoutDropdownVisible = true;
    fixture.detectChanges();

    const clickEvent = new MouseEvent('click', { bubbles: true });
    document.dispatchEvent(clickEvent);

    fixture.detectChanges();
    expect(component.isLogoutDropdownVisible).toBe(false);
  });

  it('should call logout if user confirms', () => {
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    component.confirmLogout();

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should NOT call logout if user cancels', () => {
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    component.confirmLogout();

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
