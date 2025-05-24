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

  ngOnInit(): void {
    this.setupLocationAutocomplete();
    this.loadProperties();
  }
  private destroy$ = new Subject<void>();

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


  loadProperties(): void {
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
      currentDate: null
    };

    console.log('Cargando propiedades con filtros:', filters);

    this.isLoadingProperties = true;
    this.homeFacade.getHomesWithAvailability(filters, false)
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
    this.loadProperties();
    this.cdr.detectChanges();
    this.selectionMade = false;
  }
}



// // src/app/pages/home-page/home-page.component.ts

// import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, HostListener, Renderer2, ChangeDetectionStrategy } from '@angular/core';
// import { FormControl } from '@angular/forms';
// import { debounceTime, distinctUntilChanged, filter, map, Observable, Subject, switchMap, takeUntil, of, tap, catchError, finalize, combineLatest, startWith, forkJoin } from 'rxjs';
// import { LocationService } from '@app/core/services/location/location.service';
// import { Location } from '@app/core/models/location.model';
// import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
// import { CategoryService } from '@app/core/services/category/category.service';
// import { Category } from '@app/core/models/category.model';
// import { HomeService } from '@app/core/services/home/home.service';
// import { Home, PagedHomeRequest, HomeViewModel } from '@app/core/models/home.model';
// import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';

// @Component({
//   selector: 'app-home-page',
//   templateUrl: './home-page.component.html',
//   styleUrls: ['./home-page.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush // Añadido para optimización
// })
// export class HomePageComponent implements OnInit, OnDestroy {
//   showLoginModal: boolean = false;

//   private locationService = inject(LocationService);
//   private cdr = inject(ChangeDetectorRef);
//   private elementRef = inject(ElementRef);
//   private categoryService = inject(CategoryService);
//   private homeService = inject(HomeService);
//   private timeSlotService = inject(TimeSlotService);
//   private renderer: Renderer2 = inject(Renderer2); // Inyectar Renderer2

//   // Existing FormControls
//   locationSearchControl = new FormControl<string | null>('');
//   categorySelectControl = new FormControl<number | null>(null);
//   minRoomsControl = new FormControl<number | null>(null);
//   maxRoomsControl = new FormControl<number | null>(null);
//   minBathroomsControl = new FormControl<number | null>(null);
//   maxBathroomsControl = new FormControl<number | null>(null);
//   minPriceControl = new FormControl<number | null>(null);
//   maxPriceControl = new FormControl<number | null>(null);

//   // New FormControls for Date/Time filters (just declared, no filtering logic yet)
//   minDateControl = new FormControl<string | null>(null); // 'YYYY-MM-DD'
//   maxDateControl = new FormControl<string | null>(null); // 'YYYY-MM-DD'
//   minTimeControl = new FormControl<string | null>(null); // 'HH:mm'
//   maxTimeControl = new FormControl<string | null>(null); // 'HH:mm'

//   // Data for autocomplete and properties
//   filteredLocations: Location[] = [];
//   showAutocompleteResults = false;
//   selectionMade = false;
//   isLoadingLocations = false;
//   categories: Category[] = [];
//   properties: HomeViewModel[] = [];
//   isLoadingProperties = false;
//   private selectedLocationId: number | null = null;

//   private destroy$ = new Subject<void>();
//   private selectedLocationIdChanges$ = new Subject<number | null>();

//   // New properties for view mode and sidebar
//   currentViewMode: 'grid' | 'list' = 'grid'; // Default view
//   showFilterSidebar: boolean = false; // Controls sidebar visibility in grid mode

//   private propertyImages: string[] = [
//     '../../../../assets/images/casa_afueras.png',
//     '../../../../assets/images/apartamento_centro.png',
//     '../../../../assets/images/apartamento_moderno.png',
//     '../../../../assets/images/placeholder-house.png',
//   ];

//   constructor() { }

