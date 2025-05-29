import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, take, throwError } from 'rxjs';
import { ListCategoriesComponent } from './list-categories.component';
import { CategoryService } from '@app/core/services/category/category.service';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Category } from '@app/core/models/category.model';

describe('ListCategoriesComponent', () => {
  let component: ListCategoriesComponent;
  let fixture: ComponentFixture<ListCategoriesComponent>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const mockResponse: PaginationResponse<Category> = {
    items: [],
    totalElements: 10,
    totalPages: 3,
    pageNumber: 0,
    pageSize: 5,
  };

  beforeEach(async () => {
    mockCategoryService = {
      getCategories: jest.fn().mockReturnValue(of(mockResponse)),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [ListCategoriesComponent],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should go to specific page', () => {
    component.goToPage(2);
    component.page$.subscribe((page) => {
      expect(page).toBe(2);
    });
  });

  it('should decrement page on prevPage if not on first page', () => {
    component.goToPage(2);
    component.prevPage();
    component.page$.subscribe((page) => {
      expect(page).toBe(1);
    });
  });

  it('should not decrement page on prevPage if on first page', () => {
    component.goToPage(0);
    component.prevPage();
    component.page$.subscribe((page) => {
      expect(page).toBe(0);
    });
  });

  it('should increment page on nextPage if not at last page', (done) => {
    component.goToPage(1);

    component.totalPages$.pipe(take(1)).subscribe(() => {
      component.nextPage();

      component.page$.pipe(take(1)).subscribe(page => {
        expect(page).toBe(2);
        done();
      });
    });
  });


  it('should not increment page on nextPage if at last page', (done) => {
    component.goToPage(2);
    component.nextPage();
    component.page$.subscribe(page => {
      expect(page).toBe(2);
      done();
    });
  });

  it('should toggle order and reset to page 0', (done) => {
    component.goToPage(2);
    component.toggleOrder();
    component.page$.subscribe(page => {
      expect(page).toBe(0);
      expect(component.orderAscending).toBe(false);
      done();
    });
  });

  it('should handle error in getCategories', (done) => {
    mockCategoryService.getCategories.mockReturnValueOnce(
      throwError(() => new Error('Error!'))
    );
    component.pageDto$.pipe(take(1)).subscribe({
      next: () => done.fail('Test falló: debería haber recibido error'),
      error: (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Error!');
        done();
      }
    });
    component['paginationParams'].next({ page: 0, size: 5, order: true });
  });

});
