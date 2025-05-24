import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateLocationFormComponent } from './create-location-form.component';
import { MockTextareaFieldComponent } from '@app/shared/mocks/mock-textarea-field.component';
import { MockButtonComponent } from '@app/shared/mocks/mock-button.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LocationService } from '@app/core/services/location/location.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LocationResponse } from '@app/core/models/location.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('CreateLocationFormComponent', () => {
  let component: CreateLocationFormComponent;
  let fixture: ComponentFixture<CreateLocationFormComponent>;
  let locationService: LocationService;
  let translationService: TranslationService;
  let httpTestingController: HttpTestingController;

  const mockCityDepartments = [
    { id: 1, name: 'Ciudad1', department: 'Depto1' },
    { id: 2, name: 'Ciudad2', department: 'Depto2' },
  ];

  beforeEach(async () => {
    const locationServiceMock = {
      createLocation: jest.fn()
    };

    const translationServiceMock = {
      translate: jest.fn((msg: string) => msg)
    };

    await TestBed.configureTestingModule({
      declarations: [
        CreateLocationFormComponent,
        MockTextareaFieldComponent,
        MockButtonComponent,
      ],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
      ],
      providers: [
        FormBuilder,
        { provide: LocationService, useValue: locationServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLocationFormComponent);
    component = fixture.componentInstance;

    locationService = TestBed.inject(LocationService);
    translationService = TestBed.inject(TranslationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load citiesDepartments from JSON on init', () => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/city-departments.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockCityDepartments);

    expect(component.citiesDepartments.length).toBe(2);
    expect(component.citiesDepartments[0].name).toBe('Ciudad1');
  });

  it('should show required validation errors if form is invalid on submit', () => {
    fixture.detectChanges();
    const req = httpTestingController.expectOne('assets/city-departments.json');
    req.flush(mockCityDepartments);

    component.handleCreateLocation();

    expect(component.creationResult$).toBeDefined();

    component.creationResult$.subscribe(result => {
      expect(result?.success).toBe(false);
      expect(result?.error).toBe(component.formMessages.INVALID_FORM);
    });
  });

  it('should call createLocation and reset form on success', fakeAsync(() => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/city-departments.json');
    req.flush(mockCityDepartments);

    component.locationForm.setValue({
      neighborhood: 'Barrio Test',
      cityDepartmentId: mockCityDepartments[0].id.toString(),
    });

    const responseMock = { message: 'Location created successfully' };
    (locationService.createLocation as jest.Mock).mockReturnValue(of(responseMock));

    component.handleCreateLocation();

    component.creationResult$.subscribe(result => {
      expect(result?.success).toBe(true);
      expect(result?.message).toBe(responseMock.message);
    });

    tick();

    expect(component.locationForm.pristine).toBe(true);
    expect(component.locationForm.value.neighborhood).toBeNull();
  }));
  it('should extract form values and call createLocation when form is valid', () => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/city-departments.json');
    req.flush(mockCityDepartments);

    component.locationForm.setValue({
      neighborhood: 'Some Neighborhood',
      cityDepartmentId: mockCityDepartments[0].id.toString(),
    });

    const mockResponse: LocationResponse = { message: 'Location created' };
    jest.spyOn(component['locationService'], 'createLocation').mockReturnValue(of(mockResponse));

    component.handleCreateLocation();

    component.creationResult$.subscribe(result => {
      expect(result?.success).toBe(true);
      expect(result?.message).toBe(translationService.translate(mockResponse.message));
    });
  });


  it('should handle error on createLocation failure', fakeAsync(() => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/city-departments.json');
    req.flush(mockCityDepartments);

    component.locationForm.setValue({
      neighborhood: 'Barrio Test',
      cityDepartmentId: mockCityDepartments[0].id.toString(),
    });

    const errorResponse = {
      error: { message: 'Error from server' }
    };
    (locationService.createLocation as jest.Mock).mockReturnValue(throwError(() => errorResponse));

    component.handleCreateLocation();

    component.creationResult$.subscribe(result => {
      expect(result?.success).toBe(false);
      expect(result?.error).toBe(errorResponse.error.message);
    });

    tick();
  }));

  it('should clear creationResult$ when form value changes', () => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/city-departments.json');
    req.flush(mockCityDepartments);

    component.creationResult$ = of({ success: true, message: 'Some message' });

    component.locationForm.controls['neighborhood'].setValue('Nuevo Barrio');

    component.creationResult$.subscribe(result => {
      expect(result).toBeNull();
    });
  });

  describe('handleCreateLocation nullish cases', () => {
    const mockResponse: LocationResponse = { message: 'Success' };
    const mockError = new HttpErrorResponse({
      error: { message: 'Error' },
      status: 400
    });

    beforeEach(() => {
      // Mock necesario para cargar ciudades/departamentos
      fixture.detectChanges();
      const req = httpTestingController.expectOne('assets/city-departments.json');
      req.flush(mockCityDepartments);

      jest.spyOn(locationService, 'createLocation').mockReturnValue(of(mockResponse));
    });

    const testNullishCases = (neighborhoodValue: any, cityDepartmentIdValue: any) => {
      // Mockear form.invalid = false para bypassear validación
      jest.spyOn(component.locationForm, 'invalid', 'get').mockReturnValue(false);

      // Forzar valores en el formulario
      component.locationForm.patchValue({
        neighborhood: neighborhoodValue,
        cityDepartmentId: cityDepartmentIdValue
      });

      component.handleCreateLocation();
    };

    it('should handle null values in both fields', () => {
      testNullishCases(null, null);
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0 // Number('') => 0
      });
    });

    it('should handle undefined values in both fields', () => {
      testNullishCases(undefined, undefined);
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0
      });
    });

    it('should handle mixed null/undefined values', () => {
      testNullishCases(null, undefined);
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0
      });
    });

    it('should handle empty string values', () => {
      testNullishCases('', '');
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: '',
        cityDepartmentId: 0
      });
    });

    it('should handle valid values', () => {
      testNullishCases('Centro', '123');
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: 'Centro',
        cityDepartmentId: 123
      });
    });

    it('should handle numeric string conversion', () => {
      testNullishCases('North Area', '456');
      expect(locationService.createLocation).toHaveBeenCalledWith({
        neighborhood: 'North Area',
        cityDepartmentId: 456
      });
    });
  });
  //   const mockResponse: LocationResponse = { message: 'Success' };
  //   const mockError = new HttpErrorResponse({
  //     error: { message: 'Error' },
  //     status: 400
  //   });

  //   beforeEach(() => {
  //     jest.spyOn(locationService, 'createLocation').mockReturnValue(of(mockResponse));
  //     jest.spyOn(component, 'handleCreateLocation').mockImplementation();
  //   });

  //   const testNullishCases = (neighborhoodValue: any, cityDepartmentIdValue: any) => {
  //     component.locationForm.patchValue({
  //       neighborhood: neighborhoodValue,
  //       cityDepartmentId: cityDepartmentIdValue
  //     });

  //     jest.spyOn(component.locationForm, 'invalid', 'get').mockReturnValue(false);
  //     component.handleCreateLocation();
  //   };

  //   it('should handle null values in both fields', () => {
  //     testNullishCases(null, null);

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: '',
  //       cityDepartmentId: 0 // Number('') => 0
  //     });
  //   });

  //   it('should handle undefined values in both fields', () => {
  //     testNullishCases(undefined, undefined);

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: '',
  //       cityDepartmentId: 0
  //     });
  //   });

  //   it('should handle mixed null/undefined values', () => {
  //     testNullishCases(null, undefined);

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: '',
  //       cityDepartmentId: 0
  //     });
  //   });

  //   it('should handle empty string values', () => {
  //     testNullishCases('', '');

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: '',
  //       cityDepartmentId: 0
  //     });
  //   });

  //   it('should handle valid values', () => {
  //     testNullishCases('Centro', '123');

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: 'Centro',
  //       cityDepartmentId: 123
  //     });
  //   });

  //   it('should handle numeric string conversion', () => {
  //     testNullishCases('North Area', '456');

  //     expect(locationService.createLocation).toHaveBeenCalledWith({
  //       neighborhood: 'North Area',
  //       cityDepartmentId: 456
  //     });
  //   });
  // });

  describe('form submissions', () => {
    // it('should reset form on successful submission', () => {
    //   jest.spyOn(locationService, 'createLocation').mockReturnValue(of({ message: 'Success' }));
    //   component.locationForm.patchValue({
    //     neighborhood: 'Test',
    //     cityDepartmentId: '1'
    //   });

    //   component.handleCreateLocation();

    //   expect(component.locationForm.pristine).toBeTruthy();
    //   expect(component.formSubmitted).toBeFalsy();
    // });

    it('should handle API errors', () => {
      jest.spyOn(locationService, 'createLocation').mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { message: 'Error' } }))
      );

      component.handleCreateLocation();

      component.creationResult$.subscribe(result => {
        expect(result).toEqual({ success: false, error: 'translated Error' });
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

});
