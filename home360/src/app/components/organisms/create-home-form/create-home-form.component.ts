import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { HomeService } from '../../../core/services/home/home.service';
import { HomeRequest, HomeResponse } from '@app/core/models/home.model';
import { catchError, EMPTY, expand, map, of, reduce, Subject, takeUntil, tap } from 'rxjs';
import { CategoryService } from '@app/core/services/category/category.service';
import { Category } from '@app/core/models/category.model';
import { LocationService } from '@app/core/services/location/location.service';
import { Location } from '@app/core/models/location.model';

interface CreationResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface CityDepartment {
  id: number;
  name: string;
  department: string;
}

@Component({
  selector: 'app-create-home-form',
  templateUrl: './create-home-form.component.html',
  styleUrls: ['./create-home-form.component.scss']
})
export class CreateHomeFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private homeService = inject(HomeService);
  private translationService = inject(TranslationService);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  formMessages = FORM_MESSAGES;
  // citiesDepartments: CityDepartment[] = [];
  locations: Location[] = [];
  categories: Category[] = [];
  formSubmitted = false;
  creationResult$ = new Subject<CreationResult | null>();
  minActivePublicationDate: string | null = null;
  maxActivePublicationDate: string | null = null;
  maxPublicationDate: string | null = null;

  propertyForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    address: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required]],
    category: ['', [Validators.required, Validators.maxLength(50)]],
    numberOfRooms: [null as number | null, [Validators.required, Validators.min(1)]],
    numberOfBathrooms: [null as number | null, [Validators.required, Validators.min(1)]],
    price: [null as number | null, [Validators.required, Validators.min(1)]],
    cityId: [null as number | null, Validators.required],
    activePublicationDate: [new Date(), Validators.required],
    publicationDate: [new Date(), Validators.required],
  });

  ngOnInit(): void {
    // this.http.get<CityDepartment[]>('/assets/city-departments.json')
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(data => {
    //     this.citiesDepartments = data;
    //   });

    this.loadAllCategories();
    this.loadAllLocations();
    this.calculatePublicationDateLimits();
    this.calculateActivePublicationDateLimits(this.propertyForm.controls['publicationDate'].value);

    this.propertyForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.creationResult$.next(null);
    });

    this.propertyForm.controls['publicationDate'].valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.calculateActivePublicationDateLimits(value);
    });
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
        map(response => response.items),
        reduce<Category[], Category[]>((acc: Category[], items: Category[]) => [...acc, ...items], []),
        tap(allCategories => {
          this.categories = allCategories;
        }),
        catchError(error => {
          const errorMessage = this.translationService.translate(error.error?.message);
          this.creationResult$.next({ success: false, error: errorMessage });
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
            return this.locationService.getLocations({ page: response.pageNumber + 1, size: 10 })
          }
          else {
            return EMPTY;
          }
        }),
        map(response => response.items),
        reduce<Location[], Location[]>((acc: Location[], items: Location[]) => [...acc, ...items], []),
        tap(allLocations => {
          this.locations = allLocations;
        }),
        catchError(error => {
          const errorMessage = this.translationService.translate(error.error?.message);
          this.creationResult$.next({ success: false, error: errorMessage });
          return of([]);
        })

      ).subscribe();
  }

  // expand realiza múltiples peticiones paginadas.
  // map extrae el array de datos de cada respuesta.
  // reduce combina todos esos arrays en uno solo.
  // tap toma ese array final y lo asigna a una propiedad del componente para que podamos usarlo en la vista.
  onInputChange(event: any, controlName: keyof typeof this.propertyForm.controls, maxLength: number): void {
    const value = event.target.value;

    if (value.length > maxLength) {
      event.target.value = value.slice(0, maxLength);
      this.propertyForm.controls[controlName].setValue(value.slice(0, maxLength));
    }

    if (value < 0 && maxLength > 0) {
      event.target.value = value.slice(1);
      this.propertyForm.controls[controlName].setValue(value.slice(1));
      return;
    }
  }
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  calculatePublicationDateLimits(): void {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    this.maxPublicationDate = this.formatDate(maxDate);
  }

  calculateActivePublicationDateLimits(publicationDateValue: any): void {
    const today = new Date();
    this.minActivePublicationDate = this.formatDate(today);
    this.maxActivePublicationDate = null;

    if (publicationDateValue) {
      const publicationDate = new Date(publicationDateValue);
      const maxActiveDate = new Date(publicationDate);
      maxActiveDate.setDate(publicationDate.getDate() + 30);
      const absoluteMax = new Date(today);
      absoluteMax.setDate(today.getDate() + 30);
      this.maxActivePublicationDate = this.formatDate(maxActiveDate > absoluteMax ? absoluteMax : maxActiveDate);
      this.minActivePublicationDate = this.formatDate(publicationDate > today ? publicationDate : today);
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  handleCreateHome(): void {
    this.formSubmitted = true;

    if (this.propertyForm.invalid) {
      this.creationResult$.next({ success: false, error: this.formMessages.INVALID_FORM });
      return;
    }

    const homeRequest: HomeRequest = {
      name: this.propertyForm.value.name!,
      address: this.propertyForm.value.address!,
      description: this.propertyForm.value.description!,
      category: this.propertyForm.value.category!,
      numberOfRooms: this.propertyForm.value.numberOfRooms!,
      numberOfBathrooms: this.propertyForm.value.numberOfBathrooms!,
      price: this.propertyForm.value.price!,
      cityId: this.propertyForm.value.cityId!,
      activePublicationDate: this.propertyForm.value.activePublicationDate!,
      publicationDate: this.propertyForm.value.publicationDate!
    }

    this.homeService.createProperty(homeRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: HomeResponse) => {
        this.propertyForm.reset();
        this.formSubmitted = false;
        this.creationResult$.next({
          success: true,
          message: this.translationService.translate(response?.message),
        });
        this.cdr.detectChanges();
        setTimeout(() => {
          this.creationResult$.next(null);
        }, 3000);
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = this.translationService.translate(error.error?.message);
        this.formSubmitted = false;
        this.creationResult$.next({ success: false, error: errorMessage });
      },
    });

  }
}