//   ngOnInit(): void {
//     console.log('HomePageComponent initialized. Setting up filters and loading initial data.');
//     this.loadCategories();
//     this.setupLocationAutocomplete();
//     this.setupFilterChangesSubscription(); // This will still update values but not trigger search
//     this.loadProperties(); // Initial load
//   }

//   setView(viewName: string) {
//     if (viewName === 'grid') {
//       this.renderer.removeClass(document.body, 'view-list');
//       this.renderer.addClass(document.body, 'view-grid');
//       this.showFilterSidebar = false;
//     } else if (viewName === 'list') {
//       this.renderer.removeClass(document.body, 'view-grid');
//       this.renderer.addClass(document.body, 'view-list');
//       this.showFilterSidebar = false;
//     }
//     this.currentViewMode = viewName as 'grid' | 'list';
//     this.cdr.detectChanges();
//   }

//   ngAfterViewInit() {
//     this.setView(this.currentViewMode);
//   }

//   toggleFilterSidebar(): void {
//     if (this.currentViewMode === 'grid') {
//       this.showFilterSidebar = !this.showFilterSidebar;
//       this.cdr.detectChanges();
//     }
//   }

//   private setupLocationAutocomplete(): void {
//     this.locationSearchControl.valueChanges.pipe(
//       debounceTime(300),
//       distinctUntilChanged(),
//       takeUntil(this.destroy$),
//       filter((text): text is string | null => typeof text === 'string' || text === null),
//       tap(text => {
//         if (this.selectionMade && this.locationSearchControl.value !== text) {
//           console.log('[Location Autocomplete] Input changed after selection or cleared. Resetting selection.');
//           this.selectionMade = false;
//           this.selectedLocationId = null;
//           this.selectedLocationIdChanges$.next(null);
//         }

//         if (text === null || text.length === 0) {
//           this.showAutocompleteResults = false;
//           this.filteredLocations = [];
//           this.isLoadingLocations = false;
//           this.selectionMade = false; // Important: reset selection if input is cleared
//           this.selectedLocationId = null;
//           this.selectedLocationIdChanges$.next(null);
//           this.cdr.detectChanges();
//           return;
//         }

//         if (!this.selectionMade && text.length >= 2) {
//           this.isLoadingLocations = true;
//           this.showAutocompleteResults = true;
//           this.filteredLocations = [];
//         } else if (this.selectionMade && text.length > 0) {
//           this.isLoadingLocations = false;
//           this.showAutocompleteResults = false;
//           this.filteredLocations = [];
//           this.cdr.detectChanges();
//           return;
//         } else {
//           this.isLoadingLocations = false;
//           this.showAutocompleteResults = false;
//           this.filteredLocations = [];
//         }
//         this.cdr.detectChanges();
//       }),
//       filter((text): text is string => !this.selectionMade && text !== null && text.length >= 2),
//       switchMap(text =>
//         this.locationService.getLocations({ page: 0, size: 10, text: text }).pipe(
//           map((response: PaginationResponse<Location>) => response.items),
//           tap(locations => {
//             this.filteredLocations = locations;
//             this.showAutocompleteResults = true;
//             this.cdr.detectChanges();
//           }),
//           catchError((error) => {
//             console.error('[Location Autocomplete] Error searching locations:', error);
//             this.filteredLocations = [];
//             this.showAutocompleteResults = false; // Hide if error
//             this.cdr.detectChanges();
//             return of([]);
//           }),
//           finalize(() => {
//             this.isLoadingLocations = false;
//             this.cdr.detectChanges();
//           })
//         )
//       )
//     ).subscribe();
//   }

