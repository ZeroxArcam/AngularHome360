// import { Injectable, inject } from '@angular/core';
// import { HomeService } from '@app/core/services/home/home.service';
// import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
// import { LocationService } from '@app/core/services/location/location.service';
// import { CategoryService } from '@app/core/services/category/category.service';
// import { Observable, forkJoin, of } from 'rxjs';
// import { HomeViewModel } from '@app/core/models/home.model';
// import { TimeSlot, TimeSlotQueryParams } from '@app/core/models/time-slot.model';
// import { map, switchMap, catchError, debounce, debounceTime } from 'rxjs/operators';
// import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
// import { Location as AppLocation } from '@app/core/models/location.model';
// import { Category } from '@app/core/models/category.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class HomeFacadeService {
//   private homeService = inject(HomeService);
//   private timeSlotService = inject(TimeSlotService);
//   private categoryService = inject(CategoryService);
//   private locationService = inject(LocationService);

//   getHomesWithAvailability(filters: any, includeTimeSlots: boolean = false): Observable<HomeViewModel[]> {
//     return this.homeService.getProperties(filters).pipe(
//       switchMap(homeResponse => {
//         let homesWithImages = homeResponse.items.map((home, index) => ({
//           ...home,
//           image: this.getPropertyImage(index),
//           timeSlots: [],
//           hasTimeSlots: false
//         }));

//         if (!includeTimeSlots) {
//           return this.getAvailableTimeSlots().pipe(
//             map(timeSlots => {
//               let homeIdsWithTimeSlots = new Set(timeSlots.map(slot => slot.homeId));
//               return homesWithImages.map(home => ({
//                 ...home,
//                 timeSlots: timeSlots.filter(slot => slot.homeId === home.id),
//                 hasTimeSlots: homeIdsWithTimeSlots.has(home.id),
//               }));
//             })
//           );
//         }

//         return this.getAvailableTimeSlots(filters.startTime, filters.endTime).pipe(
//           map(timeSlots => {
//             let homeIdsWithTimeSlots = new Set(timeSlots.map(slot => slot.homeId));

//             return homesWithImages.filter(home => homeIdsWithTimeSlots.has(home.id)).map(home => ({
//               ...home,
//               timeSlots: timeSlots.filter(slot => slot.homeId === home.id && this.isTimeWithinRange(slot, filters.startTime, filters.endTime)),
//               hasTimeSlots: true,
//             }));
//           })
//         );
//       })
//     );
//   }


//   getAvailableTimeSlots(startTime?: string, endTime?: string): Observable<TimeSlot[]> {
//     const today = new Date();
//     const threeWeeksFromNow = new Date();
//     threeWeeksFromNow.setDate(today.getDate() + 21);

//     const queryParams: TimeSlotQueryParams = {
//       homeId: undefined,
//       startTime: startTime ? new Date(startTime) : today,
//       endTime: endTime ? new Date(endTime) : threeWeeksFromNow,
//       page: 0,
//       size: 100,
//     };
//     return this.timeSlotService.getTimeSlots(queryParams).pipe(
//       map(response => response.items),
//       catchError(error => {
//         console.error('[HomeFacadeService] Error fetching TimeSlots:', error);
//         return of([]);
//       })
//     );
//   }

//   getLocations(search$: Observable<string | null>): Observable<AppLocation[]> {
//     return search$.pipe(
//       map(text => text && text.length >= 2 ? { page: 0, size: 10, text } : null),
//       switchMap(query =>
//         query
//           ? this.locationService.getLocations(query).pipe(
//             map((response: PaginationResponse<AppLocation>) => response.items)
//           )
//           : of([] as AppLocation[])
//       ),
//       catchError(error => {
//         console.error('[HomeFacadeService] Error fetching locations:', error);
//         return of([] as AppLocation[]);
//       })
//     );
//   }

//   getCategories(): Observable<PaginationResponse<Category>> {
//     return this.categoryService.getCategories(0, 100);
//   }

//   private getPropertyImage(index: number): string {
//     const images = this.getPropertyImageList();
//     return images[index % images.length];
//   }

//   private getPropertyImageList(): string[] {
//     return [
//       '/assets/images/casa_afueras.png',
//       '/assets/images/apartamento_centro.png',
//       '/assets/images/apartamento_moderno.png',
//       // '/assets/images/placeholder-house.png',
//     ];
//   }

//   private isTimeWithinRange(slot: TimeSlot, startTime?: string, endTime?: string): boolean {
//     if (!startTime || !endTime) return true;
//     const slotStartTime = new Date(slot.startTime).getTime();
//     const slotEndTime = new Date(slot.endTime).getTime();
//     const filterStartTime = new Date(startTime).getTime();
//     const filterEndTime = new Date(endTime).getTime();

//     return slotStartTime >= filterStartTime && slotEndTime <= filterEndTime;
//   }
// }


// //  private getPropertyImageList(): string[] {
// //     return [
// //       '/assets/images/casa_afueras.png',
// //       '/assets/images/apartamento_centro.png',
// //       '/assets/images/apartamento_moderno.png',
// //       // '/assets/images/placeholder-house.png',
// //     ];
// //   }
import { Injectable, inject } from '@angular/core';
import { HomeService } from '@app/core/services/home/home.service';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { LocationService } from '@app/core/services/location/location.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { Observable, of } from 'rxjs';
import { Home, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model'; // Asegúrate que PaginatedHomeViewModel y Category se importan
import { TimeSlot, TimeSlotQueryParams } from '@app/core/models/time-slot.model';
import { map, switchMap, catchError } from 'rxjs/operators';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Location as AppLocation } from '@app/core/models/location.model';
import { Category } from '@app/core/models/category.model';


