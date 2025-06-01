import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ListHomeComponent } from './list-home.component';
import { HomeService } from '@app/core/services/home/home.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MockFormFieldComponent } from '@shared/mocks/mock-form-field.component';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { PagedHomeRequest } from '@app/core/models/home.model';
import { mockCategoryPaginationResponse } from '@app/shared/mocks/category-mock';
import { mockCategoryPaginationResponsePage1, mockCategoryPaginationResponsePage2, mockCategoryList } from '@app/shared/mocks/category-mock';
import { mockLocationPaginationResponse, mockLocationPaginationResponsePage1, mockLocationPaginationResponsePage2, mockLocations } from '@app/shared/mocks/location-mock';

const mockTableData = [
  {
    id: 1,
    name: 'Property 1',
    price: 100000,
    neighborhood: 'Downtown',
    address: '123 Main St',
    description: 'A beautiful property',
    category: { id: 1, name: 'Apartment' },
    location: { id: 1, name: 'City Center' },
    rooms: 3,
    bathrooms: 2,
    user: { id: 1, name: 'John Doe' },
    images: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Property 2',
    price: 200000,
    neighborhood: 'Uptown',
    address: '456 Elm St',
    description: 'A spacious home',
    category: { id: 2, name: 'House' },
    location: { id: 2, name: 'Suburbs' },
    rooms: 4,
    bathrooms: 3,
    user: { id: 2, name: 'Jane Smith' },
    images: [],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  }
];

