import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  })

  @Output() login = new EventEmitter<{ email: string, password: string }>();

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm.valid) {
      this.login.emit({
        email: this.loginForm.value.email ?? '',
        password: this.loginForm.value.password ?? ''
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get emailControl() {
    return this.loginForm.controls['email'];
  }

  get passwordControl() {
    return this.loginForm.controls['password'];
  }
}

