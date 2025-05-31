import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Observable, map } from 'rxjs';
import { NavItem, SIDEBAR_NAV_CONFIG } from '../../../shared/constants/sidebar-nav.config';

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss']
}) export class DashboardSidebarComponent implements OnInit {
  isSidebarOpen = false;
  private authService = inject(AuthService);
  menuItems$: Observable<NavItem[]> | undefined;

  ngOnInit(): void {
    this.menuItems$ = this.authService.userRole$.pipe(
      map(role => {
        if (role) {
          return SIDEBAR_NAV_CONFIG[role] || [];
        } else {
          return [];
        }
      })
    );
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
