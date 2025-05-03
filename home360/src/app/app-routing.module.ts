import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/pages/login/login.component';
import { AdminDashboardComponent } from './components/pages/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './components/templates/admin-layout/admin-layout.component';
import { CategoriesComponent } from './components/pages/categories/categories.component';
import { LocationsComponent } from './components/pages/locations/locations.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'locations', component: LocationsComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
