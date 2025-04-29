import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from 'src/app/core/services/category/category.service';
import { Observable, catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-create-category-form',
  templateUrl: './create-category-form.component.html',
  styleUrls: ['./create-category-form.component.scss']
})
export class CreateCategoryFormComponent {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  categoryForm = this.fb.group({
    nombreCategoria: ['', [Validators.required, Validators.maxLength(50)]],
    descripcionCategoria: ['', [Validators.required, Validators.maxLength(90)]]
  });

  formSubmitted = false;
  creationResult$!: Observable<CreationResult>;

  handleCrearCategoria() {
    this.formSubmitted = true;

    if (this.categoryForm.invalid) {
      this.creationResult$ = of({ success: false, error: 'Por favor, completa todos los campos requeridos.' });
      return;
    }

    const nombre = this.categoryForm.get('nombreCategoria')?.value ?? '';
    const descripcion = this.categoryForm.get('descripcionCategoria')?.value ?? '';

    const categoryData = { name: nombre, description: descripcion };

    this.creationResult$ = this.categoryService.createCategory(categoryData).pipe(
      map((response: any) => {
        this.categoryForm.reset();
        this.formSubmitted = false; // Resetea el estado para ocultar el mensaje
        return { success: true, message: response?.message || 'Categoría creada exitosamente.' };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creando categoría:', error);
        const errorMessage = error.error?.message || 'Error al crear la categoría.';
        return of({ success: false, error: errorMessage });
      })

    );
  }
}
