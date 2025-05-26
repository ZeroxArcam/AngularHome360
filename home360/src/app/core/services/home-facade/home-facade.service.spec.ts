import { TestBed } from '@angular/core/testing';
import { HomeFacadeService } from './home-facade.service';
import { HomeService } from '@app/core/services/home/home.service';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { LocationService } from '@app/core/services/location/location.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { of, throwError } from 'rxjs';
import { Home, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model'; // Asegúrate que los modelos estén bien importados
import { TimeSlot } from '@app/core/models/time-slot.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Category } from '@app/core/models/category.model';

// --- Mock de datos y servicios (ya los tienes, pero asegúrate de que los tipos sean correctos) ---
const mockHomeService = {
  getProperties: jest.fn()
};
const mockTimeSlotService = {
  // getTimeSlots debe devolver un objeto con una propiedad 'items' si eso es lo que espera tu código
  getTimeSlots: jest.fn().mockReturnValue(of({ items: [] }))
};
const mockLocationService = {
  getLocations: jest.fn()
};
const mockCategoryService = {
  getCategories: jest.fn()
};

// Helper para crear respuestas paginadas
function createPaginatedResponse<T>(items: T[], totalElements: number, page: number, size: number): PaginationResponse<T> {
  return {
    items,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    pageNumber: page,
    pageSize: size,
  };
}
// --- Fin Mock de datos y servicios ---


describe('HomeFacadeService', () => {
  let service: HomeFacadeService;
  let homeServiceMock: HomeService;
  let timeSlotServiceMock: TimeSlotService;

  beforeEach(() => {
    jest.clearAllMocks(); // Limpia todos los mocks antes de cada test
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
    homeServiceMock = TestBed.inject(HomeService); // Para tipado si es necesario
    timeSlotServiceMock = TestBed.inject(TimeSlotService); // Para tipado si es necesario
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
      // Mock para getProperties
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(createPaginatedResponse([mockHome1], 1, 0, 1)));
      // Mock para getTimeSlots (devuelve algunos slots para que la lógica no se salte)
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [mockSlot1ForHome1] }));

      // Llamada sin el segundo argumento
      service.getHomesWithAvailability(filters).subscribe(result => {
        expect(homeServiceMock.getProperties).toHaveBeenCalledWith(filters);
        // Verifica que se llamó a getTimeSlots sin filtros de tiempo específicos (comportamiento de componentRequestsFilteringByTime = false)
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: expect.any(Date), // Será 'today'
          endTime: expect.any(Date)    // Será 'threeWeeksFromNow'
        }));
        expect(result.items.length).toBe(1); // La casa debería estar allí
        expect(result.items[0].hasTimeSlots).toBe(true); // Asumiendo que mockSlot1ForHome1 es para mockHome1
        done();
      });
    });


    it('should filter out homes with empty slots array when componentRequestsFilteringByTime is true (Cobertura Rama 2)', (done) => {
      const filters = { page: 0, size: 2, startTime: '2025-01-01T10:00:00Z', endTime: '2025-01-01T12:00:00Z' };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2)));
      // Home1 tiene slots, Home2 tiene una entrada en el Map pero el array de slots está vacío.
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({
        items: [
          mockSlot1ForHome1 // Slots solo para home1
          // No hay slots para home2, pero vamos a simular que slotsByHomeId.get(2) devuelve []
          // Esto se maneja indirectamente por cómo se construye slotsByHomeId.
          // Si getTimeSlots devuelve [{homeId: 1, ...}] y luego el código crea slotsByHomeId.set(2, [])
          // Esta prueba es más sobre el resultado final del filtro.
          // La forma de probarlo es que Home2 no tenga slots en `fetchedTimeSlots`
        ]
      }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(result.items.length).toBe(1); // Solo home1 debería quedar
        expect(result.items[0].id).toBe(1);
        expect(result.items[0].hasTimeSlots).toBe(true);
        // Home2 fue filtrada porque aunque podría tener una entrada en el map (si tuviera otros slots fuera del rango),
        // si los slots que coinciden con el rango de tiempo son 0, se filtra.
        // O si directamente no tiene ningún slot en `fetchedTimeSlots`.
        done();
      });
    });

    // Test para la rama 3: `timeSlots: slotsByHomeId.get(home.id) || []` cuando la parte `|| []` se ejecuta.
    // Como se discutió, esta rama es difícil de alcanzar naturalmente con la lógica actual del filtro.
    // El filtro `(slotsByHomeId.get(home.id)?.length || 0) > 0` asegura que `slotsByHomeId.get(home.id)`
    // es un array con elementos cuando llega al `map`.
    // Si la intención es una robustez extrema, el `|| []` está bien.
    // Si se quiere coverage del 100% a toda costa para esta línea, se podría mockear
    // el comportamiento de `Map.prototype.get` temporalmente, pero no es recomendable para tests unitarios estándar.
    // A menudo, las herramientas de coverage pueden ser un poco literales con los operadores `||` y `&&`.
    // Podrías aceptar esta pequeña falta de coverage o refactorizar si el `|| []` es redundante.
    // Si decidimos que el filtro ya garantiza que .get(home.id) es un array con items,
    // el `|| []` en `timeSlots: slotsByHomeId.get(home.id) || []` podría simplificarse a
    // `timeSlots: slotsByHomeId.get(home.id)!` (usando el non-null assertion operator si estás seguro).
    // Por ahora, lo dejaremos y aceptaremos que el coverage podría marcarlo.

    // Para cubrir la rama 3 de forma más directa (aunque un poco artificial si el filtro funciona):
    // Este test asume que `componentRequestsFilteringByTime` es `false`, porque si es `true` y el `filter` funciona,
    // esta condición en el `map` es menos probable de ser `undefined`.
    it('should assign empty array to timeSlots if slotsByHomeId.get returns undefined (Cobertura Rama 3 - caso componentRequestsFilteringByTime = false)', (done) => {
      const filters = { page: 0, size: 1 };
      const homeResponse = createPaginatedResponse([mockHome1], 1, 0, 1);
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(homeResponse));
      // getTimeSlots devuelve un array vacío, por lo que slotsByHomeId.get(mockHome1.id) será undefined.
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: [] }));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(1);
        expect(result.items[0].timeSlots).toEqual([]); // Aquí se ejecutaría el || []
        expect(result.items[0].hasTimeSlots).toBe(false);
        done();
      });
    });


    it('should use default pageSize in catchError if filters.size is undefined (Cobertura Rama 4)', (done) => {
      const filters = { page: 0, /* size no está definido */ }; // `any` para permitir la omisión
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));

      service.getHomesWithAvailability(filters as any, false).subscribe(result => {
        expect(result.items).toEqual([]);
        expect(result.totalElements).toBe(0);
        expect(result.totalPages).toBe(0);
        expect(result.pageNumber).toBe(0); // Ya que filters.page es 0
        expect(result.pageSize).toBe(20); // Debería tomar el valor por defecto 20
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

    // --- Tus tests existentes (revisados y adaptados si es necesario) ---
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
        expect(result.items.length).toBe(2); // Ambas casas tienen slots
        expect(result.items.find(h => h.id === 1)?.timeSlots.length).toBe(2);
        expect(result.items.find(h => h.id === 2)?.timeSlots.length).toBe(1);
        done();
      });
    });

    it('should return all homes with or without time slots when not filtering by time', (done) => {
      const filters = { page: 0, size: 2 };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2], 2, 0, 2);
      const slots: TimeSlot[] = [mockSlot1ForHome1]; // Solo home1 tiene slots

      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, false).subscribe(result => {
        expect(result.items.length).toBe(2);
        expect(result.items.find(h => h.id === 1)?.hasTimeSlots).toBe(true);
        expect(result.items.find(h => h.id === 2)?.hasTimeSlots).toBe(false);
        done();
      });
    });

    // Este test ya cubre bien el caso `componentRequestsFilteringByTime = false`
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

    // Tu test para 'should handle error and return empty array' en getHomesWithAvailability
    // estaba testeando getAvailableTimeSlots por error. Lo corrijo:
    it('should handle error from getProperties and return default PaginatedHomeViewModel', (done) => {
      const filters = { page: 0, size: 2 };
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(throwError(() => new Error('fail from getProperties')));
      // getTimeSlots no debería ser llamado si getProperties falla antes.
      // Pero por si acaso, lo mockeamos para que no falle el test por otra cosa.
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
        // En este caso, el error es en getTimeSlots, el catchError del pipe principal no se activa.
        // El error de getTimeSlots es manejado por su propio catchError que devuelve of([]).
        // Por lo tanto, las homes se procesan con un array de timeSlots vacío.
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(mockHome1.id);
        expect(result.items[0].timeSlots).toEqual([]);
        expect(result.items[0].hasTimeSlots).toBe(false);
        expect(result.totalElements).toBe(1); // La info de paginación de homes se mantiene
        done();
      });
    });


    it('should filter out homes with no slots when filtering by time', (done) => {
      const filters = { page: 0, size: 3, startTime: '2025-05-25T10:00', endTime: '2025-05-25T12:00' };
      const paginatedHomes = createPaginatedResponse([mockHome1, mockHome2, mockHome3], 3, 0, 3);
      const slots: TimeSlot[] = [mockSlot1ForHome1]; // Solo home1 tiene slots
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
      const slots: TimeSlot[] = []; // Ninguna casa tiene slots
      (homeServiceMock.getProperties as jest.Mock).mockReturnValue(of(paginatedHomes));
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slots }));

      service.getHomesWithAvailability(filters, true).subscribe(result => {
        expect(result.items.length).toBe(0);
        done();
      });
    });
  }); // Fin describe('getHomesWithAvailability')


  describe('getAvailableTimeSlots', () => {
    it('should return slots array from getTimeSlots response', (done) => {
      const slotsData = [{ homeId: 1, startTime: new Date(), endTime: new Date() } as TimeSlot];
      (timeSlotServiceMock.getTimeSlots as jest.Mock).mockReturnValue(of({ items: slotsData }));
      service.getAvailableTimeSlots().subscribe(result => {
        expect(result).toEqual(slotsData);
        expect(timeSlotServiceMock.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
          startTime: expect.any(Date), // today
          endTime: expect.any(Date),   // 3 weeks from now
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
  }); // Fin describe('getAvailableTimeSlots')


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
  }); // Fin describe('getLocations')


  describe('getCategories', () => {
    it('should return categories directly from categoryService', (done) => {
      const categoriesResponse: PaginationResponse<Category> = {
        items: [{ id: 1, name: 'Casa', description: 'Descripción de la casa' }],
        totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 100
      };
      (mockCategoryService.getCategories as jest.Mock).mockReturnValue(of(categoriesResponse));
      service.getCategories().subscribe(result => {
        expect(mockCategoryService.getCategories).toHaveBeenCalledWith(0, 100);
        expect(result).toEqual(categoriesResponse); // getCategories devuelve la respuesta paginada completa
        done();
      });
    });

    // Opcional: test de error para getCategories si es crítico
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

  }); // Fin describe('getCategories')

  // Test para los métodos privados si es necesario (generalmente se testean a través de los públicos)
  // describe('private methods', () => {
  //   it('getPropertyImage should return an image path', () => {
  //     const serviceInstance = TestBed.inject(HomeFacadeService);
  //     // Acceder a métodos privados para testear es posible en JS pero no ideal.
  //     // Se prefiere testear su efecto a través de los métodos públicos.
  //     expect((serviceInstance as any).getPropertyImage(0)).toBe('/assets/images/casa_afueras.png');
  //     expect((serviceInstance as any).getPropertyImage(3)).toBe('/assets/images/casa_afueras.png'); // Modulo
  //   });
  // });

});
