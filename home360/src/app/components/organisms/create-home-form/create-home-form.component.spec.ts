import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { CreateHomeFormComponent } from './create-home-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CategoryService } from '@app/core/services/category/category.service';
import { HomeService } from '@app/core/services/home/home.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { mockCategoryPaginationResponse, mockCategoryList } from '@app/shared/mocks/category-mock';
import { mockHomeResponse } from '@app/shared/mocks/home-mock';
import { ChangeDetectorRef } from '@angular/core';
import { MockFormFieldComponent } from '@app/shared/mocks/mock-form-field.component';
import { MockTextareaFieldComponent } from '@app/shared/mocks/mock-textarea-field.component';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mockCityDepartments } from '@app/shared/mocks/location-mock';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Category } from '@app/core/models/category.model';

describe('CreateHomeFormComponent', () => {
  let component: CreateHomeFormComponent;
  let fixture: ComponentFixture<CreateHomeFormComponent>;
  let homeService: jest.Mocked<HomeService>;
  let categoryService: jest.Mocked<CategoryService>;
  let translationService: jest.Mocked<TranslationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [CreateHomeFormComponent, MockFormFieldComponent, MockTextareaFieldComponent],
      providers: [
        { provide: HomeService, useValue: { createProperty: jest.fn() } },
        { provide: CategoryService, useValue: { getCategories: jest.fn() } },
        { provide: TranslationService, useValue: { translate: jest.fn((key: string) => key) } },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHomeFormComponent);
    component = fixture.componentInstance;

    homeService = TestBed.inject(HomeService) as jest.Mocked<HomeService>;
    categoryService = TestBed.inject(CategoryService) as jest.Mocked<CategoryService>;
    translationService = TestBed.inject(TranslationService) as jest.Mocked<TranslationService>;

    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadAllCategories() pagination logic', () => {
    const mockPage1: PaginationResponse<Category> = {
      items: [
        { id: 1, name: 'Category 1', description: 'Desc 1' },
        { id: 2, name: 'Category 2', description: 'Desc 2' }
      ],
      pageNumber: 0,
      totalPages: 2,
      totalElements: 20,
      pageSize: 10
    };

    const mockPage2: PaginationResponse<Category> = {
      items: [
        { id: 3, name: 'Category 3', description: 'Desc 3' }
      ],
      pageNumber: 1,
      totalPages: 2,
      totalElements: 20,
      pageSize: 10
    };

    it('should recursively fetch all pages until complete', fakeAsync(() => {
      categoryService.getCategories
        .mockReturnValueOnce(of(mockPage1))
        .mockReturnValueOnce(of(mockPage2));

      component.loadAllCategories();
      tick();

      expect(categoryService.getCategories).toHaveBeenCalledWith(0, 10);
      expect(categoryService.getCategories).toHaveBeenCalledWith(1, 10);

      expect(component.categories).toEqual([...mockPage1.items, ...mockPage2.items]);
    }));

    it('should stop pagination when last page is reached', fakeAsync(() => {
      const finalPage = {
        items: [{ id: 4, name: 'Cat4' }],
        pageNumber: 3,
        totalPages: 4
      };

      categoryService.getCategories.mockImplementation((page?: number) => {
        return of({
          items: [/* ... */],
          pageNumber: page,
          totalPages: 3,
          totalElements: 30,
          pageSize: 10
        } as PaginationResponse<Category>);
      });

      component.loadAllCategories();
      tick();

      expect(categoryService.getCategories).toHaveBeenCalledTimes(3);
    }));

    it('should handle error during pagination', fakeAsync(() => {
      const errorSpy = jest.spyOn(component.creationResult$, 'next');
      const errorResponse = new HttpErrorResponse({
        error: { message: 'PAGINATION_ERROR' }
      });

      categoryService.getCategories
        .mockReturnValueOnce(of(mockPage1))
        .mockReturnValueOnce(throwError(() => errorResponse));

      component.loadAllCategories();
      tick();

      expect(errorSpy).toHaveBeenCalledWith({
        success: false,
        error: 'PAGINATION_ERROR'
      });
    }));
  });

  it('should load all categories and store them in the component', () => {
    categoryService.getCategories = jest
      .fn()
      .mockReturnValue(of(mockCategoryPaginationResponse));

    component.loadAllCategories();
    fixture.detectChanges();

    expect(component.categories).toEqual(mockCategoryList);
  });


  it('should handle error when loading categories', () => {
    const errorSpy = jest.spyOn(component.creationResult$, 'next');
    const errorResponse = new HttpErrorResponse({
      error: { message: 'ERROR_CATEGORIES' },
      status: 500
    });

    categoryService.getCategories.mockReturnValue(throwError(() => errorResponse));

    component.loadAllCategories();

    expect(errorSpy).toHaveBeenCalledWith({
      success: false,
      error: 'ERROR_CATEGORIES'
    });
  });

  it('should sanitize negative values and trim length in onInputChange', () => {
    const event = {
      target: {
        value: '-12345',
        type: 'number'
      }
    };

    component.onInputChange(event, 'numberOfRooms', 4);

    expect(component.propertyForm.controls.numberOfRooms.value).toBe('12345');
  });
  it('should trim value to maxLength when exceeding character limit', () => {
    const event = {
      target: {
        value: '1234567890',
        type: 'text'
      }
    };

    component.onInputChange(event, 'address', 5);

    expect(event.target.value).toBe('12345');
    expect(component.propertyForm.controls.address.value).toBe('12345');
  });



  it('should reset creation result on form changes', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const categoryService = TestBed.inject(CategoryService);

    jest.spyOn(http, 'get').mockReturnValue(of(mockCityDepartments));
    categoryService.getCategories = jest.fn().mockReturnValue(of(mockCategoryPaginationResponse));

    const spy = jest.spyOn(component.creationResult$, 'next');

    component.ngOnInit();
    flush();

    component.propertyForm.get('name')?.setValue('New Value');
    tick();

    expect(spy).toHaveBeenCalledWith(null);
  }));

  it('should return current date in YYYY-MM-DD format', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    expect(component.getTodayDate()).toBe(expected);
  });

  it('should emit an error result if form is invalid when submitting', () => {
    const spy = jest.spyOn(component.creationResult$, 'next');
    component.propertyForm.patchValue({ name: '' });
    component.handleCreateHome();
    expect(spy).toHaveBeenCalledWith({ success: false, error: component.formMessages.INVALID_FORM });
  });
  it('should validate numeric fields', () => {
    const controls = component.propertyForm.controls;

    controls.numberOfRooms.setValue(0);
    controls.numberOfBathrooms.setValue(-1);
    controls.price.setValue(null);

    expect(controls.numberOfRooms.hasError('min')).toBe(true);
    expect(controls.numberOfBathrooms.hasError('min')).toBe(true);
    expect(controls.price.hasError('required')).toBe(true);
  });
  it('should call createProperty and reset form if form is valid', fakeAsync(() => {
    const today = new Date('2025-05-11');
    const publicationDate = new Date(today);
    const activePublicationDate = new Date(today);
    activePublicationDate.setDate(activePublicationDate.getDate() + 1);

    const spy = jest.spyOn(component.creationResult$, 'next');
    const spyCdr = jest.spyOn(component['cdr'], 'detectChanges');

    homeService.createProperty.mockReturnValue(of(mockHomeResponse));

    component.propertyForm.patchValue({
      name: 'Casa 1',
      address: 'Calle falsa 123',
      description: 'Bonita casa',
      category: 'Apartamento',
      numberOfRooms: 3,
      numberOfBathrooms: 2,
      price: 120000,
      cityId: 1,
      publicationDate,
      activePublicationDate
    });

    expect(component.propertyForm.valid).toBe(true);
    component.handleCreateHome();
    flush();

    expect(homeService.createProperty).toHaveBeenCalled();
    expect(component.formSubmitted).toBe(false);
    expect(spy).toHaveBeenCalledWith({
      success: true,
      message: mockHomeResponse.message,
    });
    expect(spyCdr).toHaveBeenCalled();
  }));


  it('should handle error in createProperty', fakeAsync(() => {
    const spy = jest.fn();
    component.creationResult$.subscribe(spy);

    component.propertyForm.setValue({
      name: 'Casa 1',
      address: 'Calle falsa 123',
      description: 'Bonita casa',
      category: 'Apartamento',
      numberOfRooms: 3,
      numberOfBathrooms: 2,
      price: 120000,
      cityId: 1,
      activePublicationDate: new Date(),
      publicationDate: new Date()
    });

    const errorResponse = new HttpErrorResponse({
      error: { message: 'ERROR_BACKEND' },
      status: 400,
    });

    jest.spyOn(homeService, 'createProperty').mockReturnValue(throwError(() => errorResponse));

    component.handleCreateHome();
    tick();

    expect(spy).toHaveBeenCalledWith({ success: false, error: 'ERROR_BACKEND' });
  }));


  it('should calculate correct maxPublicationDate', () => {
    const today = new Date();
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() + 30);
    component.calculatePublicationDateLimits();
    expect(component.maxPublicationDate).toBe(component.formatDate(expectedDate));
  });

  it('should calculate active publication date limits correctly', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 10);

    component.calculateActivePublicationDateLimits(future);

    const min = component.formatDate(future > today ? future : today);
    const max = new Date(future);
    max.setDate(future.getDate() + 30);
    const absoluteMax = new Date(today);
    absoluteMax.setDate(today.getDate() + 30);

    const expectedMax = max > absoluteMax ? absoluteMax : max;
    expect(component.minActivePublicationDate).toBe(min);
    expect(component.maxActivePublicationDate).toBe(component.formatDate(expectedMax));
  });
  it('should handle publication date earlier than today', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    component.calculateActivePublicationDateLimits(pastDate);

    expect(component.minActivePublicationDate).toBe(component.getTodayDate());
  });


});