@Injectable({
  providedIn: 'root'
})
export class HomeFacadeService {
  private homeService = inject(HomeService);
  private timeSlotService = inject(TimeSlotService);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);

  getHomesWithAvailability(filters: any, componentRequestsFilteringByTime: boolean = false): Observable<PaginatedHomeViewModel> {
    // 'filters' ya debería contener page y size para this.homeService.getProperties
    return this.homeService.getProperties(filters).pipe(
      switchMap((homeResponse: PaginationResponse<Home>) => {
        let homesInitialPage = homeResponse.items.map((home, index) => ({
          ...home,
          image: this.getPropertyImage(index),
          timeSlots: [],
          hasTimeSlots: false
        } as HomeViewModel));

        // Determinar el rango de tiempo para obtener los time slots.
        // Si el componente solicita filtrar por tiempo, usamos los tiempos de los filtros.
        // De lo contrario, getAvailableTimeSlots usará su rango por defecto (ej. próximas 3 semanas).
        const slotFetchStartTime = componentRequestsFilteringByTime ? filters.startTime : undefined;
        const slotFetchEndTime = componentRequestsFilteringByTime ? filters.endTime : undefined;

        return this.getAvailableTimeSlots(slotFetchStartTime, slotFetchEndTime).pipe(
          map(fetchedTimeSlots => {
            // Agrupar los time slots obtenidos por homeId para fácil acceso
            const slotsByHomeId = new Map<number | string, TimeSlot[]>();
            fetchedTimeSlots.forEach(slot => {
              if (!slotsByHomeId.has(slot.homeId)) {
                slotsByHomeId.set(slot.homeId, []);
              }
              slotsByHomeId.get(slot.homeId)!.push(slot);
            });

            let processedHomes: HomeViewModel[];

            if (componentRequestsFilteringByTime) {
              // El usuario ESTÁ filtrando por fecha/hora.
              // Filtramos la lista de propiedades: solo incluir aquellas que tienen slots en el rango especificado.
              // Los fetchedTimeSlots ya están (o deberían estar) dentro del rango especificado por el usuario.
              processedHomes = homesInitialPage
                .filter(home => slotsByHomeId.has(home.id) && (slotsByHomeId.get(home.id)?.length || 0) > 0)
                .map(home => ({
                  ...home,
                  timeSlots: slotsByHomeId.get(home.id) || [],
                  hasTimeSlots: true // Deben tener slots para estar en esta lista filtrada
                }));

              // ADVERTENCIA: La paginación del backend (totalElements, totalPages)
              // puede ser inexacta porque este filtro se aplica en el cliente.
              return {
                items: processedHomes,
                totalElements: homeResponse.totalElements, // Potencialmente inexacto para la lista filtrada
                totalPages: homeResponse.totalPages,       // Potencialmente inexacto
                pageNumber: homeResponse.pageNumber,
                pageSize: homeResponse.pageSize
              } as PaginatedHomeViewModel;

            } else {
              // El usuario NO está filtrando por fecha/hora.
              // Mostramos todas las propiedades de la página actual del backend,
              // y simplemente poblamos sus timeSlots si tienen alguno disponible (basado en la búsqueda general de slots).
              processedHomes = homesInitialPage.map(home => ({
                ...home,
                timeSlots: slotsByHomeId.get(home.id) || [],
                hasTimeSlots: (slotsByHomeId.get(home.id)?.length || 0) > 0
              }));

              // La información de paginación del backend es precisa aquí porque no hemos filtrado propiedades de la página.
              return {
                ...homeResponse, // Mantiene totalElements, totalPages, etc., originales
                items: processedHomes
              } as PaginatedHomeViewModel;
            }
          })
        );
      }),
      catchError(error => {
        console.error('[HomeFacadeService] Error en getHomesWithAvailability:', error);
        return of({
          items: [], totalElements: 0, totalPages: 0,
          pageNumber: filters.page || 0, pageSize: filters.size || 20
        } as PaginatedHomeViewModel);
      })
    );
  }


  getAvailableTimeSlots(startTime?: string, endTime?: string): Observable<TimeSlot[]> {
    const today = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(today.getDate() + 21);

    const queryParams: TimeSlotQueryParams = {
      homeId: undefined,
      startTime: startTime ? new Date(startTime) : today, // Usar startTime si se provee, sino default
      endTime: endTime ? new Date(endTime) : threeWeeksFromNow, // Usar endTime si se provee, sino default
      page: 0,
      size: 1000, // Asumimos que esto es suficiente para obtener todos los slots relevantes
    };
    return this.timeSlotService.getTimeSlots(queryParams).pipe(
      map(response => response.items),
      catchError(error => {
        console.error('[HomeFacadeService] Error fetching TimeSlots:', error);
        return of([]);
      })
    );
  }

  getLocations(search$: Observable<string | null>): Observable<AppLocation[]> {
    return search$.pipe(
      map(text => text && text.length >= 2 ? { page: 0, size: 10, text } : null),
      switchMap(query =>
        query
          ? this.locationService.getLocations(query).pipe(
            map((response: PaginationResponse<AppLocation>) => response.items)
          )
          : of([] as AppLocation[])
      ),
      catchError(error => {
        console.error('[HomeFacadeService] Error fetching locations:', error);
        return of([] as AppLocation[]);
      })
    );
  }

  getCategories(): Observable<PaginationResponse<Category>> {
    return this.categoryService.getCategories(0, 100);
  }

  private getPropertyImage(index: number): string {
    const images = this.getPropertyImageList();
    return images[index % images.length];
  }

  private getPropertyImageList(): string[] {
    return [
      '/assets/images/casa_afueras.png',
      '/assets/images/apartamento_centro.png',
      '/assets/images/apartamento_moderno.png',
    ];
  }
}
