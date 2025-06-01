import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-dashboard-button',
  templateUrl: './dashboard-button.component.html',
  styleUrls: ['./dashboard-button.component.scss']
})
export class DashboardButtonComponent implements OnInit {
  // private router : inject(Router);


  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
  }

  goToDashboard() {
    this.authService.getUserRole().subscribe(role => {
      if (role === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else if (role === 'SELLER') {
        this.router.navigate(['/seller']);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }
}
