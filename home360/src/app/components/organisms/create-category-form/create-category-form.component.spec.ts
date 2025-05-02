import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateCategoryFormComponent } from './create-category-form.component';
import { CategoryService } from '@app/core/services/category/category.service';
import { TranslationService } from '@app/core/services/translation/translation.service'; // Importa el TranslationService
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
  const categoryServiceMock = {
    createCategory: jest.fn()
  };
  const translationServiceMock = { // Mock del TranslationService
    translate: (key: string) => key // Simplemente devuelve la misma clave
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateCategoryFormComponent, TextareaFieldComponent, ButtonComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: TranslationService, useValue: translationServiceMock } // Proporciona el mock
      ],
      imports: [HttpClientTestingModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(CreateCategoryFormComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.categoryForm.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the form invalid when empty', () => {
    component.categoryForm.setValue({ categoryName: '', categoryDescription: '' });
    expect(component.categoryForm.invalid).toBe(true);
  });

  it('should not call service if form is invalid', () => {
    const spy = jest.spyOn(categoryService, 'createCategory');
    component.handleCreateCategory();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should call service and reset form on success', fakeAsync(async () => {
    const mockResponse = { message: 'Category created successfully.' }; // Mensaje en inglés del backend
    const spy = jest.spyOn(categoryService, 'createCategory').mockReturnValue(of(mockResponse));

    component.categoryForm.setValue({
      categoryName: 'Test Categoria',
      categoryDescription: 'Descripción de prueba'
    });

    component.handleCreateCategory();
    tick();

    const result = await lastValueFrom(component.creationResult$);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Category created successfully.'); // Verificamos el mensaje original (ya que nuestro mock lo devuelve)
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ name: 'Test Categoria', description: 'Descripción de prueba' });
    expect(component.categoryForm.value).toEqual({ categoryName: null, categoryDescription: null });
  }));

  it('should show error message if service fails', async () => {
    const errorResponse = { error: { message: 'Error in the server' } }; // Mensaje en inglés del backend
    jest.spyOn(categoryService, 'createCategory').mockReturnValue(throwError(() => errorResponse));

    component.categoryForm.setValue({
      categoryName: 'Categoría inválida',
      categoryDescription: 'Descripción que falla'
    });

    component.handleCreateCategory();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorMessage = fixture.nativeElement.querySelector('.create-category-form__snackbar');
    expect(errorMessage.textContent).toContain('Error in the server'); // Verificamos el mensaje original
  });

  it('should use empty string if categoryName is null or undefined', fakeAsync(async () => {
    const spy = jest.spyOn(categoryService, 'createCategory').mockReturnValue(of({ message: '' }));
    component.categoryForm.get('categoryName')?.clearValidators();
    component.categoryForm.get('categoryDescription')?.clearValidators();
    component.categoryForm.updateValueAndValidity();

    component.categoryForm.get('categoryName')?.setValue(null);
    component.categoryForm.get('categoryDescription')?.setValue('Valid description');

    component.categoryForm.get('categoryName')?.setValue(null);
    component.categoryForm.get('categoryDescription')?.setValue('Valid description');

    component.handleCreateCategory();
    tick();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ name: '', description: 'Valid description' });
  }));

  it('should use empty string if categoryDescription is null or undefined', fakeAsync(async () => {
    const spy = jest.spyOn(categoryService, 'createCategory').mockReturnValue(of({ message: '' }));
    component.categoryForm.get('categoryName')?.clearValidators();
    component.categoryForm.get('categoryDescription')?.clearValidators();
    component.categoryForm.updateValueAndValidity();

    component.categoryForm.get('categoryName')?.setValue(null);
    component.categoryForm.get('categoryDescription')?.setValue('Valid description');

    component.categoryForm.get('categoryName')?.setValue('Valid name');
    component.categoryForm.get('categoryDescription')?.setValue(null);

    component.handleCreateCategory();
    tick();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ name: 'Valid name', description: '' });
  }));

  it('should show default error message if no message provided', async () => {
    jest.spyOn(categoryService, 'createCategory').mockReturnValue(
      throwError(() => ({ error: {} }))
    );

    component.categoryForm.setValue({
      categoryName: 'Algo',
      categoryDescription: 'Otra cosa'
    });

    component.handleCreateCategory();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorMessage = fixture.nativeElement.querySelector('.create-category-form__snackbar');
    expect(errorMessage.textContent).toContain('Error al crear la categoría.'); // Este mensaje ya estaba en español en tu componente
  });
});