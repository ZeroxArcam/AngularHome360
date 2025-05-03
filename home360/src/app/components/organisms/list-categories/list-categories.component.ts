import { Component, inject, OnInit } from '@angular/core';
import { CategoryService } from '@app/core/services/category/category.service';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Category } from '@app/core/models/category.model';
import { catchError, switchMap, map, tap, take } from 'rxjs/operators';

interface PaginationParams {
  page: number;
  size: number;
  order: boolean;
}

@Component({
  selector: 'app-list-categories',
  templateUrl: './list-categories.component.html',
  styleUrls: ['./list-categories.component.scss']
})
export class ListCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);

  private pageSize = 3;
  private initialOrderAsc = true;
  private paginationParams = new BehaviorSubject<PaginationParams>({
    page: 0,
    size: this.pageSize,
    order: this.initialOrderAsc,
  });

  page$ = this.paginationParams.pipe(map(params => params.page));
  private totalPagesSubject = new BehaviorSubject<number>(0);
  totalPages$ = this.totalPagesSubject.asObservable();
  pages$: Observable<number[]> | undefined;

  pageDto$: Observable<PaginationResponse<Category>> = this.paginationParams.pipe(
    switchMap(({ page, size, order }) =>
      this.categoryService.getCategories(page, size, order).pipe(
        tap(response => {
          this.totalPagesSubject.next(response?.totalPages || 0);
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

  orderAscending = this.initialOrderAsc;

  ngOnInit(): void {
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
        this.paginationParams.next({ page: this.paginationParams.value.page + 1, size: this.pageSize, order: this.orderAscending });
      }
    });
  }

  toggleOrder(): void {
    this.orderAscending = !this.orderAscending;
    this.paginationParams.next({ ...this.paginationParams.value, order: this.orderAscending, page: 0 });
  }
}
