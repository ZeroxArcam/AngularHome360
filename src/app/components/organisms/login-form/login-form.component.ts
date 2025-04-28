import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  email = '';
  password = '';

  @Output() login = new EventEmitter<{ email: string, password: string }>();

  onSubmit(event: Event) {
    event.preventDefault();
    this.login.emit({ email: this.email, password: this.password });
  }
}
