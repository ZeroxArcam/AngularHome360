import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ListHomeComponent } from './list-home.component';
import { HomeService } from '@app/core/services/home/home.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MockFormFieldComponent } from '@shared/mocks/mock-form-field.component';
import { mockPaginationResponse } from '@shared/mocks/home-mock';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { PagedHomeRequest } from '@app/core/models/home.model';
import { mockCategoryPaginationResponse } from '@app/shared/mocks/category-mock';
import { mockCategoryPaginationResponsePage1, mockCategoryPaginationResponsePage2, mockCategoryList } from '@app/shared/mocks/category-mock';
import { mockLocationPaginationResponse, mockLocationPaginationResponsePage1, mockLocationPaginationResponsePage2, mockLocations } from '@app/shared/mocks/location-mock';
import { LocationService } from '@app/core/services/location/location.service';



describe('ListHomeComponent', () => {
  let component: ListHomeComponent;
  let fixture: ComponentFixture<ListHomeComponent>;
  let homeService: HomeService;

  const mockPaginationParams = {
    next: jest.fn(),
    pipe: jest.fn().mockReturnValue(of(0)),
    value: {
      page: 0,
      size: 10,
      sortBy: 'price',
      sortDirection: 'ASC',
      locationId: null,
      categoryId: null,
      userId: null,
      homeId: null,
      minRooms: null,
      maxRooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      minPrice: null,
      maxPrice: null,
      currentDate: null
    } as PagedHomeRequest
  };

  const homeServiceMock = {
    getProperties: jest.fn(() => of(mockPaginationResponse))
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      declarations: [
        ListHomeComponent,
        MockFormFieldComponent
      ],
      providers: [
        { provide: HomeService, useValue: homeServiceMock },
        { provide: BehaviorSubject, useValue: mockPaginationParams },

      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListHomeComponent);
    component = fixture.componentInstance;

    (component as any).paginationParams = mockPaginationParams;
    homeService = TestBed.inject(HomeService);

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockPaginationParams.value.page = 0;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should load first page on init', () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(homeService.getProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
        size: 10,
        sortBy: 'price',
        sortDirection: 'ASC'
      })
    );
  });

  it('should render table with data', () => {
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.property-list__table');
    const rows = table.querySelectorAll('.property-list__table-row');

    expect(table).toBeTruthy();
    expect(rows.length).toBe(mockPaginationResponse.items.length);
  });

  it('should initialize filter form with default values', () => {
    expect(component.filterForm.value).toEqual({
      locationId: null,
      categoryId: null,
      userId: null,
      homeId: null,
      minRooms: null,
      maxRooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      minPrice: null,
      maxPrice: null,
      currentDate: null
    });
  });

  it('should update filters', fakeAsync(() => {
    mockPaginationParams.value = {
      ...mockPaginationParams.value,
      page: 1
    };

    component.filterForm.patchValue({ minRooms: 2 });

    tick(350);
    fixture.detectChanges();

    expect(mockPaginationParams.next).toHaveBeenCalledWith(
      expect.objectContaining({
        minRooms: 2,
        page: 0
      })
    );
  }));

  it('should call next page', () => {
    jest.spyOn(component.totalPages$, 'pipe').mockReturnValue(of(3));

    mockPaginationParams.value.page = 0;

    component.nextPage();

    expect(mockPaginationParams.next).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  describe('Pagination', () => {
    it('should go to previous page when possible', () => {
      mockPaginationParams.value.page = 1;
      component.prevPage();

      expect(mockPaginationParams.next).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });

    it('should not go to previous page when on first page', () => {
      mockPaginationParams.value.page = 0;
      component.prevPage();

      expect(mockPaginationParams.next).not.toHaveBeenCalled();
    });

    it('should handle multiple page decrements', () => {

      mockPaginationParams.next.mockImplementation((newValue: PagedHomeRequest) => {
        mockPaginationParams.value = newValue;
      });
      mockPaginationParams.value.page = 3;

      component.prevPage();
      component.prevPage();
      component.prevPage();

      expect(mockPaginationParams.next).toHaveBeenCalledTimes(3);
      expect(mockPaginationParams.value.page).toBe(0);
    });

    it('should load all categories', () => {
      const spy = jest.spyOn((component as any).categoryService, 'getCategories')
        .mockReturnValueOnce(of({ items: [], pageNumber: 0, totalPages: 1 }));

      component.loadAllCategories();

      expect(spy).toHaveBeenCalledWith(0, 10);
    });

    it('should load all categories when only one page is returned', fakeAsync(() => {
      const categoryServiceMock = {
        getCategories: jest.fn().mockReturnValue(of(mockCategoryPaginationResponse))
      };

      component['categoryService'] = categoryServiceMock as any;

      component.loadAllCategories();
      tick();

      expect(categoryServiceMock.getCategories).toHaveBeenCalledTimes(1);
      expect(component.categories).toEqual(mockCategoryPaginationResponse.items);
    }));

    it('should load all categories across multiple pages', fakeAsync(() => {
      const categoryServiceMock = {
        getCategories: jest
          .fn()
          .mockReturnValueOnce(of(mockCategoryPaginationResponsePage1))
          .mockReturnValueOnce(of(mockCategoryPaginationResponsePage2))
      };

      component['categoryService'] = categoryServiceMock as any;

      component.loadAllCategories();
      tick();

      expect(categoryServiceMock.getCategories).toHaveBeenCalledTimes(2);
      expect(component.categories).toEqual(mockCategoryList);
    }));

    it('should return empty array when getCategories fails (catchError)', fakeAsync(() => {
      const error = new Error('Something went wrong');
      const categoryServiceMock = {
        getCategories: jest.fn().mockReturnValue(throwError(() => error))
      };

      component['categoryService'] = categoryServiceMock as any;

      component.loadAllCategories();
      tick();

      expect(component.categories).toEqual([]);
    }));

    it('should load all locations', () => {
      const spy = jest.spyOn((component as any).locationService, 'getLocations')
        .mockReturnValueOnce(of({ items: [], pageNumber: 0, totalPages: 1 }));

      component.loadAllLocations();

      expect(spy).toHaveBeenCalledWith({ page: 0, size: 10 });
    });

    it('should load all locations when only one page is returned', fakeAsync(() => {
      const locationServiceMock = {
        getLocations: jest.fn().mockReturnValue(of(mockLocationPaginationResponse))
      };
      component['locationService'] = locationServiceMock as any;
      component.loadAllLocations();
      tick();
      expect(locationServiceMock.getLocations).toHaveBeenCalledTimes(1);
      expect(component.locations).toEqual(mockLocations);
    }));

    it('should load all locations across multiple pages', fakeAsync(() => {
      const locationServiceMock = {
        getLocations: jest
          .fn()
          .mockReturnValueOnce(of(mockLocationPaginationResponsePage1))
          .mockReturnValueOnce(of(mockLocationPaginationResponsePage2))
      };

      component['locationService'] = locationServiceMock as any;

      component.loadAllLocations();
      tick();

      expect(locationServiceMock.getLocations).toHaveBeenCalledTimes(2);
      expect(component.locations).toEqual(mockLocationPaginationResponse.items);
    }));

    it('should return empty array when getLocations fails (catchError)', fakeAsync(() => {
      const error = new Error('Something went wrong');
      const locationServiceMock = {
        getLocations: jest.fn().mockReturnValue(throwError(() => error))
      };

      component['locationService'] = locationServiceMock as any;

      component.loadAllLocations();
      tick();

      expect(component.locations).toEqual([]);
    }));

    it('should change sort direction', () => {
      component.toggleOrder('price');
      expect(mockPaginationParams.next).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'price',
          sortDirection: 'DESC'
        })
      );

      mockPaginationParams.value.sortDirection = 'DESC';
      component.toggleOrder('price');
      expect(mockPaginationParams.next).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'price',
          sortDirection: 'ASC'
        })
      );
    });
    it('should set sortBy and sortDirection to ASC when toggling to a new field', () => {
      component.currentSortBy = 'price';
      component.currentSortDirection = 'DESC';

      component.toggleOrder('bathrooms');
      expect(mockPaginationParams.next).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'bathrooms',
          sortDirection: 'ASC',
        })
      );
    });

    it('should toggle filters visibility', () => {

      component.toggleFiltersVisibility();
      expect(component.isFiltersVisible).toBe(false);

      component.toggleFiltersVisibility();
      expect(component.isFiltersVisible).toBe(true);
    });


  });
});
