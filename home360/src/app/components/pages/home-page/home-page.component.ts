import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';
import { Location as AppLocation } from '@app/core/models/location.model';
import { of, Subject } from 'rxjs';
import { debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {
  showLoginModal: boolean = false;
  locationSearchControl = new FormControl('');
  selectedLocationId: number | null = null;
  categorySelectControl = new FormControl(null);
  minRoomsControl = new FormControl(null);
  maxRoomsControl = new FormControl(null);
  minBathroomsControl = new FormControl(null);
  maxBathroomsControl = new FormControl(null);
  minPriceControl = new FormControl(null);
  maxPriceControl = new FormControl(null);
  minDateControl = new FormControl(null); // 'YYYY-MM-DD'
  maxDateControl = new FormControl(null); // 'YYYY-MM-DD'
  minTimeControl = new FormControl(null); // 'HH:mm'
  maxTimeControl = new FormControl(null); // 'HH:mm'

  filteredLocations: AppLocation[] = [];
  isLoadingLocations: boolean = false;
  showAutocompleteResults: boolean = false;
  selectionMade: boolean = false;
  includeTimeSlots: boolean = true;

  private homeFacade = inject(HomeFacadeService);
  private cdr = inject(ChangeDetectorRef);
  public properties: any[] = [];
  public isLoadingProperties: boolean = false;
  public categories: any[] = [];
  public previousInputValue: string | null = '';
  public lastSelectedLocationDisplay: string | null = null;
  public isTyping = false;
  public isDeleting = false;
  private typingTimeout: any;

  highlightedIndex = 0;

  showFilterSidebar: boolean = false;
  currentView: 'grid' | 'list' = 'grid';
  propertyTypeControl = new FormControl(null);
  // locationFilterControl = new FormControl('');

  //cambiar spanglich:
  ngOnInit(): void {
    this.setupLocationAutocomplete();
    // Es crucial que 'includeTimeSlots' se determine ANTES de llamar a loadProperties
    this.checkTimeSlotFilters(); // Nuevo método para chequear los filtros de tiempo
    this.loadProperties();
    this.loadCategories();

    // Suscribirse a los cambios de los controles de fecha/hora para recalcular 'includeTimeSlots'
    this.minDateControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkTimeSlotFiltersAndLoadProperties());
    this.maxDateControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkTimeSlotFiltersAndLoadProperties());
    this.minTimeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkTimeSlotFiltersAndLoadProperties());
    this.maxTimeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkTimeSlotFiltersAndLoadProperties());
  }
  private destroy$ = new Subject<void>();

  private checkTimeSlotFilters(): void {
    // includeTimeSlots será true si minDateControl O maxDateControl O minTimeControl O maxTimeControl tienen valor
    this.includeTimeSlots = !!(
      this.minDateControl.value ||
      this.maxDateControl.value ||
      this.minTimeControl.value ||
      this.maxTimeControl.value
    );
  }

  // Si los filtros de tiempo cambian, reevalúa y recarga propiedades
  private checkTimeSlotFiltersAndLoadProperties(): void {
    this.checkTimeSlotFilters();
    this.loadProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private setupLocationAutocomplete(): void {
    this.locationSearchControl.valueChanges.pipe(
      debounceTime(500),
      filter(value => typeof value === 'string'),
      tap(value => {
        this.isTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.isTyping = false;
          this.cdr.detectChanges();
        }, 700);

        if (value !== this.lastSelectedLocationDisplay) {
          this.selectionMade = false;
          this.showAutocompleteResults = true;
        }
      }),
      filter(value => {
        if (value === null) {
          return false;
        }

        if (value !== this.lastSelectedLocationDisplay) {
          this.selectionMade = false;
        }

        this.isDeleting = this.previousInputValue !== null && value.length < this.previousInputValue.length;
        const shouldSearch =
          value.length >= 2 &&
          !this.selectionMade &&
          value !== this.lastSelectedLocationDisplay;

        this.previousInputValue = value;
        return shouldSearch;
      }),
      switchMap(value => {
        if (value === null) {
          return of([]);
        }
        const trimmedValue = value.trim().split(' ')[0];
        console.log('Buscando ubicaciones para:', trimmedValue);
        this.isLoadingLocations = true;
        this.showAutocompleteResults = true;
        return this.homeFacade.getLocations(of(trimmedValue));
      })
    ).subscribe(locations => {
      this.filteredLocations = locations;
      this.isLoadingLocations = false;
      this.cdr.detectChanges();
    });
  }

  onAutocompleteSelect(location: AppLocation): void {
    this.locationSearchControl.setValue(
      `${location.cityName} - ${location.departmentName}${location.neighborhood ? ' - ' + location.neighborhood : ''}`
    );
    this.lastSelectedLocationDisplay = this.locationSearchControl.value;
    this.selectedLocationId = location.id;
    this.selectionMade = true;
    this.showAutocompleteResults = false;
    this.filteredLocations = [];
    this.cdr.detectChanges();
    this.loadProperties();
  }

  onBlur(): void {
    setTimeout(() => {
      this.showAutocompleteResults = false;
      this.cdr.detectChanges();
    }, 150);
  }

  onFocus(): void {
    if (this.locationSearchControl.value && this.locationSearchControl.value.length >= 2 && !this.selectionMade) {
      this.showAutocompleteResults = true;
    }
    this.cdr.detectChanges();
  }
  handleEnter(): void {
    console.log('[Location Autocomplete] Enter key pressed.');
    if (this.showAutocompleteResults && this.filteredLocations.length > 0) {
      const firstLocation = this.filteredLocations[0];
      this.onAutocompleteSelect(firstLocation);
    } else {
      console.log('[Home] Enter pressed, triggering loadProperties.');
      this.loadProperties();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const max = this.filteredLocations.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex = Math.min(this.highlightedIndex + 1, max);
      this.cdr.detectChanges();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
      this.cdr.detectChanges();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = this.filteredLocations[this.highlightedIndex];
      if (selected) {
        this.onAutocompleteSelect(selected);
      }
    }
  }


  // loadProperties(): void {
  //   const today = new Date();
  //   const threeWeeksFromNow = new Date();
  //   threeWeeksFromNow.setDate(today.getDate() + 21);

  //   const filters = {
  //     page: 0,
  //     size: 20,
  //     sortBy: 'price',
  //     sortDirection: 'ASC',
  //     locationId: this.selectedLocationId,
  //     categoryId: this.categorySelectControl.value,
  //     minRooms: this.minRoomsControl.value !== null ? Number(this.minRoomsControl.value) : null,
  //     maxRooms: this.maxRoomsControl.value !== null ? Number(this.maxRoomsControl.value) : null,
  //     minBathrooms: this.minBathroomsControl.value !== null ? Number(this.minBathroomsControl.value) : null,
  //     maxBathrooms: this.maxBathroomsControl.value !== null ? Number(this.maxBathroomsControl.value) : null,
  //     minPrice: this.minPriceControl.value !== null ? Number(this.minPriceControl.value) : null,
  //     maxPrice: this.maxPriceControl.value !== null ? Number(this.maxPriceControl.value) : null,
  //     startTime: this.minTimeControl.value ? `${this.minDateControl.value}T${this.minTimeControl.value}` : today,
  //     endTime: this.maxTimeControl.value ? `${this.maxDateControl.value}T${this.maxTimeControl.value}` : threeWeeksFromNow,
  //     currentDate: null
  //   };
  //   this.includeTimeSlots = !!(filters.startTime && filters.endTime);
  //   console.log('Cargando propiedades con filtros:', filters);
  //   console.log('Include time slots:', this.includeTimeSlots);

  //   this.isLoadingProperties = true;
  //   this.homeFacade.getHomesWithAvailability(filters, this.includeTimeSlots)
  //     .subscribe(
  //       properties => {
  //         this.properties = properties;
  //         this.isLoadingProperties = false;
  //         this.cdr.detectChanges();
  //       },
  //       error => {
  //         console.error('Error al cargar propiedades:', error);
  //         this.isLoadingProperties = false;
  //       }
  //     );

  //   this.selectionMade = false;
  // }

  loadProperties(): void {
    const today = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(today.getDate() + 21);

    const filterStartTime = this.minDateControl.value && this.minTimeControl.value
      ? `${this.minDateControl.value}T${this.minTimeControl.value}`
      : (this.minDateControl.value ? `${this.minDateControl.value}T00:00` : null);

    const filterEndTime = this.maxDateControl.value && this.maxTimeControl.value
      ? `${this.maxDateControl.value}T${this.maxTimeControl.value}`
      : (this.maxDateControl.value ? `${this.maxDateControl.value}T23:59` : null);

    const filters = {
      page: 0,
      size: 20,
      sortBy: 'price',
      sortDirection: 'ASC',
      locationId: this.selectedLocationId,
      categoryId: this.categorySelectControl.value,
      minRooms: this.minRoomsControl.value !== null ? Number(this.minRoomsControl.value) : null,
      maxRooms: this.maxRoomsControl.value !== null ? Number(this.maxRoomsControl.value) : null,
      minBathrooms: this.minBathroomsControl.value !== null ? Number(this.minBathroomsControl.value) : null,
      maxBathrooms: this.maxBathroomsControl.value !== null ? Number(this.maxBathroomsControl.value) : null,
      minPrice: this.minPriceControl.value !== null ? Number(this.minPriceControl.value) : null,
      maxPrice: this.maxPriceControl.value !== null ? Number(this.maxPriceControl.value) : null,
      startTime: this.includeTimeSlots ? (filterStartTime || today.toISOString()) : null,
      endTime: this.includeTimeSlots ? (filterEndTime || threeWeeksFromNow.toISOString()) : null,
      currentDate: null
    };

    console.log('Cargando propiedades con filtros:', filters);
    console.log('Include time slots:', this.includeTimeSlots);

    this.isLoadingProperties = true;
    this.homeFacade.getHomesWithAvailability(filters, this.includeTimeSlots)
      .subscribe(
        properties => {
          this.properties = properties;
          this.isLoadingProperties = false;
          this.cdr.detectChanges();
        },
        error => {
          console.error('Error al cargar propiedades:', error);
          this.isLoadingProperties = false;
        }
      );

    this.selectionMade = false;
  }
  loadCategories(): void {
    this.homeFacade.getCategories()
      .pipe(
        takeUntil(this.destroy$),
        map(response => response.items)
      )
      .subscribe(
        categories => {
          this.categories = categories;
          console.log(categories);
          this.categorySelectControl.setValue(null, { emitEvent: false });
          this.cdr.detectChanges();
        },
        error => {
          console.error('[Category Autocomplete] Error loading categories:', error);
          this.categories = [];
          this.categorySelectControl.setValue(null, { emitEvent: false });
        }
      );
  }

  clearAllFilters(): void {
    console.log('Limpiando todos los filtros...');
    this.categorySelectControl.setValue(null, { emitEvent: false });
    this.locationSearchControl.setValue(null, { emitEvent: false });
    this.selectedLocationId = null;
    this.minRoomsControl.setValue(null, { emitEvent: false });
    this.maxRoomsControl.setValue(null, { emitEvent: false });
    this.minBathroomsControl.setValue(null, { emitEvent: false });
    this.maxBathroomsControl.setValue(null, { emitEvent: false });
    this.minPriceControl.setValue(null, { emitEvent: false });
    this.maxPriceControl.setValue(null, { emitEvent: false });
    this.minDateControl.setValue(null, { emitEvent: false });
    this.maxDateControl.setValue(null, { emitEvent: false });
    this.minTimeControl.setValue(null, { emitEvent: false });
    this.maxTimeControl.setValue(null, { emitEvent: false });
    this.currentView = 'grid';
    this.selectionMade = false;
    this.showFilterSidebar = false;
    this.ngOnInit();
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    const filters = {
      propertyType: this.categorySelectControl.value,
      location: this.locationSearchControl.value,
      minRooms: this.minRoomsControl.value,
      maxRooms: this.maxRoomsControl.value,
      minBathrooms: this.minBathroomsControl.value,
      maxBathrooms: this.maxBathroomsControl.value,
      minPrice: this.minPriceControl.value,
      maxPrice: this.maxPriceControl.value,
      minDateControl: this.minDateControl.value,
      maxDateControl: this.maxDateControl.value,
      minTimeControl: this.minTimeControl.value,
      maxTimeControl: this.maxTimeControl.value,
    };
    console.log('Filtros aplicados:', filters);

    this.checkTimeSlotFilters();
    this.loadProperties();
    this.toggleFilterSidebar();
  }
  toggleFilterSidebar(): void {
    this.showFilterSidebar = !this.showFilterSidebar;
    if (!this.showFilterSidebar && this.currentView === 'grid') {
    }
  }

  setView(view: 'grid' | 'list'): void {
    this.currentView = view;
    document.body.classList.remove('view-grid', 'view-list');
    document.body.classList.add(`view-${view}`);

    if (view === 'list') {
      this.showFilterSidebar = true;
    } else {
      this.showFilterSidebar = false;
    }
  }

}
