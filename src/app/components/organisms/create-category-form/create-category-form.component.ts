import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from 'src/app/core/services/category/category.service';
import { Observable, catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http'; // Importa HttpErrorResponse

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
  categoryForm = inject(FormBuilder).group({
    nombreCategoria: ['', Validators.required],
    descripcionCategoria: ['', Validators.required]
  });

  creationResult$: Observable<CreationResult> = of({ success: false });
  snackbarMessage: string = ''; // Ya no necesitamos actualizarla directamente
  // creationSuccess: boolean = false; // Ya no necesitamos actualizarla directamente
  // creationError: string = '';   // Ya no necesitamos actualizarla directamente

  async handleCrearCategoria() {
    if (this.categoryForm.valid) {
      const nombre = this.categoryForm.get('nombreCategoria')?.value;
      const descripcion = this.categoryForm.get('descripcionCategoria')?.value;

      if (typeof nombre === 'string' && typeof descripcion === 'string') {
        const categoryData = {
          name: nombre,
          description: descripcion
        };

        this.creationResult$ = this.categoryService.createCategory(categoryData).pipe(
          map((response: any) => {
            this.categoryForm.reset();
            return { success: true, message: response.message };
          }),
          catchError((error: any) => {
            return of({ success: false, error: error.error?.message || 'Error al crear la categoría.' });
          })
        );
      } else {
        this.creationResult$ = of({ success: false, error: 'Los campos de nombre y descripción deben ser cadenas de texto.' });
      }
    } else {
      this.creationResult$ = of({ success: false, error: 'Por favor, completa todos los campos requeridos.' });
    }
  }
}
