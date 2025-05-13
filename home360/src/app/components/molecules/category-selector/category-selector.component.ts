import { Component, OnInit, OnDestroy, inject, Output, EventEmitter, Input } from '@angular/core';
import { CategoryService } from '@app/core/services/category/category.service';
import { Category } from '@app/core/models/category.model';
import { Subject, takeUntil, expand, reduce, tap, catchError, of, map, EMPTY, filter } from 'rxjs';
import { TranslationService } from '@app/core/services/translation/translation.service';

@Component({
  selector: 'app-category-selector',
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss']
})
export class CategorySelectorComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private translationService = inject(TranslationService);
  private destroy$ = new Subject<void>();

  categories: Category[] = [];
  @Output() categorySelected = new EventEmitter<number | null>(); // Emitir el ID
  @Input() selectedValue: number | null = null;

  ngOnInit(): void {
    this.loadAllCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
        filter(response => response !== null),
        map(response => response.items),
        reduce<Category[], Category[]>((acc: Category[], items: Category[]) => [...acc, ...items], []),
        tap(allCategories => {
          this.categories = allCategories;
          console.log('Categorías cargadas:', this.categories);
        }),
        catchError(error => {
          const errorMessage = this.translationService.translate(error.error?.message);
          return of([]);
        })
      )
      .subscribe();
  }
  onCategoryChange(event: any): void {
    const selectedId = event.target.value === '' ? null : parseInt(event.target.value, 10);
    this.categorySelected.emit(selectedId); // Emitir el ID de la categoría seleccionada (o null)
  }
}
