import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { LocationService } from '@app/core/services/location/location.service';
import { Observable, catchError, of, map, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { LocationRequest, LocationResponse } from '@app/core/models/location.model';
import { HttpClient } from '@angular/common/http';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface CityDepartment {
  id: number;
  name: string;
  department: string;
}

@Component({
  selector: 'app-create-location-form',
  templateUrl: './create-location-form.component.html',
  styleUrls: ['./create-location-form.component.scss']
})
export class CreateLocationFormComponent implements OnInit, OnDestroy {
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
  creationResult$: Observable<CreationResult | null> = of(null);
  citiesDepartments: CityDepartment[] = [];
  private subscription = new Subscription();
  private formChangesSubscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.http.get<CityDepartment[]>('assets/city-departments.json')
        .subscribe(data => {
          this.citiesDepartments = data;
        })
    );


    this.formChangesSubscription.add(
      this.locationForm.valueChanges.subscribe(() => {
        this.creationResult$ = of(null);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.formChangesSubscription.unsubscribe();
  }

  handleCreateLocation(): void {
    this.formSubmitted = true;

    if (this.locationForm.invalid) {
      this.creationResult$ = of({ success: false, error: this.formMessages.INVALID_FORM });
      return;
    }

    const neighborhood = this.locationForm.get('neighborhood')?.value ?? '';
    const cityDepartmentId = Number(this.locationForm.get('cityDepartmentId')?.value ?? '');
    const locationRequest: LocationRequest = { neighborhood, cityDepartmentId };

    this.creationResult$ = this.locationService.createLocation(locationRequest).pipe(
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
    );
  }
}
