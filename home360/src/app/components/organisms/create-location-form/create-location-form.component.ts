import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { LocationService } from '@app/core/services/location/location.service';
import { Observable, catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { LocationRequest, LocationResponse } from '@app/core/models/location.model';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-create-location-form',
  templateUrl: './create-location-form.component.html',
  styleUrls: ['./create-location-form.component.scss']
})
export class CreateLocationFormComponent {
  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private translationService = inject(TranslationService);
  formMessages = FORM_MESSAGES;

  locationForm = this.fb.group({
    neighborhood: ['', [Validators.required, Validators.maxLength(50)]],
    cityDepartmentId: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(10)]]
  });

  formSubmitted = false;
  creationResult$!: Observable<CreationResult>;
  showMessage = false;

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
