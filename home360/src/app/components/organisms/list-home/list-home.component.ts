import { Component, inject, OnInit } from '@angular/core';
import { HomeService } from '@app/core/services/home/home.service';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Home, PagedHomeRequest } from '@app/core/models/home.model';
import { catchError, switchMap, map, tap, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-list-home',
  templateUrl: './list-home.component.html',
  styleUrls: ['./list-home.component.scss']
})
export class ListHomeComponent implements OnInit {
  private homeService = inject(HomeService);
  private fb = inject(FormBuilder);

  private pageSize = 10;
  private initialSortBy = 'price';
  private initialSortDirection = 'ASC';
  private paginationParams = new BehaviorSubject<PagedHomeRequest>({
    page: 0,
    size: this.pageSize,
    sortBy: this.initialSortBy,
    sortDirection: this.initialSortDirection,
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
    currentDate: null,
  });

  page$ = this.paginationParams.pipe(map(params => params.page));
  private totalPagesSubject = new BehaviorSubject<number>(0);
  totalPages$ = this.totalPagesSubject.asObservable();
  pages$: Observable<number[]> | undefined;
  isFiltersVisible = true;

  filterForm = this.fb.group({
    locationId: [null as number | null],
    categoryId: [null as number | null],
    userId: [null],
    homeId: [null],
    minRooms: [null],
    maxRooms: [null],
    minBathrooms: [null],
    maxBathrooms: [null],
    minPrice: [null],
    maxPrice: [null],
    currentDate: [null],
  });

  propertiesDto$: Observable<PaginationResponse<Home>> = this.paginationParams.pipe(
    switchMap((params: PagedHomeRequest) =>
      this.homeService.getProperties(params).pipe(
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
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(filters => {
        this.paginationParams.next({
          ...this.paginationParams.value,
          ...filters,
          page: 0
        });
      })
    ).subscribe();
  }

  onCategorySelected(categoryId: number | null): void {
    this.filterForm.patchValue({ categoryId: categoryId });
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
    this.paginationParams.next({ ...this.paginationParams.value, sortBy: sortByField, sortDirection: this.currentSortDirection, page: 0 });
  }

  toggleFiltersVisibility(): void {
    this.isFiltersVisible = !this.isFiltersVisible;
  }
}
