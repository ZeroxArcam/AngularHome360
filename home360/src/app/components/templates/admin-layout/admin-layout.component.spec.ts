import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { DashboardHeaderComponent } from '../../molecules/dashboard-header/dashboard-header.component';
import { DashboardSidebarComponent } from '../../molecules/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardFooterComponent } from '../../molecules/dashboard-footer/dashboard-footer.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminLayoutComponent, DashboardHeaderComponent, DashboardSidebarComponent, DashboardFooterComponent],
      imports: [RouterTestingModule]
    });
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
