import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { HomeService } from '@app/core/services/home/home.service';
import { Observable, BehaviorSubject, throwError, of, Subject, EMPTY } from 'rxjs';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Home, PagedHomeRequest } from '@app/core/models/home.model';
import { catchError, switchMap, map, tap, debounceTime, distinctUntilChanged, take, takeUntil, expand, reduce } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import { CategoryService } from '@app/core/services/category/category.service';
import { LocationService } from '@app/core/services/location/location.service';
import { Location } from '@app/core/models/location.model';
import { Category } from '@app/core/models/category.model';

@Component({
  selector: 'app-list-home',
  templateUrl: './list-home.component.html',
  styleUrls: ['./list-home.component.scss']
})
export class ListHomeComponent implements OnInit, OnDestroy {
  private homeService = inject(HomeService);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);
  categories: Category[] = [];
  locations: Location[] = [];

  private pageSize = 6;
  private initialSortBy = 'price';
  private initialSortDirection = 'ASC';
  protected paginationParams = new BehaviorSubject<PagedHomeRequest>({
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
  pages$: Observable<number[]> = of([]);
  isFiltersVisible = false;
  filterForm = this.fb.group({
    locationId: [null as number | null],
    categoryId: [null as number | null],
    userId: [null as number | null],
    homeId: [null as number | null],
    minRooms: [null as number | null],
    maxRooms: [null as number | null],
    minBathrooms: [null as number | null],
    maxBathrooms: [null as number | null],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
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
  protected destroy$ = new Subject<void>();

  ngOnInit(): void {
    // // Inicializa la visibilidad de filtros según el tamaño de pantalla
    // this.isFiltersVisible = !this.isMobile;
    // if (!this.isMobile) {
    //   this.isFiltersVisible = true;
    // }

    window.addEventListener('resize', this.handleResize);

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

    this.loadAllCategories();
    this.loadAllLocations();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleResize = () => {
    const wasMobile = this.isMobile;
    // Si cambia de móvil a escritorio, muestra filtros; si cambia a móvil, oculta filtros
    if (!this.isMobile && !this.isFiltersVisible) {
      this.isFiltersVisible = true;
    } else if (this.isMobile && this.isFiltersVisible) {
      this.isFiltersVisible = false;
    }
  };

  loadAllCategories(): void {
    this.categoryService.getCategories(0, 10)
      .pipe(
        takeUntil(this.destroy$),
        expand(response => {
          if (response.pageNumber < response.totalPages - 1) {
            return this.categoryService.getCategories(response.pageNumber + 1, 10);
          } else {
            return EMPTY;
          }
        }),
        map(response => response.items),
        reduce<Category[], Category[]>((acc: Category[], items: Category[]) => [...acc, ...items], []),
        tap(allCategories => {
          this.categories = allCategories;
        }),
        catchError(error => {
          return of([]);
        })
      )
      .subscribe();
  }

  loadAllLocations(): void {
    this.locationService.getLocations({ page: 0, size: 10 })
      .pipe(
        takeUntil(this.destroy$),
        expand(response => {
          if (response.pageNumber < response.totalPages - 1) {
            return this.locationService.getLocations({ page: response.pageNumber + 1, size: 10 });
          } else {
            return EMPTY;
          }
        }),
        map(response => response.items),
        reduce<Location[], Location[]>((acc: Location[], items: Location[]) => [...acc, ...items], []),
        tap(allLocations => {
          this.locations = allLocations;
        }),
        catchError(error => {
          return of([]);
        })
      )
      .subscribe();
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

  onMobileSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.currentSortBy = value;
    this.currentSortDirection = 'ASC';
    this.paginationParams.next({
      ...this.paginationParams.value,
      sortBy: value,
      sortDirection: 'ASC',
      page: 0
    });
  }

  onDesktopSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.currentSortBy = value;
    this.updateSort();
  }

  toggleSortDirection() {
    this.currentSortDirection = this.currentSortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.updateSort();
  }

  updateSort() {
    this.paginationParams.next({
      ...this.paginationParams.value,
      sortBy: this.currentSortBy,
      sortDirection: this.currentSortDirection
    });
  }

  toggleFiltersVisibility(): void {
    this.isFiltersVisible = !this.isFiltersVisible;
  }

  get isMobile(): boolean {
    return window.innerWidth < 768;
  }
}
