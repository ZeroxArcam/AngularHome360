import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';
import { AuthService } from '@app/core/services/auth/auth.service';
import { of } from 'rxjs';
import { SIDEBAR_NAV_CONFIG } from '@app/shared/constants/sidebar-nav.config';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent { }

describe('DashboardSidebarComponent', () => {
  let component: DashboardSidebarComponent;
  let fixture: ComponentFixture<DashboardSidebarComponent>;

  function setup(userRole$: any) {
    TestBed.configureTestingModule({
      declarations: [DashboardSidebarComponent, DummyComponent],
      imports: [RouterTestingModule.withRoutes([
        { path: 'admin', component: DummyComponent },
        { path: 'unknown', component: DummyComponent },
      ])],
      providers: [
        {
          provide: AuthService,
          useValue: { userRole$ }
        }
      ]
    });

    fixture = TestBed.createComponent(DashboardSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup(of('ADMIN'));
    expect(component).toBeTruthy();
  });

  it('should render nav items for valid role (ADMIN)', () => {
    setup(of('ADMIN'));
    const items = fixture.debugElement.queryAll(By.css('.dashboard-sidebar__nav-item'));
    expect(items.length).toBe(SIDEBAR_NAV_CONFIG['ADMIN'].length);
  });

  it('should render no nav items for unknown role', () => {
    setup(of('UNKNOWN_ROLE'));
    const items = fixture.debugElement.queryAll(By.css('.dashboard-sidebar__nav-item'));
    expect(items.length).toBe(0);
  });

  it('should render no nav items if role is null', () => {
    setup(of(null));
    const items = fixture.debugElement.queryAll(By.css('.dashboard-sidebar__nav-item'));
    expect(items.length).toBe(0);
  });

  it('should toggle isSidebarOpen when toggleSidebar is called', () => {
    setup(of('ADMIN'));
    expect(component.isSidebarOpen).toBe(false);
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(true);
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(false);
  });
});
