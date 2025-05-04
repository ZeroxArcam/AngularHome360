import { Component, inject, OnInit } from '@angular/core';
import { LocationService } from '@app/core/services/location/location.service';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Location } from '@app/core/models/location.model';
import { catchError, switchMap, map, tap, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  text?: string;
}

@Component({
  selector: 'app-list-locations',
  templateUrl: './list-locations.component.html',
  styleUrls: ['./list-locations.component.scss']
})
export class ListLocationsComponent implements OnInit {
  private locationService = inject(LocationService);

  private pageSize = 10;
  private initialSortBy = 'cityName';
  private initialSortDirection = 'ASC';
  private paginationParams = new BehaviorSubject<PaginationParams>({
    page: 0,
    size: this.pageSize,
    sortBy: this.initialSortBy,
    sortDirection: this.initialSortDirection,
    text: ''
  });

  page$ = this.paginationParams.pipe(map(params => params.page));
  private totalPagesSubject = new BehaviorSubject<number>(0);
  totalPages$ = this.totalPagesSubject.asObservable();
  pages$: Observable<number[]> | undefined;

  filterTextControl = new FormControl('');

  locationsDto$: Observable<PaginationResponse<Location>> = this.paginationParams.pipe(
    switchMap(({ page, size, sortBy, sortDirection, text }) =>
      this.locationService.getLocations({ page, size, sortBy, sortDirection, text }).pipe(
        tap(response => {
          const totalPages = typeof response?.totalPages === 'number' ? response.totalPages : 0;
          this.totalPagesSubject.next(totalPages);
          this.pages$ = this.totalPages$.pipe(
            map(totalPages => Array.from({ length: totalPages }, (_, i) => i))
          );
        }),

        catchError((error) => {
          return throwError(() => error);
        })
      )
    )
  );

  currentSortBy = this.initialSortBy;
  currentSortDirection = this.initialSortDirection;

  ngOnInit(): void {
    this.filterTextControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(text => this.paginationParams.next({ ...this.paginationParams.value, text: text || '', page: 0 }))
    ).subscribe();
  }

  goToPage(p: number): void {
    this.paginationParams.next({ ...this.paginationParams.value, page: p });
  }

  prevPage(): void {
    const currentPage = this.paginationParams.value.page;
    if (currentPage > 0) {
      this.paginationParams.next({ ...this.paginationParams.value, page: currentPage - 1 });
    }
  }

  nextPage(): void {
    this.totalPages$.pipe(take(1)).subscribe(totalPages => {
      if (totalPages !== undefined && this.paginationParams.value.page < totalPages - 1) {
        this.paginationParams.next({ ...this.paginationParams.value, page: this.paginationParams.value.page + 1 });
      }
    });
  }

  toggleOrder(sortByField: string): void {
    if (this.currentSortBy === sortByField) {
      this.currentSortDirection = this.currentSortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.currentSortBy = sortByField;
      this.currentSortDirection = 'ASC';
    }
    this.paginationParams.next({ ...this.paginationParams.value, sortBy: this.currentSortBy, sortDirection: this.currentSortDirection, page: 0 });
  }
}
