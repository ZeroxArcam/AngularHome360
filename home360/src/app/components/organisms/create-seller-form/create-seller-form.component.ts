import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SellerService } from '@app/core/services/seller/seller.service';
import { Observable, of, catchError, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { SellerRequest, CreateSellerResponse } from '@app/core/models/seller.model';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-create-seller-form',
  templateUrl: './create-seller-form.component.html',
  styleUrls: ['./create-seller-form.component.scss']
})
export class CreateSellerFormComponent {
  private fb = inject(FormBuilder);
  private sellerService = inject(SellerService);
  private translationService = inject(TranslationService);
  formMessages = FORM_MESSAGES;

  sellerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    idNumber: ['', [Validators.required, Validators.maxLength(20)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(20)]],
    birthDate: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    role: ['Seller']
  });

  formSubmitted = false;
  creationResult$!: Observable<CreationResult>;
  showMessage = false;

  handleCreateSeller(): void {
    this.formSubmitted = true;

    if (this.sellerForm.invalid) {
      this.creationResult$ = of({ success: false, error: this.formMessages.INVALID_FORM });
      return;
    }

    const sellerRequest: SellerRequest = {
      name: this.sellerForm.value.name!,
      lastName: this.sellerForm.value.lastName!,
      idNumber: this.sellerForm.value.idNumber!,
      phoneNumber: this.sellerForm.value.phoneNumber!,
      birthDate: this.sellerForm.value.birthDate!,
      email: this.sellerForm.value.email!,
      password: this.sellerForm.value.password!,
      role: this.sellerForm.value.role!
    };

    this.creationResult$ = this.sellerService.createSeller(sellerRequest).pipe(
      map((response: CreateSellerResponse) => {
        this.sellerForm.reset();
        this.formSubmitted = false;
        return {
          success: true,
          message: this.translationService.translate(response?.message),
        };
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.translationService.translate(error.error?.message);
        return of({ success: false, error: errorMessage });
      })
    );
  }
}
