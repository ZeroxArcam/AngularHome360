import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { CreateHomeFormComponent } from './create-home-form.component';
import { HomeService } from '../../../core/services/home/home.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError, Subject } from 'rxjs';
import { HomeRequest, HomeResponse } from '@app/core/models/home.model';
import { Component, Input, forwardRef } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-form-field',
  template: '',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MockFormFieldComponent),
    multi: true
  }]
})
class MockFormFieldComponent {
  @Input() label!: string;
  @Input() type: string = 'text';
  @Input() inputRequired: boolean = false;
  @Input() control!: FormControl;

  writeValue(obj: any): void { }
  registerOnChange(fn: any): void { }
  registerOnTouched(fn: any): void { }
}

describe('CreateHomeFormComponent', () => {
  let component: CreateHomeFormComponent;
  let fixture: ComponentFixture<CreateHomeFormComponent>;
  let httpMock: HttpTestingController;
  let homeService: jest.Mocked<HomeService>;
  let translationService: jest.Mocked<TranslationService>;

  const mockFormData = {
    name: 'Test Home',
    address: 'Test Address',
    description: 'Test Description',
    category: 'Test Category',
    numberOfRooms: 2 as unknown as null,
    numberOfBathrooms: 1 as unknown as null,
    price: 100000 as unknown as null,
    cityId: 1 as unknown as null,
    activePublicationDate: new Date(),
    publicationDate: new Date()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      declarations: [CreateHomeFormComponent, MockFormFieldComponent],
      providers: [
        {
          provide: HomeService,
          useValue: { createProperty: jest.fn() }
        },
        {
          provide: TranslationService,
          useValue: { translate: jest.fn() }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    homeService = TestBed.inject(HomeService) as jest.Mocked<HomeService>;
    translationService = TestBed.inject(TranslationService) as jest.Mocked<TranslationService>;
    httpMock = TestBed.inject(HttpTestingController);

    translationService.translate.mockImplementation((key: string) => key);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateHomeFormComponent);
    component = fixture.componentInstance;

    const req = httpMock.expectOne('/assets/city-departments.json');

    req.flush([{ id: 1, name: 'Valledupar', department: 'Cesar' }]);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.propertyForm.get('name')?.hasValidator(Validators.required)).toBe(true);
    expect(component.propertyForm.get('address')?.hasValidator(Validators.maxLength(100))).toBe(true);
    expect(component.propertyForm.get('price')?.hasValidator(Validators.min(0))).toBe(true);
  });

  it('should load cities on init', () => {
    expect(component.citiesDepartments.length).toBe(1);
    expect(component.citiesDepartments[0].name).toBe('Valledupar');
  });

  it('should handle error when loading cities', () => {
    httpMock.expectOne('/assets/city-departments.json').error(new ErrorEvent('Network error'));
    fixture = TestBed.createComponent(CreateHomeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.citiesDepartments).toEqual([]);
  });

  it('should submit valid form successfully', fakeAsync(() => {
    const mockResponse: HomeResponse = { message: 'Success', time: new Date().toISOString() };
    homeService.createProperty.mockReturnValue(of(mockResponse));

    component.propertyForm.patchValue({
      ...mockFormData,
      numberOfRooms: mockFormData.numberOfRooms as unknown as null,
      numberOfBathrooms: mockFormData.numberOfBathrooms as unknown as null,
      price: mockFormData.price as unknown as null,
      cityId: mockFormData.cityId as unknown as null
    });
    component.handleCreateHome();

    expect(homeService.createProperty).toHaveBeenCalledWith(mockFormData);

    let result: any;
    component.creationResult$.subscribe(res => result = res);

    tick(3000);
    expect(result).toBeNull();
    expect(component.propertyForm.pristine).toBe(true);
  }));

  it('should handle form submission errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'ERROR_MESSAGE' },
      status: 400
    });
    homeService.createProperty.mockReturnValue(throwError(() => errorResponse));

    component.propertyForm.patchValue({
      ...mockFormData,
      numberOfRooms: mockFormData.numberOfRooms as unknown as null,
      numberOfBathrooms: mockFormData.numberOfBathrooms as unknown as null,
      price: mockFormData.price as unknown as null,
      cityId: mockFormData.cityId as unknown as null
    });
    component.handleCreateHome();

    let result: any;
    component.creationResult$.subscribe(res => result = res);

    expect(result).toEqual({
      success: false,
      error: 'ERROR_MESSAGE'
    });
  });

  it('should show error for invalid form submission', () => {
    component.propertyForm.setErrors({ invalid: true });
    component.handleCreateHome();

    let result: any;
    component.creationResult$.subscribe(res => result = res);

    expect(homeService.createProperty).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: component.formMessages.INVALID_FORM
    });
  });

  it('should unsubscribe on destroy', () => {
    const destroy$ = component['destroy$'] as Subject<void>;
    const nextSpy = jest.spyOn(destroy$, 'next');
    const completeSpy = jest.spyOn(destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should handle maximum length validators', () => {
    const longName = 'a'.repeat(51);
    component.propertyForm.get('name')?.setValue(longName);
    expect(component.propertyForm.get('name')?.invalid).toBe(true);
  });

  it('should reset result message after 3 seconds', fakeAsync(() => {
    component.creationResult$.next({ success: true, message: 'Test' });
    tick(3000);

    let result: any;
    component.creationResult$.subscribe(res => result = res);

    expect(result).toBeNull();
  }));
});
