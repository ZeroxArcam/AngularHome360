import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { HomePageComponent } from './home-page.component';
import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';

// Mock básico del HomeFacadeService
const mockHomeFacadeService = {
  getHomesWithAvailability: jest.fn().mockReturnValue(of({ items: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 9 })),
  getCategories: jest.fn().mockReturnValue(of({ items: [] })),
  getLocations: jest.fn().mockReturnValue(of([])),
  getAvailableTimeSlots: jest.fn().mockReturnValue(of([])),
};

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
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

  it('should reset currentPage and call loadProperties when sortByControl changes', () => {
    const spy = jest.spyOn(component, 'loadProperties');
    component.currentPage = 5;
    component.filterForm.get('sortByControl')?.setValue('numberOfRooms');
    expect(component.currentPage).toBe(0);
    expect(spy).toHaveBeenCalled();
  });

  it('should call checkTimeSlotFilters when any date/time filter changes', () => {
    const spy = jest.spyOn(component as any, 'checkTimeSlotFilters');
    // Simula cambios en cada control de fecha/hora
    ['minDateControl', 'maxDateControl', 'minTimeControl', 'maxTimeControl'].forEach(controlName => {
      component.filterForm.get(controlName)?.setValue('2025-05-25');
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should update filteredLocations and flags when locationSearchControl emits a valid value', (done) => {
    jest.useFakeTimers();
    const locationsMock = [{ id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca' }];
    mockHomeFacadeService.getLocations.mockReturnValue(of(locationsMock));
    component.lastSelectedLocationDisplay = null;
    component.previousInputValue = '';
    component.locationSearchControl.setValue('Bogotá');
    jest.advanceTimersByTime(1200); // 500ms debounce + 700ms setTimeout
    Promise.resolve().then(() => {
      expect(component.filteredLocations).toEqual(locationsMock);
      expect(component.isLoadingLocations).toBe(false);
      expect(component.showAutocompleteResults).toBe(true);
      expect(component.isTyping).toBe(false);
      jest.useRealTimers();
      done();
    });
  });

  it('should NOT trigger search or update filteredLocations when locationSearchControl emits null (first filter)', (done) => {
    jest.useFakeTimers();
    const spy = jest.spyOn(mockHomeFacadeService, 'getLocations');
    component.locationSearchControl.setValue(null);
    jest.advanceTimersByTime(600); // debounce + margin
    Promise.resolve().then(() => {
      expect(spy).not.toHaveBeenCalled();
      expect(component.filteredLocations).toEqual([]);
      jest.useRealTimers();
      done();
    });
  });

  it('should return empty array from switchMap when locationSearchControl emits null', (done) => {
    jest.useFakeTimers();
    // Bypass first filter by setting lastSelectedLocationDisplay to a string (so value !== lastSelectedLocationDisplay)
    component.lastSelectedLocationDisplay = 'something';
    component.selectionMade = false;
    component.locationSearchControl.setValue(null);
    jest.advanceTimersByTime(600); // debounce + margin
    Promise.resolve().then(() => {
      expect(component.filteredLocations).toEqual([]);
      expect(component.isLoadingLocations).toBe(false);
      jest.useRealTimers();
      done();
    });
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
          errors: { minRoomsGreaterThanMax: true } // Solo el error a limpiar
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
      // Usar una fecha de ayer para garantizar que está en el pasado
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
      const minDateValue = '2025-05-26';
      const maxDateValue = '2025-05-25';
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
      // Usar una fecha futura para evitar minDateTimeInPast
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // mañana
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
      component.filteredLocations = [{
        id: 1, cityName: 'X', departmentName: 'Y',
        neighborhood: ''
      }];
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
        // neighborhood undefined
      };
      component.locationSearchControl.setValue('');
      component.onAutocompleteSelect(location as any);
      expect(component.locationSearchControl.value).toBe('Medellín - Antioquia ');
    });
  });
});
