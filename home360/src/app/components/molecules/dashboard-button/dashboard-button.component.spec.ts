import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardButtonComponent } from './dashboard-button.component';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { of } from 'rxjs';

describe('DashboardButtonComponent', () => {
  let component: DashboardButtonComponent;
  let fixture: ComponentFixture<DashboardButtonComponent>;
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardButtonComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        {
          provide: AuthService,
          useValue: {
            getUserRole: jest.fn()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(DashboardButtonComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to admin dashboard if user role is admin', () => {
    (authService.getUserRole as jest.Mock).mockReturnValue(of('ADMIN'));
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should navigate to seller page if user role is seller', () => {
    (authService.getUserRole as jest.Mock).mockReturnValue(of('SELLER'));
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/seller']);
  });

  it('should navigate to home if user role is not admin or seller', () => {
    (authService.getUserRole as jest.Mock).mockReturnValue(of(null));
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
