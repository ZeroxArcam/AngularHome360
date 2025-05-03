// import { Injectable, inject } from '@angular/core';
// import { TranslationService } from '@app/core/services/translation/translation.service';
// import { FormGroup } from '@angular/forms';
// import { Observable, of } from 'rxjs';

// interface ValidationResult {
//   isValid: boolean;
//   errorMessage?: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class DatavalidationService {
//   private translationService = inject(TranslationService);

//   /**
//    * Valida un FormGroup y devuelve un Observable con el resultado de la validación.
//    */
//   validateForm(form: FormGroup): Observable<ValidationResult> {
//     if (form.valid) {
//       return of({ isValid: true });
//     }

//     let errorMessage: string | null = null;
//     const firstInvalidControl = this.getFirstInvalidControl(form);

//     if (firstInvalidControl) {
//       errorMessage = this.getControlErrorMessage(form, firstInvalidControl);
//     }

//     return of({ isValid: false, errorMessage: errorMessage || this.translationService.translate('Por favor, completa todos los campos requeridos.') });
//   }

//   /**
//    * Obtiene el mensaje de error para un control específico dentro de un FormGroup.
//    */
//   getControlErrorMessage(form: FormGroup, controlName: string): string | null {
//     const control = form.get(controlName);
//     if (control?.invalid && (control.dirty || control.touched)) {
//       if (control.errors?.['required']) {
//         return this.translationService.translate('Por favor, completa todos los campos requeridos.');
//       }
//       if (control.errors?.['maxlength']) {
//         const maxLength = control.errors['maxlength'].requiredLength;
//         return this.translationService.translate('Este campo excedió el número máximo de carácteres.');
//       }
//       if (control.errors?.['pattern']) {
//         if (controlName === 'cityDepartmentId') {
//           return this.translationService.translate('El ID debe ser un número entero.');
//         }
//         // Puedes agregar más patrones específicos por campo aquí
//       }
//       // Agrega más condiciones para otros tipos de errores
//     }
//     return null;
//   }

//   /**
//    * Obtiene el nombre del primer control inválido en un FormGroup.
//    */
//   private getFirstInvalidControl(form: FormGroup): string | null {
//     for (const controlName in form.controls) {
//       if (form.controls.hasOwnProperty(controlName) && form.controls[controlName].invalid) {
//         return controlName;
//       }
//     }
//     return null;
//   }

//   /**
//    * Maneja el resultado de una operación (éxito o error) y devuelve un Observable con el mensaje traducido.
//    */
//   handleOperationResult<T>(response: T, successMessageKey: string, errorMessageKey: string): Observable<{ success: boolean; message?: string; error?: string }> {
//     return of({
//       success: !!response,
//       message: response ? this.translationService.translate(successMessageKey) : undefined,
//       error: response ? undefined : this.translationService.translate(errorMessageKey),
//     });
//   }

//   // Puedes agregar más métodos genéricos para otras validaciones o manejo de resultados
// }
