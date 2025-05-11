import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  welcomeMessage: string = 'Bienvenido';
  userName: string | null = null;
  private storageSubscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName');
    this.updateWelcomeMessage();

    this.storageSubscription = new Subscription(() => {
      window.addEventListener('storage', (event) => {
        if (event.key === 'userName') {
          this.userName = localStorage.getItem('userName');
          this.updateWelcomeMessage();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.storageSubscription.unsubscribe();
  }

  private updateWelcomeMessage(): void {
    if (this.userName) {
      this.welcomeMessage = `Bienvenido, ${this.userName}`;
    } else {
      this.welcomeMessage = 'Bienvenido';
    }
  }
}