//   private setupFilterChangesSubscription(): void {
//     // This subscription will only update the internal model values,
//     // the actual search will be triggered by explicit button clicks or specific events.
//     combineLatest([
//       this.selectedLocationIdChanges$.pipe(startWith(this.selectedLocationId)), // Ensure it emits initial value
//       this.categorySelectControl.valueChanges.pipe(startWith(this.categorySelectControl.value)),
//       this.minRoomsControl.valueChanges.pipe(startWith(this.minRoomsControl.value)),
//       this.maxRoomsControl.valueChanges.pipe(startWith(this.maxRoomsControl.value)),
//       this.minBathroomsControl.valueChanges.pipe(startWith(this.minBathroomsControl.value)),
//       this.maxBathroomsControl.valueChanges.pipe(startWith(this.maxBathroomsControl.value)),
//       this.minPriceControl.valueChanges.pipe(startWith(this.minPriceControl.value)),
//       this.maxPriceControl.valueChanges.pipe(startWith(this.maxPriceControl.value)),
//       this.minDateControl.valueChanges.pipe(startWith(this.minDateControl.value)), // Incluido
//       this.maxDateControl.valueChanges.pipe(startWith(this.maxDateControl.value)), // Incluido
//       this.minTimeControl.valueChanges.pipe(startWith(this.minTimeControl.value)), // Incluido
//       this.maxTimeControl.valueChanges.pipe(startWith(this.maxTimeControl.value)) // Incluido
//     ]).pipe(
//       debounceTime(100), // Small debounce to group rapid input changes
//       takeUntil(this.destroy$),
//       tap(([locationId, category, minRooms, maxRooms, minBathrooms, maxBathrooms, minPrice, maxPrice, minDate, maxDate, minTime, maxTime]) => {
//         console.log('Filter values (for potential future search):', { locationId, category, minRooms, maxRooms, minBathrooms, maxBathrooms, minPrice, maxPrice, minDate, maxDate, minTime, maxTime });
//       })
//     ).subscribe();
//   }

//   loadProperties(): void {
//     console.log('[loadProperties] Initiating property load...');
//     this.isLoadingProperties = true;
//     this.properties = [];
//     this.cdr.detectChanges();

//     const categoryId = this.categorySelectControl.value;
//     const locationId = this.selectedLocationId; // Use the selected ID

//     const filterParams: PagedHomeRequest = {
//       page: 0,
//       size: 20,
//       sortBy: 'price',
//       sortDirection: 'ASC',
//       minRooms: this.minRoomsControl.value,
//       maxRooms: this.maxRoomsControl.value,
//       minBathrooms: this.minBathroomsControl.value,
//       maxBathrooms: this.maxBathroomsControl.value,
//       minPrice: this.minPriceControl.value,
//       maxPrice: this.maxPriceControl.value,
//       userId: null,
//       homeId: null,
//       categoryId: categoryId || null,
//       locationId: locationId || null,
//       currentDate: null, // Assuming this is used for filtering availability
//       // minDate, maxDate, minTime, maxTime are NOT sent to backend in this version.
//       // They will be used for frontend filtering of time-slots later.
//     };

//     console.log('[HomeService] Requesting properties with params:', filterParams);

//     this.homeService.getProperties(filterParams)
//       .pipe(
//         takeUntil(this.destroy$),
//         map(response => response.items),
//         switchMap(homes => {
//           if (homes.length === 0) {
//             console.log('[HomeService] No homes found for current property filters.');
//             return of([]);
//           }
//           // The propertyImages array is used here to assign an image to each home.
//           // This is a common pattern for placeholder images.
//           const homesWithImages: HomeViewModel[] = homes.map((home, index) => ({
//             ...home,
//             image: this.propertyImages[index % this.propertyImages.length], // Assigning image from local array
//             timeSlots: [],
//             hasTimeSlots: false
//           }));

