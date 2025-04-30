import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateCategoryFormComponent } from './create-category-form.component';
import { CategoryService } from '@app/core/services/category/category.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, lastValueFrom } from 'rxjs';
import { TextareaFieldComponent } from '../../molecules/textarea-field/textarea-field.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { jest } from '@jest/globals';

describe('CreateCategoryFormComponent', () => {
  let component: CreateCategoryFormComponent;
  let fixture: ComponentFixture<CreateCategoryFormComponent>;
  let categoryService: CategoryService;

  // Mock de CategoryService
  const categoryServiceMock = {
    createCategory: jest.fn()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateCategoryFormComponent, TextareaFieldComponent, ButtonComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock }
      ],
      imports: [HttpClientTestingModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(CreateCategoryFormComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the form invalid when empty', () => {
    component.categoryForm.setValue({ nombreCategoria: '', descripcionCategoria: '' });
    expect(component.categoryForm.invalid).toBe(true);
  });

  it('should not call service if form is invalid', () => {
    const spy = jest.spyOn(categoryService, 'createCategory');
    component.handleCrearCategoria();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should call service and reset form on success', fakeAsync(async () => {
    const mockResponse = { message: 'Categoría creada exitosamente.' };
    const spy = jest.spyOn(categoryService, 'createCategory').mockReturnValue(of(mockResponse));

    component.categoryForm.setValue({
      nombreCategoria: 'Test Categoria',
      descripcionCategoria: 'Descripción de prueba'
    });

    component.handleCrearCategoria();
    tick(); // simula paso de tiempo para Observable

    const result = await lastValueFrom(component.creationResult$);
    expect(result.success).toBe(true);

    expect(spy).toHaveBeenCalledWith({ name: 'Test Categoria', description: 'Descripción de prueba' });
    expect(component.categoryForm.value).toEqual({ nombreCategoria: null, descripcionCategoria: null });
  }));

  it('should show error message if service fails', async () => {
    const errorResponse = { error: { message: 'Error en el servidor' } };
    categoryServiceMock.createCategory.mockReturnValue(throwError(() => errorResponse));
    component.categoryForm.setValue({
      nombreCategoria: 'Categoría inválida',
      descripcionCategoria: 'Descripción que falla'
    });

    component.handleCrearCategoria();
    fixture.detectChanges();

    await fixture.whenStable();

    const errorMessage = fixture.nativeElement.querySelector('.snackbar');
    expect(errorMessage.textContent).toContain('Error en el servidor');
  });

});
