import { Component, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormControl } from '@angular/forms';
import { SellerService } from '@app/core/services/seller/seller.service';
import { Observable, of, catchError, map, Subscription, Subject, takeUntil } from 'rxjs'; // Import Subject
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { SellerRequest, CreateSellerResponse } from '@app/core/models/seller.model';
import * as moment from 'moment-timezone';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function ageValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const birthDateValue = control.value;

    if (!birthDateValue) {
      return null;
    }

    const birthDate = moment.tz(birthDateValue, 'America/Bogota');
    const today = moment.tz('America/Bogota');
    const age = today.diff(birthDate, 'years');

    if (age < 18) {
      return { underage: true };
    }

    return null;
  };
}
export function emailValidatorCustom(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const email = control.value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/; // Definido aquí
    if (!email) {
      return null;
    }
    if (!emailRegex.test(email)) {
      return { invalidEmailCustom: true };
    }
    return null;
  };
}
@Component({
  selector: 'app-create-seller-form',
  templateUrl: './create-seller-form.component.html',
  styleUrls: ['./create-seller-form.component.scss']
})
export class CreateSellerFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private sellerService = inject(SellerService);
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  formMessages = FORM_MESSAGES;

  sellerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    idNumber: ['', [Validators.required, Validators.maxLength(20)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(13)]],
    birthDate: ['', [Validators.required, ageValidator()]],
    email: ['', [Validators.required, emailValidatorCustom(), Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    role: ['Seller']
  });

  formSubmitted = false;
  creationResult$ = new Subject<CreationResult | null>();
  formChangesSubscription = new Subscription();
  private destroy$ = new Subject<void>();

  get birthDateControl(): FormControl {
    return this.sellerForm.get('birthDate') as FormControl;
  }

  ngOnInit(): void {
    this.formChangesSubscription.add(
      this.sellerForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.creationResult$.next(null);
      })
    );
  }

  ngOnDestroy(): void {
    this.formChangesSubscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleCreateSeller(): void {
    console.log('handleCreateSeller ejecutado');
    this.formSubmitted = true;

    if (this.sellerForm.invalid) {
      let errorMessage = this.formMessages.INVALID_FORM;
      if (this.birthDateControl.hasError('underage')) {
        errorMessage = this.formMessages.UNDERAGE;
      }
      this.creationResult$.next({ success: false, error: errorMessage });
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

    this.sellerService.createSeller(sellerRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: CreateSellerResponse) => {
        this.sellerForm.reset({
          name: '',
          lastName: '',
          idNumber: '',
          phoneNumber: '',
          birthDate: '',
          email: '',
          password: '',
          role: 'Seller'
        });

        this.formSubmitted = false;
        this.creationResult$.next({
          success: true,
          message: this.translationService.translate(response?.message),
        });
        this.cdr.detectChanges()
        setTimeout(() => {
          this.creationResult$.next(null);
        }, 3000);
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = this.translationService.translate(error.error?.message);
        this.formSubmitted = false;
        this.creationResult$.next({ success: false, error: errorMessage });
      },
    });
  }
}