//           const homeObservables: Observable<HomeViewModel>[] = homesWithImages.map(home => {
//             // For now, simply fetch time slots without applying date/time filters.
//             // Filtering based on minDate/maxDate/minTime/maxTime will be implemented here later.
//             return this.timeSlotService.getTimeSlots({ homeId: home.id, page: 0, size: 100 })
//               .pipe(
//                 map(timeSlotResponse => {
//                   return {
//                     ...home,
//                     timeSlots: timeSlotResponse.items,
//                     hasTimeSlots: timeSlotResponse.items && timeSlotResponse.items.length > 0
//                   };
//                 }),
//                 catchError(error => {
//                   console.warn(`Error loading time slots for home ID ${home.id}:`, error);
//                   return of({ ...home, timeSlots: [], hasTimeSlots: false }); // Return home without time slots on error
//                 })
//               );
//           });
//           return forkJoin(homeObservables);
//         }),
//         tap(enrichedHomes => {
//           console.log('[HomeService] Enriched properties loaded (with images and all time slots):', enrichedHomes);
//           this.properties = enrichedHomes;
//         }),
//         catchError(error => {
//           console.error('[HomeService] Error loading properties or enriching with time slots:', error);
//           this.properties = [];
//           return of([]);
//         }),
//         finalize(() => {
//           this.isLoadingProperties = false;
//           this.cdr.detectChanges();
//           console.log('[loadProperties] Property load finished.');
//         })
//       )
//       .subscribe();
//   }

//   loadCategories(): void {
//     // Assuming getCategories takes two number arguments: page and size
//     this.categoryService.getCategories(0, 100)
//       .pipe(
//         takeUntil(this.destroy$),
//         map(response => response.items),
//         tap(categories => {
//           this.categories = categories;
//           this.categorySelectControl.setValue(null, { emitEvent: false });
//           this.cdr.detectChanges();
//         }),
//         catchError(error => {
//           console.error('[Category Autocomplete] Error loading categories:', error);
//           this.categories = [];
//           this.categorySelectControl.setValue(null, { emitEvent: false });
//           return of([]);
//         })
//       )
//       .subscribe();
//   }

//   // --- Functions for Location Autocomplete ---
//   onAutocompleteSelect(location: Location): void {
//     console.log('[Location Autocomplete] Location selected from list:', location);
//     this.locationSearchControl.setValue(`${location.cityName} - ${location.departmentName}${location.neighborhood ? ' - ' + location.neighborhood : ''}`, { emitEvent: false });
//     this.selectionMade = true;
//     this.selectedLocationId = location.id;
//     this.showAutocompleteResults = false;
//     this.isLoadingLocations = false;
//     this.filteredLocations = [];
//     this.cdr.detectChanges();
//     console.log(`[Location Autocomplete] Selected location ID (for future use): ${location.id}`);
//     this.selectedLocationIdChanges$.next(this.selectedLocationId);
//     this.loadProperties(); // Trigger search when a location is selected
//   }

//   onBlur(): void {
//     console.log('[Location Autocomplete] Input blur event.');
//     setTimeout(() => {
//       this.showAutocompleteResults = false;
//       this.isLoadingLocations = false;
//       this.cdr.detectChanges();

//       if (this.locationSearchControl.value === null || this.locationSearchControl.value.length === 0) {
//         if (this.selectedLocationId !== null) {
//           console.log('[Location Autocomplete] Input cleared on blur. Resetting selectedLocationId.');
//           this.selectedLocationId = null;
//           this.selectionMade = false;
//           this.selectedLocationIdChanges$.next(null);
//         }
//       } else if (!this.selectionMade && this.locationSearchControl.value !== null && this.locationSearchControl.value.length > 0) {
//         if (this.selectedLocationId !== null) {
//           console.log('[Location Autocomplete] Input blurred without explicit selection. Resetting selectedLocationId.');
//           this.selectedLocationId = null;
//           this.selectedLocationIdChanges$.next(null);
//         }
//         this.showAutocompleteResults = false;
//         this.cdr.detectChanges();
//       }
//     }, 150);
//   }

//   onFocus(): void {
//     console.log('[Location Autocomplete] Input focus event.');
//     const currentText = this.locationSearchControl.value;
//     if (currentText && currentText.length >= 2 && !this.selectionMade) {
//       console.log('[Location Autocomplete] Input focused with text and no selection. Forcing search.');
//       this.locationSearchControl.updateValueAndValidity({ emitEvent: true });
//       this.showAutocompleteResults = true;
//     } else if (currentText && this.selectionMade) {
//       console.log('[Location Autocomplete] Input focused with selection made. Waiting for user input to reset selection.');
//       this.showAutocompleteResults = false;
//     } else {
//       this.showAutocompleteResults = false;
//       this.filteredLocations = [];
//       this.isLoadingLocations = false;
//     }
//     this.cdr.detectChanges();
//   }

