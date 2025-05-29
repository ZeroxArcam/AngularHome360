import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { HomePageComponent } from './home-page.component';
import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';

const mockHomeFacadeService = {
  getHomesWithAvailability: jest.fn().mockReturnValue(of({ items: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 9 })),
  getCategories: jest.fn().mockReturnValue(of({ items: [] })),
  getLocations: jest.fn().mockReturnValue(of([])),
  getAvailableTimeSlots: jest.fn().mockReturnValue(of([])),
};

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let RealDate: DateConstructor;

  beforeAll(() => {
    RealDate = Date;
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  beforeEach(async () => {
    global.Date = RealDate;
    await TestBed.configureTestingModule({
      declarations: [HomePageComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: HomeFacadeService, useValue: mockHomeFacadeService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Date should be defined', () => {
    expect(Date).toBeDefined();
    expect(typeof Date.now).toBe('function');
  });

  it('should initialize filterForm with default values', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('minRoomsControl')).toBeDefined();
    expect(component.filterForm.get('maxRoomsControl')).toBeDefined();
  });

  it('should call loadProperties on ngOnInit', () => {
    const spy = jest.spyOn(component, 'loadProperties');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should call homeFacade.getHomesWithAvailability when loadProperties is called', () => {
    const spy = jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability');
    component.loadProperties();
    expect(spy).toHaveBeenCalled();
  });

  it('should reset filters when clearAllFilters is called', () => {
    component.filterForm.patchValue({ minRoomsControl: null, maxRoomsControl: null });
    component.clearAllFilters();
    expect(component.filterForm.get('minRoomsControl')?.value).toBeNull();
    expect(component.filterForm.get('maxRoomsControl')?.value).toBeNull();
  });

  it('should reset currentPage and call loadProperties when sortByControl changes', fakeAsync(() => {
    const spy = jest.spyOn(component, 'loadProperties');
    component.currentPage = 5;
    component.filterForm.get('sortByControl')?.setValue('numberOfRooms');
    tick();
    expect(component.currentPage).toBe(0);
    expect(spy).toHaveBeenCalled();
  }));

  it('should call checkTimeSlotFilters when any date/time filter changes', () => {
    const spy = jest.spyOn(component as any, 'checkTimeSlotFilters');
    ['minDateControl', 'maxDateControl', 'minTimeControl', 'maxTimeControl'].forEach(controlName => {
      component.filterForm.get(controlName)?.setValue('2025-05-25');
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should update filteredLocations and flags when locationSearchControl emits a valid value', fakeAsync(() => {
    const locationsMock = [{ id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca' }];
    mockHomeFacadeService.getLocations.mockReturnValue(of(locationsMock));
    component.lastSelectedLocationDisplay = null;
    component.previousInputValue = '';
    component.locationSearchControl.setValue('Bogotá');
    tick(1200);
    fixture.detectChanges();
    expect(component.filteredLocations).toEqual(locationsMock);
    expect(component.isLoadingLocations).toBe(false);
    expect(component.showAutocompleteResults).toBe(true);
    expect(component.isTyping).toBe(false);
  }));

  it('should NOT trigger search or update filteredLocations when locationSearchControl emits null (first filter)', fakeAsync(() => {
    const spy = jest.spyOn(mockHomeFacadeService, 'getLocations');
    spy.mockClear();

    component.locationSearchControl.setValue(null);
    tick(600);
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
    expect(component.filteredLocations).toEqual([]);
  }));
  it('should return empty array from switchMap when locationSearchControl emits null', fakeAsync(() => {
    jest.useFakeTimers();
    component.lastSelectedLocationDisplay = 'something';
    component.selectionMade = false;
    component.locationSearchControl.setValue(null);
    tick(600);
    fixture.detectChanges();
    expect(component.filteredLocations).toEqual([]);
    expect(component.isLoadingLocations).toBe(false);
    jest.useRealTimers();
  }));

  it('should handle empty locationSearchControl value on focus', () => {
    component.locationSearchControl.setValue('');
    component.onFocus();
    expect(component.showAutocompleteResults).toBe(false);
  });

  describe('rangeValidator', () => {
    it('should return error if min > max', () => {
      const group: any = {
        get: (name: string) => ({
          value: name === 'minRoomsControl' ? 5 : 2,
          setErrors: jest.fn(),
          hasError: jest.fn().mockReturnValue(false),
          errors: null
        })
      };
      const validator = (component as any).rangeValidator('minRoomsControl', 'maxRoomsControl', 'minRoomsGreaterThanMax');
      const result = validator(group);
      expect(result).toEqual({ minRoomsGreaterThanMax: true });
    });

    it('should clear error if min <= max and error was present', () => {
      const setErrorsMock = jest.fn();
      const group: any = {
        get: (name: string) => ({
          value: name === 'minRoomsControl' ? 2 : 5,
          setErrors: setErrorsMock,
          hasError: jest.fn().mockReturnValue(true),
          errors: { minRoomsGreaterThanMax: true, other: true }
        })
      };
      const validator = (component as any).rangeValidator('minRoomsControl', 'maxRoomsControl', 'minRoomsGreaterThanMax');
      const result = validator(group);
      expect(result).toBeNull();
      expect(setErrorsMock).toHaveBeenCalledWith({ other: true });
    });

    it('should clear all errors if no errors remain after deleting', () => {
      const setErrorsMock = jest.fn();
      const group: any = {
        get: (name: string) => ({
          value: name === 'minRoomsControl' ? 2 : 5,
          setErrors: setErrorsMock,
          hasError: jest.fn().mockReturnValue(true),
          errors: { minRoomsGreaterThanMax: true }
        })
      };
      const validator = (component as any).rangeValidator('minRoomsControl', 'maxRoomsControl', 'minRoomsGreaterThanMax');
      const result = validator(group);
      expect(result).toBeNull();
      expect(setErrorsMock).toHaveBeenCalledWith(null);
    });

    it('should return null if controls are missing', () => {
      const group: any = {
        get: jest.fn().mockReturnValue(null)
      };
      const validator = (component as any).rangeValidator('minRoomsControl', 'maxRoomsControl', 'minRoomsGreaterThanMax');
      const result = validator(group);
      expect(result).toBeNull();
    });
  });

  describe('dateTimeRangeValidator', () => {
    it('should return null if any control is missing', () => {
      const group: any = {
        get: (name: string) => null
      };
      const validator = (component as any).dateTimeRangeValidator();
      const result = validator(group);
      expect(result).toBeNull();
    });

    it('should set minDateTimeInPast if minDateTime is in the past', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const minDateValue = yesterday.toISOString().slice(0, 10);
      const minTimeValue = '00:00';
      const group: any = {
        get: (name: string) => ({
          value: name === 'minDateControl' ? minDateValue :
            name === 'minTimeControl' ? minTimeValue :
              name === 'maxDateControl' ? null :
                name === 'maxTimeControl' ? null : null
        })
      };
      const validator = (component as any).dateTimeRangeValidator();
      const result = validator(group);
      expect(result).toEqual({ minDateTimeInPast: true });
    });

    it('should set minDateAfterMaxDate if minDate > maxDate', () => {
      const minDateValue = '2099-05-26';
      const maxDateValue = '2099-05-25';
      const group: any = {
        get: (name: string) => ({
          value: name === 'minDateControl' ? minDateValue :
            name === 'maxDateControl' ? maxDateValue :
              null
        })
      };
      const validator = (component as any).dateTimeRangeValidator();
      const result = validator(group);
      expect(result).toEqual({ minDateAfterMaxDate: true });
    });

    it('should set minTimeAfterMaxTime if minDate == maxDate and minTime > maxTime', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const minDateValue = futureDate.toISOString().slice(0, 10);
      const maxDateValue = minDateValue;
      const minTimeValue = '15:00';
      const maxTimeValue = '14:00';
      const group: any = {
        get: (name: string) => ({
          value: name === 'minDateControl' ? minDateValue :
            name === 'maxDateControl' ? maxDateValue :
              name === 'minTimeControl' ? minTimeValue :
                name === 'maxTimeControl' ? maxTimeValue : null
        })
      };
      const validator = (component as any).dateTimeRangeValidator();
      const result = validator(group);
      expect(result).toEqual({ minTimeAfterMaxTime: true });
    });
  });

  describe('onAutocompleteSelect', () => {
    it('should set locationSearchControl value with correct format and update related properties', () => {
      const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');
      const loadPropertiesSpy = jest.spyOn(component, 'loadProperties');
      const location = {
        id: 123,
        cityName: 'Bogotá',
        departmentName: 'Cundinamarca',
        neighborhood: 'Chicó'
      };
      component.currentPage = 5;
      component.filteredLocations = [{ id: 1, cityName: 'X', departmentName: 'Y', neighborhood: '' }];
      component.selectionMade = false;
      component.showAutocompleteResults = true;
      component.lastSelectedLocationDisplay = null;
      component.selectedLocationId = null;
      component.locationSearchControl.setValue('');

      component.onAutocompleteSelect(location as any);

      expect(component.locationSearchControl.value).toBe('Bogotá - Cundinamarca - Chicó ');
      expect(component.lastSelectedLocationDisplay).toBe('Bogotá - Cundinamarca - Chicó ');
      expect(component.selectedLocationId).toBe(123);
      expect(component.selectionMade).toBe(true);
      expect(component.showAutocompleteResults).toBe(false);
      expect(component.filteredLocations).toEqual([]);
      expect(component.currentPage).toBe(0);
      expect(detectChangesSpy).toHaveBeenCalled();
      expect(loadPropertiesSpy).toHaveBeenCalled();
    });

    it('should omit neighborhood if not present', () => {
      const location = {
        id: 456,
        cityName: 'Medellín',
        departmentName: 'Antioquia',
      };
      component.locationSearchControl.setValue('');
      component.onAutocompleteSelect(location as any);
      expect(component.locationSearchControl.value).toBe('Medellín - Antioquia ');
    });

  });

  describe('UI focus/blur/enter', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      component['cdr'] = { detectChanges: jest.fn() } as any;
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should hide autocomplete results on blur after timeout', fakeAsync(() => {
      component.showAutocompleteResults = true;
      component.onBlur();
      expect(component.showAutocompleteResults).toBe(true);
      tick(151);
      expect(component.showAutocompleteResults).toBe(false);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    }));

    it('should show autocomplete results on focus if value is valid and not selected', () => {
      component.locationSearchControl.setValue('Bogotá');
      component.selectionMade = false;
      component.showAutocompleteResults = false;
      component['cdr'] = { detectChanges: jest.fn() } as any;
      component.onFocus();
      expect(component.showAutocompleteResults).toBe(true);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should not show autocomplete results on focus if value is too short', () => {
      component.locationSearchControl.setValue('B');
      component.selectionMade = false;
      component.showAutocompleteResults = false;
      component['cdr'] = { detectChanges: jest.fn() } as any;
      component.onFocus();
      expect(component.showAutocompleteResults).toBe(false);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should call onAutocompleteSelect if showAutocompleteResults and filteredLocations', () => {
      const mockLocation = { id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca' } as any;
      component.showAutocompleteResults = true;
      component.filteredLocations = [mockLocation];
      component.highlightedIndex = 0;
      const spy = jest.spyOn(component, 'onAutocompleteSelect');
      component.handleEnter();
      expect(spy).toHaveBeenCalledWith(mockLocation);
    });

    it('should reset currentPage and call loadProperties if not showing autocomplete and selectionMade', () => {
      component.showAutocompleteResults = false;
      component.locationSearchControl.setValue('Bogotá');
      component.selectionMade = true;
      component.currentPage = 5;
      const spy = jest.spyOn(component, 'loadProperties');
      component.handleEnter();
      expect(component.currentPage).toBe(0);
      expect(spy).toHaveBeenCalled();
    });
  });


  describe('onKeyDown', () => {
    let event: any;

    beforeEach(() => {
      component.filteredLocations = [
        { id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca', neighborhood: '' },
        { id: 2, cityName: 'Medellín', departmentName: 'Antioquia', neighborhood: '' }
      ];
      component.showAutocompleteResults = true;
      component.highlightedIndex = 0;
      component['cdr'] = { detectChanges: jest.fn() } as any;
    });

    it('should increment highlightedIndex on ArrowDown', () => {
      event = { key: 'ArrowDown', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.highlightedIndex).toBe(1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should not increment highlightedIndex beyond max', () => {
      component.highlightedIndex = 1;
      event = { key: 'ArrowDown', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.highlightedIndex).toBe(1);
    });

    it('should decrement highlightedIndex on ArrowUp', () => {
      component.highlightedIndex = 1;
      event = { key: 'ArrowUp', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.highlightedIndex).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should not decrement highlightedIndex below 0', () => {
      component.highlightedIndex = 0;
      event = { key: 'ArrowUp', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.highlightedIndex).toBe(0);
    });

    it('should hide autocomplete on Escape', () => {
      event = { key: 'Escape', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.showAutocompleteResults).toBe(false);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });

    it('should call applyFilters on Enter if not showing autocomplete', () => {
      component.showAutocompleteResults = false;
      const spy = jest.spyOn(component, 'applyFilters');
      event = { key: 'Enter', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(spy).toHaveBeenCalled();
    });

    it('should do nothing if key is not handled', () => {
      event = { key: 'A', preventDefault: jest.fn() };
      component.onKeyDown(event as KeyboardEvent);
      expect(component.highlightedIndex).toBe(0);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    });
  });

  describe('loadProperties', () => {
    beforeEach(() => {
      if (!component['cdr']) {
        component['cdr'] = { detectChanges: jest.fn() } as any;
      } else {
        jest.spyOn(component['cdr'], 'detectChanges').mockImplementation(() => { });
      }
      jest.spyOn(component, 'updatePageNumbers').mockImplementation(() => { });

      component.includeTimeSlots = true;
      component.selectedLocationId = 1;
      component.currentPage = 2;
      component.pageSize = 10;
      component.currentSortDirection = 'ASC';

      component.filterForm.patchValue({
        sortByControl: 'price',
        categorySelectControl: null,
        minRoomsControl: null,
        maxRoomsControl: null,
        minBathroomsControl: null,
        maxBathroomsControl: null,
        minPriceControl: null,
        maxPriceControl: null,
        minDateControl: null,
        minTimeControl: null,
        maxDateControl: null,
        maxTimeControl: null,
      }, { emitEvent: false });
    });

    it('should call homeFacade.getHomesWithAvailability with correct filters and map properties', fakeAsync(() => {
      const responseMock = {
        items: [
          {
            id: 1,
            name: 'Casa 1',
            image: 'img1.jpg',
            type: 'sale',
            description: 'desc',
            cityName: 'Bogotá',
            departmentName: 'Cundinamarca',
            neighborhood: 'Chicó',
            category: 'Residencial',
            price: 200,
            numberOfRooms: 3,
            numberOfBathrooms: 2,
            activePublicationDate: '2025-06-01',
            hasTimeSlots: true,
            timeSlots: [{ start: '10:00', end: '12:00' }]
          }
        ],
        totalPages: 5,
        totalElements: 50,
        pageNumber: 2,
        pageSize: 10
      };
      const spy = jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability').mockReturnValue(of(responseMock));
      spy.mockClear();

      component.includeTimeSlots = true;
      component.selectedLocationId = 42;
      component.currentPage = 2;
      component.pageSize = 10;
      component.currentSortDirection = 'ASC';
      component.filterForm.patchValue({
        sortByControl: 'price',
        categorySelectControl: 5,
        minRoomsControl: 2,
        maxRoomsControl: 4,
        minBathroomsControl: 1,
        maxBathroomsControl: 2,
        minPriceControl: 100,
        maxPriceControl: 500,
        minDateControl: '2025-06-01',
        minTimeControl: '10:00',
        maxDateControl: '2025-06-02',
        maxTimeControl: '18:00'
      }, { emitEvent: false });

      component.loadProperties();
      tick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        size: 10,
        sortBy: 'price',
        sortDirection: 'ASC',
        locationId: 42,
        categoryId: 5,
        minRooms: 2,
        maxRooms: 4,
        minBathrooms: 1,
        maxBathrooms: 2,
        minPrice: 100,
        maxPrice: 500,
        startTime: '2025-06-01T10:00',
        endTime: '2025-06-02T18:00'
      }), true);
    }));


    it('should handle missing time controls and set default times', fakeAsync(() => {
      const spy = jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability').mockReturnValue(of({ items: [], totalPages: 1, totalElements: 0, pageNumber: 0, pageSize: 10 }));
      spy.mockClear();

      component.includeTimeSlots = false;
      component.filterForm.patchValue({
        minDateControl: null,
        minTimeControl: null,
        maxDateControl: null,
        maxTimeControl: null
      });

      tick();


      component.loadProperties();
      tick();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          size: 10,
          sortBy: 'price',
          sortDirection: 'ASC',
          locationId: 1,
          categoryId: null,
          minRooms: null,
          maxRooms: null,
          minBathrooms: null,
          maxBathrooms: null,
          minPrice: null,
          maxPrice: null,
          startTime: null,
          endTime: null
        }),
        false
      );
    }));


    it('should set startTime and endTime to null if includeTimeSlots is false', fakeAsync(() => {
      component.includeTimeSlots = false;
      const spy = jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability').mockReturnValue(of({ items: [], totalPages: 1, totalElements: 0, pageNumber: 0, pageSize: 10 }));
      component.loadProperties();
      tick();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        startTime: null,
        endTime: null
      }), false);
    }));

    it('should handle unknown property type', fakeAsync(() => {
      const responseMock = {
        items: [
          {
            id: 2,
            name: 'Casa 2',
            image: 'img2.jpg',
            type: '',
            cityName: 'Bogotá',
            departmentName: 'Cundinamarca',
            neighborhood: 'Chicó',
            category: 'Residencial',
            price: 300,
            numberOfRooms: 3,
            numberOfBathrooms: 2,
            activePublicationDate: '2025-06-01',
            hasTimeSlots: false
          }
        ],
        totalPages: 1,
        totalElements: 1,
        pageNumber: 0,
        pageSize: 10
      };
      jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability').mockReturnValue(of(responseMock));
      component.loadProperties();
      tick();
      expect(component.properties[0].type).toBe('unknown');
    }));

    it('should handle error response and reset properties', fakeAsync(() => {
      jest.spyOn(mockHomeFacadeService, 'getHomesWithAvailability').mockReturnValue({
        pipe: () => ({
          subscribe: (_success: any, error: any) => error('error')
        })
      } as any);
      component.properties = [{ id: 1 } as any];
      component.totalPages = 5;
      component.totalElements = 10;
      component.pageNumbers = [1, 2, 3];
      component.isLoadingProperties = true;
      component.loadProperties();
      tick();
      expect(component.properties).toEqual([]);
      expect(component.isLoadingProperties).toBe(false);
      expect(component.totalPages).toBe(0);
      expect(component.totalElements).toBe(0);
      expect(component.pageNumbers).toEqual([]);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    }));
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.totalPages = 5;
      component.currentPage = 2;
      jest.spyOn(component, 'loadProperties').mockImplementation(() => { });
    });

    it('should change page and call loadProperties if page is valid and different', () => {
      component.goToPage(3);
      expect(component.currentPage).toBe(3);
      expect(component.loadProperties).toHaveBeenCalled();
    });

    it('should not change page or call loadProperties if page is negative', () => {
      component.goToPage(-1);
      expect(component.currentPage).toBe(2);
      expect(component.loadProperties).not.toHaveBeenCalled();
    });

    it('should not change page or call loadProperties if page >= totalPages', () => {
      component.goToPage(5);
      expect(component.currentPage).toBe(2);
      expect(component.loadProperties).not.toHaveBeenCalled();
    });

    it('should not change page or call loadProperties if page is the same as current', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
      expect(component.loadProperties).not.toHaveBeenCalled();
    });
  });

  describe('updatePageNumbers', () => {
    it('should show all pages if totalPages <= maxPagesToShow', () => {
      component.totalPages = 3;
      component.currentPage = 1;
      component.updatePageNumbers();
      expect(component.pageNumbers).toEqual([0, 1, 2]);
    });

    it('should show first 5 pages if currentPage is near start', () => {
      component.totalPages = 10;
      component.currentPage = 1;
      component.updatePageNumbers();
      expect(component.pageNumbers).toEqual([0, 1, 2, 3, 4]);
    });

    it('should show last 5 pages if currentPage is near end', () => {
      component.totalPages = 10;
      component.currentPage = 9;
      component.updatePageNumbers();
      expect(component.pageNumbers).toEqual([5, 6, 7, 8, 9]);
    });

    it('should show 5 pages centered on currentPage', () => {
      component.totalPages = 10;
      component.currentPage = 5;
      component.updatePageNumbers();
      expect(component.pageNumbers).toEqual([3, 4, 5, 6, 7]);
    });

    it('should set pageNumbers to empty if totalPages is 0', () => {
      component.totalPages = 0;
      component.currentPage = 0;
      component.updatePageNumbers();
      expect(component.pageNumbers).toEqual([]);
    });
  });

  describe('navigateToPropertyDetails', () => {
    beforeEach(() => {
      component['router'] = { navigate: jest.fn() } as any;
    });

    it('should navigate to property details if propertyId is valid', () => {
      component.navigateToPropertyDetails(123);
      expect(component['router'].navigate).toHaveBeenCalledWith(['/property', 123]);
    });

    it('should navigate to property details if propertyId is a string', () => {
      component.navigateToPropertyDetails('abc');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/property', 'abc']);
    });

    it('should navigate to /home if propertyId is falsy', () => {
      component.navigateToPropertyDetails(null as any);
      expect(component['router'].navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('toggleSortDirection', () => {
    beforeEach(() => {
      jest.spyOn(component, 'loadProperties').mockImplementation(() => { });
      component.currentPage = 5;
      component.currentSortDirection = 'ASC';
    });

    it('should toggle sort direction from ASC to DESC and reset page', () => {
      component.toggleSortDirection();
      expect(component.currentSortDirection).toBe('DESC');
      expect(component.currentPage).toBe(0);
      expect(component.loadProperties).toHaveBeenCalled();
    });

    it('should toggle sort direction from DESC to ASC and reset page', () => {
      component.currentSortDirection = 'DESC';
      component.toggleSortDirection();
      expect(component.currentSortDirection).toBe('ASC');
      expect(component.currentPage).toBe(0);
      expect(component.loadProperties).toHaveBeenCalled();
    });
  });

  describe('loadCategories', () => {
    beforeEach(() => {
      component['cdr'] = { detectChanges: jest.fn() } as any;
    });

    it('should set categories on success', fakeAsync(() => {
      const categoriesMock = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      jest.spyOn(mockHomeFacadeService, 'getCategories').mockReturnValue(
        of({ items: categoriesMock })
      );
      component.loadCategories();
      tick();
      expect(component.categories).toEqual(categoriesMock);
      expect(component['cdr'].detectChanges).toHaveBeenCalled();
    }));

    it('should set categories to empty array on error', fakeAsync(() => {
      jest.spyOn(mockHomeFacadeService, 'getCategories').mockReturnValue({
        pipe: () => ({
          subscribe: (_success: any, error: any) => error('error')
        })
      } as any);
      component.categories = [{ id: 1, name: 'A' } as any];
      component.loadCategories();
      tick();
      expect(component.categories).toEqual([]);
    }));
  });

  describe('applyFilters', () => {
    it('should mark all form controls as touched', () => {
      const markAllAsTouchedSpy = jest.spyOn(component.filterForm, 'markAllAsTouched');
      const locationSearchControlMarkAsTouchedSpy = jest.spyOn(component.locationSearchControl, 'markAsTouched');
      component.applyFilters();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
      expect(locationSearchControlMarkAsTouchedSpy).toHaveBeenCalled();
    });

    it('should return if the filter form is invalid', () => {
      component.filterForm.setErrors({ invalid: true });
      const checkTimeSlotFiltersSpy = jest.spyOn(component as any, 'checkTimeSlotFilters');
      const loadPropertiesSpy = jest.spyOn(component, 'loadProperties');
      component.applyFilters();
      expect(checkTimeSlotFiltersSpy).not.toHaveBeenCalled();
      expect(loadPropertiesSpy).not.toHaveBeenCalled();
    });

    it('should return if the location search control is invalid and touched and selectionMade is false', () => {
      component.locationSearchControl.setValue('test');
      component.selectionMade = false;
      component.locationSearchControl.markAsTouched();
      component.locationSearchControl.setErrors({ invalid: true });
      const checkTimeSlotFiltersSpy = jest.spyOn(component as any, 'checkTimeSlotFilters');
      const loadPropertiesSpy = jest.spyOn(component, 'loadProperties');
      component.applyFilters();
      expect(checkTimeSlotFiltersSpy).not.toHaveBeenCalled();
      expect(loadPropertiesSpy).not.toHaveBeenCalled();
    });

    it('should reset currentPage, call checkTimeSlotFilters and loadProperties if the filter form and location search control are valid', () => {
      const checkTimeSlotFiltersSpy = jest.spyOn(component as any, 'checkTimeSlotFilters');
      const loadPropertiesSpy = jest.spyOn(component, 'loadProperties');
      component.currentPage = 5;
      component.applyFilters();
      expect(component.currentPage).toBe(0);
      expect(checkTimeSlotFiltersSpy).toHaveBeenCalled();
      expect(loadPropertiesSpy).toHaveBeenCalled();
    });

    it('should toggle filter sidebar if currentView is grid and showFilterSidebar is true', () => {
      const toggleFilterSidebarSpy = jest.spyOn(component, 'toggleFilterSidebar');
      component.currentView = 'grid';
      component.showFilterSidebar = true;
      component.applyFilters();
      expect(toggleFilterSidebarSpy).toHaveBeenCalled();
    });

    it('should not toggle filter sidebar if currentView is not grid', () => {
      const toggleFilterSidebarSpy = jest.spyOn(component, 'toggleFilterSidebar');
      component.currentView = 'list';
      component.showFilterSidebar = true;
      component.applyFilters();
      expect(toggleFilterSidebarSpy).not.toHaveBeenCalled();
    });

    it('should not toggle filter sidebar if showFilterSidebar is false', () => {
      const toggleFilterSidebarSpy = jest.spyOn(component, 'toggleFilterSidebar');
      component.currentView = 'grid';
      component.showFilterSidebar = false;
      component.applyFilters();
      expect(toggleFilterSidebarSpy).not.toHaveBeenCalled();
    });
  });


  describe('setView', () => {
    it('should set the currentView to the provided view', () => {
      component.setView('grid');
      expect(component.currentView).toBe('grid');
      component.setView('list');
      expect(component.currentView).toBe('list');
    });

    it('should set showFilterSidebar to false if the view is grid and showFilterSidebar is true', () => {
      component.showFilterSidebar = true;
      component.setView('grid');
      expect(component.showFilterSidebar).toBe(false);
    });

    it('should not set showFilterSidebar to false if the view is grid and showFilterSidebar is false', () => {
      component.showFilterSidebar = false;
      component.setView('grid');
      expect(component.showFilterSidebar).toBe(false);
    });

    it('should not set showFilterSidebar to false if the view is list and showFilterSidebar is true', () => {
      component.showFilterSidebar = true;
      component.setView('list');
      expect(component.showFilterSidebar).toBe(true);
    });

    it('should call cdr.detectChanges()', () => {
      const detectChangesSpy = jest.spyOn(component['cdr'], 'detectChanges');
      component.setView('grid');
      expect(detectChangesSpy).toHaveBeenCalled();
    });
  });

  describe('preventInvalidNumberInput', () => {
    it('should prevent the default action of the event if the event.key is "e"', () => {
      const event = { key: 'e', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent the default action of the event if the event.key is "E"', () => {
      const event = { key: 'E', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent the default action of the event if the event.key is "+"', () => {
      const event = { key: '+', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent the default action of the event if the event.key is "-"', () => {
      const event = { key: '-', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent the default action of the event if the event.key is "."', () => {
      const event = { key: '.', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not prevent the default action of the event if the event.key is not one of "e", "E", "+", "-", "."', () => {
      const event = { key: '1', preventDefault: jest.fn() } as any;
      component.preventInvalidNumberInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });


});
