import { Injectable, inject } from '@angular/core';
import { HomeService } from '@app/core/services/home/home.service';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { LocationService } from '@app/core/services/location/location.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { Observable, of } from 'rxjs';
import { Home, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model';
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
    return this.homeService.getProperties(filters).pipe(
      switchMap((homeResponse: PaginationResponse<Home>) => {
        let homesInitialPage = homeResponse.items.map((home, index) => ({
          ...home,
          image: this.getPropertyImage(index),
          timeSlots: [],
          hasTimeSlots: false
        } as HomeViewModel));

        const slotFetchStartTime = componentRequestsFilteringByTime ? filters.startTime : undefined;
        const slotFetchEndTime = componentRequestsFilteringByTime ? filters.endTime : undefined;

        return this.getAvailableTimeSlots(slotFetchStartTime, slotFetchEndTime).pipe(
          map(fetchedTimeSlots => {
            const slotsByHomeId = new Map<number | string, TimeSlot[]>();
            fetchedTimeSlots.forEach(slot => {
              if (!slotsByHomeId.has(slot.homeId)) {
                slotsByHomeId.set(slot.homeId, []);
              }
              slotsByHomeId.get(slot.homeId)!.push(slot);
            });

            let processedHomes: HomeViewModel[];

            if (componentRequestsFilteringByTime) {
              processedHomes = homesInitialPage
                .filter(home => slotsByHomeId.has(home.id) && (slotsByHomeId.get(home.id)?.length || 0) > 0)
                .map(home => ({
                  ...home,
                  timeSlots: slotsByHomeId.get(home.id) || [],
                  hasTimeSlots: true
                }));

              return {
                items: processedHomes,
                totalElements: homeResponse.totalElements,
                totalPages: homeResponse.totalPages,
                pageNumber: homeResponse.pageNumber,
                pageSize: homeResponse.pageSize
              } as PaginatedHomeViewModel;

            } else {
              processedHomes = homesInitialPage.map(home => ({
                ...home,
                timeSlots: slotsByHomeId.get(home.id) || [],
                hasTimeSlots: (slotsByHomeId.get(home.id)?.length || 0) > 0
              }));

              return {
                ...homeResponse,
                items: processedHomes
              } as PaginatedHomeViewModel;
            }
          })
        );
      }),
      catchError(error => {
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
      startTime: startTime ? new Date(startTime) : today,
      endTime: endTime ? new Date(endTime) : threeWeeksFromNow,
      page: 0,
      size: 1000,
    };
    return this.timeSlotService.getTimeSlots(queryParams).pipe(
      map(response => response.items),
      catchError(error => {
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