//   private getCurrentDateISO(): string {
//     const now = new Date();
//     // Ajuste para la zona horaria de Colombia (UTC-5)
//     const colombiaOffset = -5 * 60; // Offset en minutos
//     const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC en milisegundos
//     const colombiaDate = new Date(utc + (colombiaOffset * 60000)); // Fecha/hora en Colombia

//     return colombiaDate.toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
//   }

//   handleEnter(): void {
//     console.log('[Location Autocomplete] Enter key pressed.');
//     if (this.showAutocompleteResults && this.filteredLocations.length > 0) {
//       const firstLocation = this.filteredLocations[0];
//       this.onAutocompleteSelect(firstLocation);
//     } else {
//       console.log('[Home] Enter pressed, triggering loadProperties.');
//       this.loadProperties();
//     }
//   }

//   clearAllFilters(): void {
//     console.log('Clearing all filters...');
//     this.categorySelectControl.setValue(null, { emitEvent: false });
//     this.locationSearchControl.setValue(null, { emitEvent: false });
//     this.selectedLocationId = null;
//     this.selectionMade = false;
//     this.selectedLocationIdChanges$.next(null);
//     this.minRoomsControl.setValue(null, { emitEvent: false });
//     this.maxRoomsControl.setValue(null, { emitEvent: false });
//     this.minBathroomsControl.setValue(null, { emitEvent: false });
//     this.maxBathroomsControl.setValue(null, { emitEvent: false });
//     this.minPriceControl.setValue(null, { emitEvent: false });
//     this.maxPriceControl.setValue(null, { emitEvent: false });
//     this.minDateControl.setValue(null, { emitEvent: false }); // Limpiar
//     this.maxDateControl.setValue(null, { emitEvent: false }); // Limpiar
//     this.minTimeControl.setValue(null, { emitEvent: false }); // Limpiar
//     this.maxTimeControl.setValue(null, { emitEvent: false }); // Limpiar

//     this.loadProperties(); // Reload properties after clearing
//     this.cdr.detectChanges();
//   }

//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent): void {
//     const targetElement = event.target as HTMLElement;
//     const isInsideLocationAutocomplete = this.elementRef.nativeElement.querySelector('.location-autocomplete-container')?.contains(targetElement);
//     // You mentioned `.category-select-container` and `.filter-group`.
//     // It's better to check if the click is inside any "filter control area" not just specific elements.
//     // However, for simplicity and based on your current setup, we'll keep it focused on areas that trigger specific behaviors.
//     const isInsideFilterSidebar = this.elementRef.nativeElement.querySelector('.filter-sidebar')?.contains(targetElement);
//     const isFilterToggleButton = targetElement.classList.contains('filter-toggle-label') || targetElement.closest('.filter-toggle-label') !== null;

//     // If sidebar is open, and click is outside sidebar AND not on the toggle button itself
//     if (this.showFilterSidebar && !isInsideFilterSidebar && !isFilterToggleButton) {
//       console.log('[Filter Sidebar] Clicked outside filter sidebar, hiding results.');
//       this.showFilterSidebar = false;
//       this.cdr.detectChanges();
//     }
//     // Also, handle location autocomplete closing when clicking outside its container
//     if (this.showAutocompleteResults && !isInsideLocationAutocomplete) {
//       this.showAutocompleteResults = false;
//       this.isLoadingLocations = false;
//       this.cdr.detectChanges();
//     }
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.selectedLocationIdChanges$.complete();
//     // Clean up body classes
//     this.renderer.removeClass(document.body, 'view-grid');
//     this.renderer.removeClass(document.body, 'view-list');
//     console.log('HomePageComponent destroyed.');
//   }
// }

