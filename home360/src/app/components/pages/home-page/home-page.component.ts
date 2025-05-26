import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';
import { HomeViewModel, Property, TimeSlot, PaginatedHomeViewModel } from '@app/core/models/home.model';
import { Category } from '@app/core/models/category.model';
import { Location as AppLocation } from '@app/core/models/location.model';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { min } from 'moment-timezone';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {
  showLoginModal: boolean = false;
  // filterForm: FormGroup;

  locationSearchControl = new FormControl('');
  selectedLocationId: number | null = null;
  filteredLocations: AppLocation[] = [];
  isLoadingLocations: boolean = false;
  showAutocompleteResults: boolean = false;
  selectionMade: boolean = false;
  previousInputValue: string | null = '';
  lastSelectedLocationDisplay: string | null = null;
  isTyping = false;
  isDeleting = false;
  private typingTimeout: any;
  highlightedIndex = 0;

  includeTimeSlots: boolean = true;

  private homeFacade = inject(HomeFacadeService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public properties: Property[] = [];
  public isLoadingProperties: boolean = false;
  public categories: Category[] = [];

  showFilterSidebar: boolean = false;
  currentView: 'grid' | 'list' = 'grid';

  private destroy$ = new Subject<void>();

  public sortOptions = [
    { value: 'price', label: 'Precio', service: 'home' },
    { value: 'numberOfRooms', label: 'Habitaciones', service: 'home' },
    { value: 'numberOfBathrooms', label: 'Baños', service: 'home' },
    { value: 'locationId', label: 'Ubicación', service: 'home' },
    { value: 'categoryId', label: 'Categoría', service: 'home' },
  ];
  public defaultSortBy: string = this.sortOptions[0].value;
  public currentSortDirection: 'ASC' | 'DESC' = 'ASC';

  public currentPage: number = 0;
  public pageSize: number = 9;
  public totalPages: number = 0;
  public totalElements: number = 0;
  public pageNumbers: number[] = [];


  filterForm = this.fb.group({
    categorySelectControl: [null],
    minRoomsControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    maxRoomsControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    minBathroomsControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    maxBathroomsControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    minPriceControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    maxPriceControl: [null, [Validators.pattern('^\\d+$'), Validators.min(0)]],
    minDateControl: [null],
    maxDateControl: [null],
    minTimeControl: [null],
    maxTimeControl: [null],
    sortByControl: [this.defaultSortBy],

  }, {
    validators: [
      this.rangeValidator('minRoomsControl', 'maxRoomsControl', 'minRoomsGreaterThanMax'),
      this.rangeValidator('minBathroomsControl', 'maxBathroomsControl', 'minBathroomsGreaterThanMax'),
      this.rangeValidator('minPriceControl', 'maxPriceControl', 'minPriceGreaterThanMax'),
      this.dateTimeRangeValidator()
    ]
  });





  ngOnInit(): void {
    this.setupLocationAutocomplete();
    this.loadCategories();

    this.filterForm.get('sortByControl')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 0;
      this.loadProperties();
    });

    const dateOrTimeControls = ['minDateControl', 'maxDateControl', 'minTimeControl', 'maxTimeControl'];
    dateOrTimeControls.forEach(controlName => {
      this.filterForm.get(controlName)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.checkTimeSlotFilters();
      });
    });

    this.checkTimeSlotFilters();
    this.loadProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() { return this.filterForm.controls; }

  private rangeValidator(minControlName: string, maxControlName: string, errorName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const minControl = group.get(minControlName);
      const maxControl = group.get(maxControlName);
      if (!minControl || !maxControl) return null;
      if (minControl.value !== null && maxControl.value !== null && Number(minControl.value) > Number(maxControl.value)) {
        maxControl.setErrors({ [errorName]: true });
        return { [errorName]: true };
      } else {
        if (maxControl.hasError(errorName)) {
          const currentErrors = { ...maxControl.errors };
          delete currentErrors[errorName];
          maxControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
        }
      }
      return null;
    };
  }

  getMinDateStartTime(): string {
    const nowPlusTwoHours = new Date();
    const year = nowPlusTwoHours.getFullYear();
    const month = (nowPlusTwoHours.getMonth() + 1).toString().padStart(2, '0');
    const day = nowPlusTwoHours.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  private dateTimeRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const minDate = group.get('minDateControl');
      const maxDate = group.get('maxDateControl');
      const minTime = group.get('minTimeControl');
      const maxTime = group.get('maxTimeControl');
      if (!minDate || !maxDate || !minTime || !maxTime) return null;
      const minDateValue = minDate.value;
      const maxDateValue = maxDate.value;
      const minTimeValue = minTime.value;
      const maxTimeValue = maxTime.value;

      let errors: ValidationErrors = {};
      const now = new Date();
      now.setSeconds(0, 0); // Comparar a nivel de minuto

      // Validar que la fecha/hora de inicio no esté en el pasado
      if (minDateValue && minTimeValue) {
        const minDateTime = new Date(`${minDateValue}T${minTimeValue}`);
        minDateTime.setSeconds(0, 0);
        if (minDateTime < now) {
          errors['minDateTimeInPast'] = true;
        }
      } else if (minDateValue && !minTimeValue) {
        // Si solo hay fecha, validar que no sea anterior a hoy
        const minDateObj = new Date(minDateValue);
        minDateObj.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (minDateObj < today) {
          errors['minDateInPast'] = true;
        }
      }

      // Validar que minDate no sea después de maxDate
      if (minDateValue && maxDateValue && new Date(minDateValue) > new Date(maxDateValue)) {
        errors['minDateAfterMaxDate'] = true;
      }
      // Si las fechas son iguales, validar que la hora de inicio no sea después de la de fin
      if (minDateValue && maxDateValue && minTimeValue && maxTimeValue && minDateValue === maxDateValue) {
        if (minTimeValue > maxTimeValue) {
          errors['minTimeAfterMaxTime'] = true;
        }
      }
      return Object.keys(errors).length ? errors : null;
    };
  }

  private checkTimeSlotFilters(): void {
    const formValues = this.filterForm.value;
    this.includeTimeSlots = !!(
      formValues.minDateControl ||
      formValues.maxDateControl ||
      formValues.minTimeControl ||
      formValues.maxTimeControl
    );
    console.log("includeTimeSlots flag is now: ", this.includeTimeSlots);
  }

  private setupLocationAutocomplete(): void {
    this.locationSearchControl.valueChanges.pipe(
      debounceTime(500),
      filter(value => typeof value === 'string'),
      tap(value => {
        this.isTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => { this.isTyping = false; this.cdr.detectChanges(); }, 700);
        if (value !== this.lastSelectedLocationDisplay) {
          this.selectionMade = false;
          this.showAutocompleteResults = true;
        }
      }),
      filter(value => {
        if (value === null) return false;
        if (value !== this.lastSelectedLocationDisplay) this.selectionMade = false;
        this.isDeleting = this.previousInputValue !== null && value.length < this.previousInputValue.length;
        const shouldSearch = value.length >= 2 && !this.selectionMade && value !== this.lastSelectedLocationDisplay;
        this.previousInputValue = value;
        return shouldSearch;
      }),
      switchMap(value => {
        if (value === null) return of([]);
        const trimmedValue = value.trim().split(' ')[0];
        this.isLoadingLocations = true;
        this.showAutocompleteResults = true;
        return this.homeFacade.getLocations(of(trimmedValue)) as Observable<AppLocation[]>;
      }),
      takeUntil(this.destroy$)
    ).subscribe((locations: AppLocation[]) => {
      this.filteredLocations = locations;
      this.isLoadingLocations = false;
      this.cdr.detectChanges();
    });
  }

  onAutocompleteSelect(location: AppLocation): void {
    this.locationSearchControl.setValue(
      `${location.cityName} - ${location.departmentName}${location.neighborhood ? ' - ' + location.neighborhood : ''} `
    );
    this.lastSelectedLocationDisplay = this.locationSearchControl.value;
    this.selectedLocationId = location.id;
    this.selectionMade = true;
    this.showAutocompleteResults = false;
    this.filteredLocations = [];
    this.cdr.detectChanges();
    this.currentPage = 0;
    this.loadProperties();
  }

  onBlur(): void {
    setTimeout(() => { this.showAutocompleteResults = false; this.cdr.detectChanges(); }, 150);
  }

  onFocus(): void {
    if (this.locationSearchControl.value && this.locationSearchControl.value.length >= 2 && !this.selectionMade) {
      this.showAutocompleteResults = true;
    }
    this.cdr.detectChanges();
  }

  handleEnter(): void {
    if (this.showAutocompleteResults && this.filteredLocations.length > 0 && this.highlightedIndex < this.filteredLocations.length) {
      this.onAutocompleteSelect(this.filteredLocations[this.highlightedIndex]);
    } else if (!this.showAutocompleteResults && this.locationSearchControl.value && this.selectionMade) {
      this.currentPage = 0;
      this.loadProperties();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const max = this.filteredLocations.length - 1;
    if (this.showAutocompleteResults && this.filteredLocations.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, max);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = this.filteredLocations[this.highlightedIndex];
        if (selected) this.onAutocompleteSelect(selected);
      } else if (event.key === 'Escape') {
        this.showAutocompleteResults = false;
      }
      this.cdr.detectChanges();
    } else if (event.key === 'Enter' && !this.showAutocompleteResults) {
      this.applyFilters();
    }
  }

  loadProperties(): void {
    const formValues = this.filterForm.value;

    const filterStartTime = formValues.minDateControl && formValues.minTimeControl
      ? `${formValues.minDateControl}T${formValues.minTimeControl} `
      : (formValues.minDateControl ? `${formValues.minDateControl} T00:00` : null);

    const filterEndTime = formValues.maxDateControl && formValues.maxTimeControl
      ? `${formValues.maxDateControl}T${formValues.maxTimeControl} `
      : (formValues.maxDateControl ? `${formValues.maxDateControl} T23: 59` : null);

    const filters = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: formValues.sortByControl,
      sortDirection: this.currentSortDirection,
      locationId: this.selectedLocationId,
      categoryId: formValues.categorySelectControl,
      minRooms: formValues.minRoomsControl !== null ? Number(formValues.minRoomsControl) : null,
      maxRooms: formValues.maxRoomsControl !== null ? Number(formValues.maxRoomsControl) : null,
      minBathrooms: formValues.minBathroomsControl !== null ? Number(formValues.minBathroomsControl) : null,
      maxBathrooms: formValues.maxBathroomsControl !== null ? Number(formValues.maxBathroomsControl) : null,
      minPrice: formValues.minPriceControl !== null ? Number(formValues.minPriceControl) : null,
      maxPrice: formValues.maxPriceControl !== null ? Number(formValues.maxPriceControl) : null,
      startTime: (this.includeTimeSlots && filterStartTime) ? filterStartTime : null,
      endTime: (this.includeTimeSlots && filterEndTime) ? filterEndTime : null,
    };

    console.log('Solicitando propiedades con filtros:', filters, 'y includeTimeSlots:', this.includeTimeSlots);

    this.isLoadingProperties = true;
    this.homeFacade.getHomesWithAvailability(filters, this.includeTimeSlots)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: PaginatedHomeViewModel) => {
          this.properties = response.items.map((vmProp: HomeViewModel): Property => {
            let finalType: 'sale' | 'rent' | string;
            if (vmProp.type === 'sale' || vmProp.type === 'rent') {
              finalType = vmProp.type;
            } else if (typeof vmProp.type === 'string' && vmProp.type.trim() !== '') {
              finalType = vmProp.type;
            } else {
              finalType = 'unknown';
            }
            return {
              id: vmProp.id,
              name: vmProp.name,
              image: vmProp.image,
              type: finalType,
              description: vmProp.description ?? '',
              cityName: vmProp.cityName,
              departmentName: vmProp.departmentName,
              neighborhood: vmProp.neighborhood,
              category: vmProp.category,
              price: vmProp.price,
              numberOfRooms: vmProp.numberOfRooms,
              numberOfBathrooms: vmProp.numberOfBathrooms,
              activePublicationDate: vmProp.activePublicationDate,
              hasTimeSlots: vmProp.hasTimeSlots,
              timeSlots: vmProp.timeSlots || [],
            };
          });

          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.currentPage = response.pageNumber;
          this.pageSize = response.pageSize;
          this.updatePageNumbers();

          this.isLoadingProperties = false;
          this.cdr.detectChanges();
        },
        error => {
          console.error('Error al cargar propiedades:', error);
          this.properties = [];
          this.isLoadingProperties = false;
          this.totalPages = 0;
          this.totalElements = 0;
          this.pageNumbers = [];
          this.cdr.detectChanges();
        }
      );
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProperties();
    }
  }

  updatePageNumbers(): void {
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(0, this.currentPage - halfPagesToShow);
    let endPage = Math.min(this.totalPages - 1, this.currentPage + halfPagesToShow);

    if (this.totalPages <= maxPagesToShow) {
      startPage = 0;
      endPage = this.totalPages - 1;
    } else {
      if (this.currentPage <= halfPagesToShow) {
        startPage = 0;
        endPage = maxPagesToShow - 1;
      } else if (this.currentPage + halfPagesToShow >= this.totalPages) {
        startPage = this.totalPages - maxPagesToShow;
        endPage = this.totalPages - 1;
      } else {
        startPage = this.currentPage - halfPagesToShow;
        endPage = this.currentPage + halfPagesToShow;
      }
    }

    this.pageNumbers = [];
    if (this.totalPages > 0) { // Solo generar números si hay páginas
      for (let i = startPage; i <= endPage; i++) {
        this.pageNumbers.push(i);
      }
    }
  }

  navigateToPropertyDetails(propertyId: number | string): void {
    if (propertyId) {
      this.router.navigate(['/property', propertyId]);
    } else {
      console.error('ID de propiedad no válido para la navegación:', propertyId);
    }
  }

  toggleSortDirection(): void {
    this.currentSortDirection = this.currentSortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.currentPage = 0;
    this.loadProperties();
  }

  loadCategories(): void {
    this.homeFacade.getCategories()
      .pipe(
        takeUntil(this.destroy$),
        map((response: PaginationResponse<Category>) => response.items)
      )
      .subscribe(
        (categories: Category[]) => {
          this.categories = categories;
          this.cdr.detectChanges();
        },
        error => {
          console.error('[Category Autocomplete] Error loading categories:', error);
          this.categories = [];
        }
      );
  }

  clearAllFilters(): void {
    this.filterForm.reset({
      categorySelectControl: null,
      minRoomsControl: null,
      maxRoomsControl: null,
      minBathroomsControl: null,
      maxBathroomsControl: null,
      minPriceControl: null,
      maxPriceControl: null,
      minDateControl: null,
      maxDateControl: null,
      minTimeControl: null,
      maxTimeControl: null,
      sortByControl: this.defaultSortBy
    }, { emitEvent: false });

    this.currentSortDirection = 'ASC';
    this.locationSearchControl.setValue('', { emitEvent: false });
    this.selectedLocationId = null;
    this.lastSelectedLocationDisplay = null;
    this.previousInputValue = '';
    this.filteredLocations = [];
    this.showAutocompleteResults = false;
    this.currentView = 'grid';
    this.selectionMade = false;
    this.showFilterSidebar = false;

    this.currentPage = 0;
    this.checkTimeSlotFilters();
    this.loadProperties();
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    this.filterForm.markAllAsTouched();
    this.locationSearchControl.markAsTouched();

    const locationControlValid = !this.locationSearchControl.value || (this.locationSearchControl.valid && this.selectionMade) || !this.locationSearchControl.touched;

    if (this.filterForm.invalid || !locationControlValid) {
      console.log('Formulario de filtros inválido.');
      // ... (log de errores)
      return;
    }
    this.currentPage = 0;
    this.checkTimeSlotFilters();
    this.loadProperties();

    if (this.currentView === 'grid' && this.showFilterSidebar) {
      this.toggleFilterSidebar();
    }
  }

  toggleFilterSidebar(): void {
    this.showFilterSidebar = !this.showFilterSidebar;
  }

  setView(view: 'grid' | 'list'): void {
    this.currentView = view;
    if (view === 'grid' && this.showFilterSidebar) {
      this.showFilterSidebar = false;
    }
    this.cdr.detectChanges();
  }

  preventInvalidNumberInput(event: KeyboardEvent) {
    if (["e", "E", "+", "-", "."].includes(event.key)) {
      event.preventDefault();
    }
  }
}
