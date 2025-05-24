import { Injectable, inject } from '@angular/core';
import { HomeService } from '@app/core/services/home/home.service';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { LocationService } from '@app/core/services/location/location.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { Observable, forkJoin, of } from 'rxjs';
import { HomeViewModel } from '@app/core/models/home.model';
import { TimeSlot, TimeSlotQueryParams } from '@app/core/models/time-slot.model';
import { map, switchMap, catchError, debounce, debounceTime } from 'rxjs/operators';
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

  getHomesWithAvailability(filters: any, includeTimeSlots: boolean = false): Observable<HomeViewModel[]> {
    return this.homeService.getProperties(filters).pipe(
      switchMap(homeResponse => {
        let homesWithImages = homeResponse.items.map((home, index) => ({
          ...home,
          image: this.getPropertyImage(index),
          timeSlots: [],
          hasTimeSlots: false
        }));

        if (!includeTimeSlots) {
          return of(homesWithImages);
        }

        return this.getAvailableTimeSlots(filters.startTime, filters.endTime).pipe(
          map(timeSlots => {
            let homeIdsWithTimeSlots = new Set(timeSlots.map(slot => slot.homeId));
            return homesWithImages.map(home => ({
              ...home,
              timeSlots: timeSlots.filter(slot => slot.homeId === home.id),
              hasTimeSlots: homeIdsWithTimeSlots.has(home.id),
            })).filter(home => home.hasTimeSlots);
          })
        );
      })
    );
  }

  getAvailableTimeSlots(startTime?: string, endTime?: string): Observable<TimeSlot[]> {
    const today = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(today.getDate() + 21);

    const queryParams: TimeSlotQueryParams = {
      homeId: undefined,
      startTime: startTime || today,
      endTime: endTime || threeWeeksFromNow,
      page: 0,
      size: 100,
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
      '/assets/images/placeholder-house.png',
    ];
  }

}
