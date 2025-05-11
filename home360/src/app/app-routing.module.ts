import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/pages/login/login.component';
import { AdminDashboardComponent } from './components/pages/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './components/templates/admin-layout/admin-layout.component';
import { CategoriesComponent } from './components/pages/categories/categories.component';
import { LocationsComponent } from './components/pages/locations/locations.component';
import { CreateSellerFormComponent } from './components/organisms/create-seller-form/create-seller-form.component';
import { HomePageComponent } from './components/pages/home-page/home-page.component';
import { AdminPageComponent } from './components/pages/admin-page/admin-page.component';
import { SellerPageComponent } from './components/pages/seller-page/seller-page.component';
import { PropertiesPageComponent } from './components/pages/properties-page/properties-page.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent, pathMatch: 'full' },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'locations', component: LocationsComponent },
      { path: 'users', component: CreateSellerFormComponent },
    ]
  },
  {
    path: 'seller',
    component: SellerPageComponent,
    canActivate: [AuthGuard],
    data: { roles: ['SELLER'] },
    children: [
      { path: '', redirectTo: 'properties', pathMatch: 'full' },
      // { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'properties', component: PropertiesPageComponent },
    ]
  }
  // {
  //   path: 'admin',
  //   component: AdminLayoutComponent,
  //   canActivate: [AuthGuard],
  //   data: { roles: ['ADMIN'] },
  //   children: [
  //     { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  //     { path: 'dashboard', component: AdminDashboardComponent },
  //     { path: 'categories', component: CategoriesComponent },
  //     { path: 'locations', component: LocationsComponent },
  //     { path: 'users', component: CreateSellerFormComponent },
  //   ]
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
