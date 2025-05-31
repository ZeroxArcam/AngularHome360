import { Component, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { LocationService } from '@app/core/services/location/location.service';
import { BehaviorSubject, Observable, of, catchError, map, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { LocationRequest, LocationResponse } from '@app/core/models/location.model';
import { HttpClient } from '@angular/common/http';
import { CityDepartment } from '@app/core/models/location.model';
import { CreationResult } from '@app/shared/interfaces/message.model';


@Component({
  selector: 'app-create-location-form',
  templateUrl: './create-location-form.component.html',
  styleUrls: ['./create-location-form.component.scss']
})
export class CreateLocationFormComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private translationService = inject(TranslationService);
  private http = inject(HttpClient);
  formMessages = FORM_MESSAGES;

  locationForm = this.fb.group({
    neighborhood: ['', [Validators.required, Validators.maxLength(50)]],
    cityDepartmentId: ['', [Validators.required]]
  });

  formSubmitted = false;
  creationResult$ = new BehaviorSubject<CreationResult | null>(null);
  citiesDepartments: CityDepartment[] = [];
  private subscription = new Subscription();
  private formChangesSubscription = new Subscription();
  private hideMessageTimeout: any;

  ngOnInit(): void {
    this.subscription.add(
      this.http.get<CityDepartment[]>('assets/city-departments.json')
        .subscribe(data => {
          this.citiesDepartments = data;
        })
    );


    this.formChangesSubscription.add(
      this.locationForm.valueChanges.subscribe(() => {
        this.clearCreationResult();
      })
    );
  }

  ngAfterViewInit(): void {
    const formElement = document.querySelector('.create-location-form__form');
    if (formElement) {
      formElement.addEventListener('focusin', () => {
        this.clearCreationResult();
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.formChangesSubscription.unsubscribe();
    if (this.hideMessageTimeout) {
      clearTimeout(this.hideMessageTimeout);
    }
  }

  handleCreateLocation(): void {
    this.formSubmitted = true;

    if (this.locationForm.invalid) {
      this.creationResult$.next({ success: false, error: this.formMessages.INVALID_FORM });
      this.setAutoHideMessage();
      return;
    }

    const neighborhood = this.locationForm.get('neighborhood')?.value ?? '';
    const cityDepartmentId = Number(this.locationForm.get('cityDepartmentId')?.value ?? '');
    const locationRequest: LocationRequest = { neighborhood, cityDepartmentId };

    this.locationService.createLocation(locationRequest).pipe(
      map((response: LocationResponse) => {
        this.locationForm.reset();
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
    ).subscribe(result => {
      this.creationResult$.next(result);
      this.setAutoHideMessage();
    });
  }

  private setAutoHideMessage(): void {
    if (this.hideMessageTimeout) {
      clearTimeout(this.hideMessageTimeout);
    }
    this.hideMessageTimeout = setTimeout(() => {
      this.clearCreationResult();
    }, 3000);
  }

  private clearCreationResult(): void {
    if (this.hideMessageTimeout) {
      clearTimeout(this.hideMessageTimeout);
    }
    this.creationResult$.next(null);
  }
}
