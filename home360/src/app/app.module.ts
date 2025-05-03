import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonComponent } from './components/atoms/button/button.component';
import { InputComponent } from './components/atoms/input/input.component';
import { LabelComponent } from './components/atoms/label/label.component';
import { TextareaComponent } from './components/atoms/textarea/textarea.component';
import { DashboardFooterComponent } from './components/molecules/dashboard-footer/dashboard-footer.component';
import { DashboardHeaderComponent } from './components/molecules/dashboard-header/dashboard-header.component';
import { DashboardSidebarComponent } from './components/molecules/dashboard-sidebar/dashboard-sidebar.component';
import { FormFieldComponent } from './components/molecules/form-field/form-field.component';
import { TextareaFieldComponent } from './components/molecules/textarea-field/textarea-field.component';
import { CreateCategoryFormComponent } from './components/organisms/create-category-form/create-category-form.component';
import { LoginFormComponent } from './components/organisms/login-form/login-form.component';
import { AdminDashboardComponent } from './components/pages/admin-dashboard/admin-dashboard.component';
import { LoginComponent } from './components/pages/login/login.component';
import { AdminLayoutComponent } from './components/templates/admin-layout/admin-layout.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth-interceptor.interceptor';
import { JwtModule } from '@auth0/angular-jwt';
import { TokenService } from './core/services/auth/token.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ListCategoriesComponent } from './components/organisms/list-categories/list-categories.component';
import { CategoriesComponent } from './components/pages/categories/categories.component';

export function tokenGetter() {
  return localStorage.getItem('authToken');
}

@NgModule({
  declarations: [
    AppComponent,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    TextareaComponent,
    DashboardFooterComponent,
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    FormFieldComponent,
    TextareaFieldComponent,
    CreateCategoryFormComponent,
    LoginFormComponent,
    AdminDashboardComponent,
    LoginComponent,
    AdminLayoutComponent,
    ListCategoriesComponent,
    CategoriesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:8081', 'localhost:8082', 'localhost:8083'],
        disallowedRoutes: ['http://localhost:8082/api/v1/users/login']
      }
    })

  ],
  providers: [TokenService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