const mockPaginationResponse = {
  items: mockTableData,
  pageNumber: 0,
  totalPages: 1,
  totalElements: mockTableData.length,
  pageSize: 10
};



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
      locationId: null as number | null,
      categoryId: null as number | null,
      userId: null as number | null,
      homeId: null as number | null,
      minRooms: null as number | null,
      maxRooms: null as number | null,
      minBathrooms: null as number | null,
      maxBathrooms: null as number | null,
      minPrice: null as number | null,
      maxPrice: null as number | null,
      currentDate: null as string | null
    }
  };

  const homeServiceMock = {
    getProperties: jest.fn(() => of(mockPaginationResponse))
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule
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
        mockPaginationParams.value = {
          ...newValue,
          sortBy: newValue.sortBy ?? 'price',
          sortDirection: newValue.sortDirection ?? 'ASC',
          locationId: newValue.locationId ?? null,
          categoryId: newValue.categoryId ?? null,
          userId: newValue.userId ?? null,
          homeId: newValue.homeId ?? null,
          minRooms: newValue.minRooms ?? null,
          maxRooms: newValue.maxRooms ?? null,
          minBathrooms: newValue.minBathrooms ?? null,
          maxBathrooms: newValue.maxBathrooms ?? null,
          minPrice: newValue.minPrice ?? null,
          maxPrice: newValue.maxPrice ?? null,
          currentDate: newValue.currentDate instanceof Date ? newValue.currentDate.toISOString() : newValue.currentDate ?? null,
          page: typeof newValue.page === 'number' ? newValue.page : 0,
          size: typeof newValue.size === 'number' ? newValue.size : 10
        };
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

  });


  describe('handleResize', () => {
    let originalWindow: any;


    beforeEach(() => {
      originalWindow = (global as any).window;
    });

    afterEach(() => {
      (global as any).window = originalWindow;
    });


    it('should set isFiltersVisible to true when not mobile and filters are not visible', () => {
      (global as any).window = { innerWidth: 768 }; // Mock desktop
      component.isFiltersVisible = false;
      fixture.detectChanges();
      window.dispatchEvent(new Event('resize'));
      expect(component.isFiltersVisible).toBe(true);
    });

    it('should set isFiltersVisible to false when mobile and filters are visible', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 });
      component.isFiltersVisible = true;
      fixture.detectChanges();
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(component.isFiltersVisible).toBe(false);
    });

    it('should not change isFiltersVisible when not mobile and filters are visible', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      component.isFiltersVisible = true;
      fixture.detectChanges();
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(component.isFiltersVisible).toBe(true);
    });

    it('should not change isFiltersVisible when mobile and filters are not visible', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 });
      component.isFiltersVisible = false;
      fixture.detectChanges();
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(component.isFiltersVisible).toBe(false);
    });
  });

  it('should call ngOnInit and set up event listeners, load categories, and load locations', () => {
    const loadAllCategoriesSpy = jest.spyOn(component, 'loadAllCategories');
    const loadAllLocationsSpy = jest.spyOn(component, 'loadAllLocations');
    const handleResizeSpy = jest.spyOn(component, 'handleResize');
    const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');

    component.ngOnInit();

    expect(loadAllCategoriesSpy).toHaveBeenCalled();
    expect(loadAllLocationsSpy).toHaveBeenCalled();
    expect(handleResizeSpy).not.toHaveBeenCalled();
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', component.handleResize);
  });

  it('should call ngOnDestroy and remove event listeners and complete destroy$', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const destroyNextSpy = jest.spyOn((component as any).destroy$, 'next');
    const destroyCompleteSpy = jest.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', component.handleResize);
    expect(destroyNextSpy).toHaveBeenCalled();
    expect(destroyCompleteSpy).toHaveBeenCalled();
  });

  it('should update sortBy and sortDirection to ASC on mobile sort change', () => {
    const mockEvent = { target: { value: 'rooms' } } as unknown as Event;

    component.onMobileSortChange(mockEvent);

    expect(component.currentSortBy).toBe('rooms');
    expect(component.currentSortDirection).toBe('ASC');
    expect(mockPaginationParams.next).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'rooms',
        sortDirection: 'ASC',
        page: 0
      })
    );
  });

  it('should not update sortBy if event target is invalid', () => {
    const mockEvent = { target: null } as Event;

    expect(() => component.onMobileSortChange(mockEvent)).toThrowError();
    expect(mockPaginationParams.next).not.toHaveBeenCalled();
  });

  describe('onDesktopSortChange', () => {
    it('should update currentSortBy and call updateSort', () => {
      const updateSortSpy = jest.spyOn(component, 'updateSort');
      const mockEvent = { target: { value: 'rooms' } } as unknown as Event;

      component.onDesktopSortChange(mockEvent);

      expect(component.currentSortBy).toBe('rooms');
      expect(updateSortSpy).toHaveBeenCalled();
    });
  });

  describe('toggleSortDirection', () => {
    it('should toggle currentSortDirection and call updateSort', () => {
      const updateSortSpy = jest.spyOn(component, 'updateSort');

      component.currentSortDirection = 'ASC';
      component.toggleSortDirection();

      expect(component.currentSortDirection).toBe('DESC');
      expect(updateSortSpy).toHaveBeenCalled();

      component.toggleSortDirection();

      expect(component.currentSortDirection).toBe('ASC');
      expect(updateSortSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateSort', () => {
    it('should update paginationParams with currentSortBy and currentSortDirection', () => {
      component.currentSortBy = 'price';
      component.currentSortDirection = 'DESC';

      component.updateSort();

      expect(mockPaginationParams.next).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'price',
          sortDirection: 'DESC'
        })
      );
    });
  });

  it('should toggle filters visibility', () => {
    component.isFiltersVisible = false;

    component.toggleFiltersVisibility();
    expect(component.isFiltersVisible).toBe(true);

    component.toggleFiltersVisibility();
    expect(component.isFiltersVisible).toBe(false);
  });

  it('should update paginationParams with the correct page number', () => {
    const mockPageNumber = 2;

    component.goToPage(mockPageNumber);

    expect(mockPaginationParams.next).toHaveBeenCalledWith(
      expect.objectContaining({ page: mockPageNumber })
    );
  });

  it('should handle errors in propertiesDto$ observable', () => {
    const error = new Error('Service error');
    homeService.getProperties = jest.fn().mockReturnValue(throwError(() => error));

    component.propertiesDto$.subscribe({
      error: (err) => {
        expect(err).toBe(error);
      }
    });
  });
});
