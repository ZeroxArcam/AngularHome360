import { TestBed } from '@angular/core/testing';
import { HomeFacadeService } from './home-facade.service';
import { HomeService } from '@app/core/services/home/home.service';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { LocationService } from '@app/core/services/location/location.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { of, throwError } from 'rxjs';
import { Home } from '@app/core/models/home.model';
import { TimeSlot } from '@app/core/models/time-slot.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Category } from '@app/core/models/category.model';

const mockHomeService = {
  getProperties: jest.fn()
};
const mockTimeSlotService = {
  getTimeSlots: jest.fn().mockReturnValue(of({ items: [] }))
};
const mockLocationService = {
  getLocations: jest.fn()
};
const mockCategoryService = {
  getCategories: jest.fn()
};

function createPaginatedResponse<T>(items: T[], totalElements: number, page: number, size: number): PaginationResponse<T> {
  return {
    items,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    pageNumber: page,
    pageSize: size,
  };
}


describe('HomeFacadeService', () => {
  let service: HomeFacadeService;
  let homeServiceMock: HomeService;
  let timeSlotServiceMock: TimeSlotService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        HomeFacadeService,
        { provide: HomeService, useValue: mockHomeService },
        { provide: TimeSlotService, useValue: mockTimeSlotService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: CategoryService, useValue: mockCategoryService }
      ]
    });
    service = TestBed.inject(HomeFacadeService);
    homeServiceMock = TestBed.inject(HomeService);
    timeSlotServiceMock = TestBed.inject(TimeSlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHomesWithAvailability', () => {
    const mockHome1: Home = { id: 1, name: 'Casa 1', address: '', category: '', cityName: '', departmentName: '', description: '', neighborhood: '', numberOfBathrooms: 1, numberOfRooms: 1, price: 100, activePublicationDate: '', userId: 1 };
    const mockHome2: Home = { id: 2, name: 'Casa 2', address: '', category: '', cityName: '', departmentName: '', description: '', neighborhood: '', numberOfBathrooms: 1, numberOfRooms: 1, price: 100, activePublicationDate: '', userId: 1 };
    const mockHome3: Home = { id: 3, name: 'Casa 3', address: '', category: '', cityName: '', departmentName: '', description: '', neighborhood: '', numberOfBathrooms: 1, numberOfRooms: 1, price: 100, activePublicationDate: '', userId: 1 };

    const mockSlot1ForHome1: TimeSlot = { id: 1, homeId: 1, sellerId: 1, startTime: new Date(), endTime: new Date() };
    const mockSlot2ForHome1: TimeSlot = { id: 2, homeId: 1, sellerId: 1, startTime: new Date(), endTime: new Date() };
    const mockSlot1ForHome2: TimeSlot = { id: 3, homeId: 2, sellerId: 2, startTime: new Date(), endTime: new Date() };


    it('should default componentRequestsFilteringByTime to false if not provided (Cobertura Rama 1)', (done) => {
      const filters = { page: 0, size: 1 };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(createPaginatedResponse([mockHome1], 1, 0, 1)));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [mockSlot1ForHome1] }));

      service.getHomesWithAvailability(filters).subscribe(result => {
        expect(homeServiceMock.getProperties).toHaveBeenCalledWith(filters);
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: expect.any(Date),
          endTime: expect.any(Date)
        }));
        expect(result.items.length).toBe(1);
        expect(result.items[0].hasTimeSlots).toBe(true);
        done();
      });
    });


    it('should filter out homes with empty slots array when componentRequestsFilteringByTime is true (Cobertura Rama 2)', (done) => {
      const filters = { page: 0, size: 2, startTime: '2025-01-01T10:00:00Z', endTime: '2025-01-01T12:00:00Z' };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2)));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({
        items: [
          mockSlot1ForHome1
        ]
      }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(1);
        expect(result.items[0].hasTimeSlots).toBe(true);
        done();
      });
    });


    it('should assign empty array to timeSlots if slotsByHomeId.get returns undefined (Cobertura Rama 3 - caso componentRequestsFilteringByTime = false)', (done) => {
      const filters = { page: 0, size: 1 };
      const homeResponse = createPaginatedResponse([mockHome1], 1, 0, 1);
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(homeResponse));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [] }));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(1);
        expect(result.items[0].timeSlots).toEqual([]);
        expect(result.items[0].hasTimeSlots).toBe(false);
        done();
      });
    });


    it('should use default pageSize in catchError if filters.size is undefined (Cobertura Rama 4)', (done) => {
      const filters = { page: 0, };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));

      service.getHomesWithAvailability(filters as any, false).subscribe(result => {
        expect(result.items).toEqual([]);
        expect(result.totalElements).toBe(0);
        expect(result.totalPages).toBe(0);
        expect(result.pageNumber).toBe(0);
        expect(result.pageSize).toBe(20);
        done();
      });
    });

    it('should use filters.page in catchError if defined, otherwise 0', (done) => {
      const filtersWithPage = { page: 1, size: 10 };
      const filtersWithoutPage = { size: 10 };

      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));
      service.getHomesWithAvailability(filtersWithPage as any, false).subscribe(resultWithPage => {
        expect(resultWithPage.pageNumber).toBe(1);

        (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));
        service.getHomesWithAvailability(filtersWithoutPage as any, false).subscribe(resultWithoutPage => {
          expect(resultWithoutPage.pageNumber).toBe(0);
          done();
        });
      });
    });

    it('should return homes with time slots when filtering by time', (done) => {
      const filters = { page: 0, size: 2, startTime: '2025-05-25T10:00', endTime: '2025-05-25T12:00' };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2);
      const slots: TimeSlot[] = [mockSlot1ForHome1, mockSlot2ForHome1, mockSlot1ForHome2];

      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(homeServiceMock.getProperties).toHaveBeenCalledWith(filters);
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: new Date(filters.startTime),
          endTime: new Date(filters.endTime)
        }));
        expect(result.items.length).toBe(2);
        expect(result.items.find(h => h.id === 1)?.timeSlots.length).toBe(2);
        expect(result.items.find(h => h.id === 2)?.timeSlots.length).toBe(1);
        done();
      });
    });

    it('should return all homes with or without time slots when not filtering by time', (done) => {
      const filters = { page: 0, size: 2 };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2);
      const slots: TimeSlot[] = [mockSlot1ForHome1];

      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(2);
        expect(result.items.find(h => h.id === 1)?.hasTimeSlots).toBe(true);
        expect(result.items.find(h => h.id === 2)?.hasTimeSlots).toBe(false);
        done();
      });
    });

    it('should return homes with correct timeSlots and hasTimeSlots when not filtering by time (componentRequestsFilteringByTime = false)', (done) => {
      const filters = { page: 0, size: 2 };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2);
      const slots: TimeSlot[] = [mockSlot1ForHome1, mockSlot1ForHome2, { homeId: 2, startTime: new Date(), endTime: new Date() } as TimeSlot];
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(2);
        expect(result.items.find(h => h.id === 1)?.timeSlots.length).toBe(1);
        expect(result.items.find(h => h.id === 1)?.hasTimeSlots).toBe(true);
        expect(result.items.find(h => h.id === 2)?.timeSlots.length).toBe(2);
        expect(result.items.find(h => h.id === 2)?.hasTimeSlots).toBe(true);
        expect(result.totalElements).toBe(2);
        done();
      });
    });

    it('should handle error from getProperties and return default PaginatedHomeViewModel', (done) => {
      const filters = { page: 0, size: 2 };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('fail from getProperties')));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [] }));


      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items).toEqual([]);
        expect(result.totalElements).toBe(0);
        expect(result.pageNumber).toBe(filters.page);
        expect(result.pageSize).toBe(filters.size);
        done();
      });
    });

    it('should handle error from getTimeSlots and return default PaginatedHomeViewModel but with home data', (done) => {
      const filters = { page: 0, size: 1 };
      const paginatedHomes = createPaginatedResponse([mockHome1], 1, 0, 1);
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(throwError(() => new Error('fail from getTimeSlots')));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(mockHome1.id);
        expect(result.items[0].timeSlots).toEqual([]);
        expect(result.items[0].hasTimeSlots).toBe(false);
        expect(result.totalElements).toBe(1);
        done();
      });
    });


    it('should filter out homes with no slots when filtering by time', (done) => {
      const filters = { page: 0, size: 3, startTime: '2025-05-25T10:00', endTime: '2025-05-25T12:00' };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2, mockHome3], 3, 0, 3);
      const slots: TimeSlot[] = [mockSlot1ForHome1];
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(1);
        expect(result.items[0].timeSlots.length).toBe(1);
        done();
      });
    });

    it('should return no homes if no homes have slots when filtering by time', (done) => {
      const filters = { page: 0, size: 2, startTime: '2025-05-25T10:00', endTime: '2025-05-25T12:00' };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2);
      const slots: TimeSlot[] = [];
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(result.items.length).toBe(0);
        done();
      });
    });
  });


  describe('getAvailableTimeSlots', () => {
    it('should return slots array from getTimeSlots response', (done) => {
      const slotsData = [{ homeId: 1, startTime: new Date(), endTime: new Date() } as TimeSlot];
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slotsData }));
      service.getAvailableTimeSlots().subscribe(result => {
        expect(result).toEqual(slotsData);
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          size: 1000,
        }));
        done();
      });
    });

    it('should use provided startTime and endTime for getTimeSlots', (done) => {
      const startTimeStr = '2025-01-01T08:00:00Z';
      const endTimeStr = '2025-01-02T18:00:00Z';
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [] }));

      service.getAvailableTimeSlots(startTimeStr, endTimeStr).subscribe(() => {
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: new Date(startTimeStr),
          endTime: new Date(endTimeStr)
        }));
        done();
      });
    });

    it('should handle error and return empty array', (done) => {
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
      service.getAvailableTimeSlots().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });


  describe('getLocations', () => {
    const mockLocationResponse: PaginationResponse<Location> = {
      items: [{} as Location],
      totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 10
    };

    it('should return locations when search text is valid', (done) => {
      (mockLocationService.getLocations as jest.Mock).mockReturnValue(of(mockLocationResponse));
      service.getLocations(of('Bog')).subscribe(result => {
        expect(mockLocationService.getLocations).toHaveBeenCalledWith({ page: 0, size: 10, text: 'Bog' });
        expect(result).toEqual(mockLocationResponse.items);
        done();
      });
    });
    it('should return empty array for short search text (less than 2 chars)', (done) => {
      service.getLocations(of('A')).subscribe(result => {
        expect(mockLocationService.getLocations).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        done();
      });
    });
    it('should return empty array if search text is null', (done) => {
      service.getLocations(of(null)).subscribe(result => {
        expect(mockLocationService.getLocations).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        done();
      });
    });
    it('should handle error from locationService.getLocations and return empty array', (done) => {
      (mockLocationService.getLocations as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
      service.getLocations(of('Bog')).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });


  describe('getCategories', () => {
    it('should return categories directly from categoryService', (done) => {
      const categoriesResponse: PaginationResponse<Category> = {
        items: [{ id: 1, name: 'Casa', description: 'Descripción de la casa' }],
        totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 100
      };
      (mockCategoryService.getCategories as jest.Mock).mockReturnValue(of(categoriesResponse));
      service.getCategories().subscribe(result => {
        expect(mockCategoryService.getCategories).toHaveBeenCalledWith(0, 100);
        expect(result).toEqual(categoriesResponse);
        done();
      });
    });

    it('should handle error from getCategories (though not explicitly handled in service, good to be aware)', (done) => {
      (mockCategoryService.getCategories as jest.Mock).mockReturnValue(throwError(() => new Error('Category API Down')));
      service.getCategories().subscribe({
        next: () => { done.fail('Expected an error from getCategories'); },
        error: (err) => {
          expect(err.message).toBe('Category API Down');
          done();
        }
      });
    });

  });

});
