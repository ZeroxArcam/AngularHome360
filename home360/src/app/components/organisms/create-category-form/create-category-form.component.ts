import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from 'src/app/core/services/category/category.service';
import { Observable, catchError, of, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES, CATEGORY_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';

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
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private translationService = inject(TranslationService);
  formMessages = FORM_MESSAGES;
  categoryMessage = CATEGORY_MESSAGES;

  categoryForm = this.fb.group({
    categoryName: ['', [Validators.required, Validators.maxLength(50)]],
    categoryDescription: ['', [Validators.required, Validators.maxLength(90)]]
  });

  formSubmitted = false;
  creationResult$!: Observable<CreationResult>;
  showMessage = false;

  handleCreateCategory(): void {
    this.formSubmitted = true;

    if (this.categoryForm.invalid) {
      this.creationResult$ = of({ success: false, error: this.formMessages.REQUIRED_FIELD });
      return;
    }

    const name = this.categoryForm.get('categoryName')?.value ?? '';
    const description = this.categoryForm.get('categoryDescription')?.value ?? '';
    const categoryData = { name, description };

    this.creationResult$ = this.categoryService.createCategory(categoryData).pipe(
      map((response: any) => {
        this.categoryForm.reset();
        this.formSubmitted = false;
        return {
          success: true,
          message: this.translationService.translate(response?.message || this.categoryMessage.CREATE_SUCCESS),
        };
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.translationService.translate(error.error?.message || this.categoryMessage.CREATE_ERROR)
        return of({ success: false, error: errorMessage });
      })
    );
  }
}
