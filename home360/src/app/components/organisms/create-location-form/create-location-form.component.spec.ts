import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateLocationFormComponent } from './create-location-form.component';
import { FormBuilder, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { LocationService } from '@app/core/services/location/location.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { Component, Input, forwardRef } from '@angular/core';

@Component({
  selector: 'app-textarea-field',
  template: '',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MockTextareaFieldComponent),
    multi: true
  }]
})
class MockTextareaFieldComponent implements ControlValueAccessor {
  @Input() placeholder!: string;
  @Input() textareaClass!: string;

  writeValue(obj: any): void { }
  registerOnChange(fn: any): void { }
  registerOnTouched(fn: any): void { }
  setDisabledState?(isDisabled: boolean): void { }
}

@Component({
  selector: 'app-button',
  template: ''
})
class MockButtonComponent {
  @Input() buttonText!: string;
  @Input() isPrimary!: boolean;
  @Input() type!: string;
}

describe('CreateLocationFormComponent', () => {
  let component: CreateLocationFormComponent;
  let fixture: ComponentFixture<CreateLocationFormComponent>;
  let locationServiceMock: any;
  let translationServiceMock: any;

  const mockSuccessResponse = { message: 'LOCATION_CREATED' };
  const mockErrorResponse = new HttpErrorResponse({
    error: { message: 'ERROR_OCCURRED' },
    status: 400
  });

  beforeEach(async () => {
    locationServiceMock = {
      createLocation: jest.fn()
    };

    translationServiceMock = {
      translate: jest.fn().mockImplementation((key) => key)
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        CreateLocationFormComponent,
        MockTextareaFieldComponent,
        MockButtonComponent
      ],
      providers: [
        FormBuilder,
        { provide: LocationService, useValue: locationServiceMock },
        { provide: TranslationService, useValue: translationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLocationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should have invalid form when empty', () => {
      expect(component.locationForm.valid).toBeFalsy();
    });

    it('should validate neighborhood field', () => {
      const field = component.locationForm.controls['neighborhood'];

      field.setValue('');
      expect(field.hasError('required')).toBeTruthy();

      field.setValue('a'.repeat(51));
      expect(field.hasError('maxlength')).toBeTruthy();
    });

    it('should validate cityDepartmentId field', () => {
      const field = component.locationForm.controls['cityDepartmentId'];

      field.setValue('');
      expect(field.hasError('required')).toBeTruthy();

      field.setValue('abc');
      expect(field.hasError('pattern')).toBeTruthy();

      field.setValue('1'.repeat(11));
      expect(field.hasError('maxlength')).toBeTruthy();
    });

    it('should convert null values to empty strings', () => {
      component.locationForm.patchValue({
        neighborhood: null,
        cityDepartmentId: null
      });

      jest.spyOn(component.locationForm, 'invalid', 'get').mockReturnValue(false);

      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));

      component.handleCreateLocation();

      expect(locationServiceMock.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0
      });
    });



  });

  describe('Form Submission', () => {
    it('should show error on invalid form submission', () => {
      component.handleCreateLocation();
      component.creationResult$!.subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe(FORM_MESSAGES.INVALID_FORM);
      });
    });

    it('should call service on valid form submission', () => {
      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test Neighborhood',
        cityDepartmentId: '123'
      });

      component.handleCreateLocation();

      expect(locationServiceMock.createLocation).toHaveBeenCalledWith({
        neighborhood: 'Test Neighborhood',
        cityDepartmentId: 123
      });
    });

    it('should handle successful creation', fakeAsync(() => {
      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test Neighborhood',
        cityDepartmentId: '123'
      });

      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      component.creationResult$!.subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('LOCATION_CREATED');
        expect(component.formSubmitted).toBe(false);
      });
    }));

    it('should handle creation error', fakeAsync(() => {
      locationServiceMock.createLocation.mockReturnValue(throwError(() => mockErrorResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test Neighborhood',
        cityDepartmentId: '123'
      });

      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      component.creationResult$!.subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('ERROR_OCCURRED');
      });
    }));

    it('should reset form after successful submission', fakeAsync(() => {
      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test',
        cityDepartmentId: '456'
      });

      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      expect(component.locationForm.value).toEqual({
        neighborhood: null,
        cityDepartmentId: null
      });
    }));

    it('should handle empty string values when form is valid', fakeAsync(() => {
      component.locationForm.patchValue({
        neighborhood: '',
        cityDepartmentId: ''
      });

      jest.spyOn(component.locationForm, 'invalid', 'get').mockReturnValue(false);
      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));
      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      expect(locationServiceMock.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0
      });
    }));

  });

  describe('Translation Service', () => {
    it('should translate success message', fakeAsync(() => {
      locationServiceMock.createLocation.mockReturnValue(of(mockSuccessResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test',
        cityDepartmentId: '123'
      });

      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      expect(translationServiceMock.translate).toHaveBeenCalledWith('LOCATION_CREATED');
    }));

    it('should translate error message', fakeAsync(() => {
      locationServiceMock.createLocation.mockReturnValue(throwError(() => mockErrorResponse));

      component.locationForm.patchValue({
        neighborhood: 'Test',
        cityDepartmentId: '123'
      });

      component.handleCreateLocation();
      tick();
      fixture.detectChanges();

      expect(translationServiceMock.translate).toHaveBeenCalledWith('ERROR_OCCURRED');
    }));
  });
});
