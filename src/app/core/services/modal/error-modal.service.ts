import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorModalService {
  private errorMessageSource = new BehaviorSubject<string | null>(null);
  errorMessage$ = this.errorMessageSource.asObservable();

  private isModalVisibleSource = new BehaviorSubject<boolean>(false);
  isModalVisible$ = this.isModalVisibleSource.asObservable();

  showErrorModal(message: string) {
    this.errorMessageSource.next(message);
    this.isModalVisibleSource.next(true);
  }

  closeErrorModal() {
    this.errorMessageSource.next(null);
    this.isModalVisibleSource.next(false);
  }
}
