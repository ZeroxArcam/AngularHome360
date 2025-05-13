import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { takeUntil, Subject, Observable, EMPTY, of } from 'rxjs';
import { Location } from '@app/core/models/location.model';
import { LocationService } from '@app/core/services/location/location.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map, expand, reduce, catchError, filter, tap, take } from 'rxjs/operators';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';

type DisplayType = 'dropdown' | 'autocomplete';

@Component({
  selector: 'app-location-selector',
  templateUrl: './location-selector.component.html',
  styleUrls: ['./location-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationSelectorComponent implements OnInit, OnDestroy {
  private locationService = inject(LocationService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef); // Inyectamos ElementRef

  @Input() displayType: DisplayType = 'dropdown';
  @Output() locationSelected = new EventEmitter<number | null>();

  locations$: Observable<Location[]> | undefined;
  allLocations: Location[] = [];
  searchControl = new FormControl('');
  showAutocompleteResults = false;
  selectionMade = false;

  @ViewChild('searchInput') searchInput: ElementRef | undefined;

  ngOnInit(): void {
    if (this.displayType === 'autocomplete') {
      this.locations$ = this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(text =>
          this.locationService.getLocations({ page: 0, size: 10, text: text || '' }).pipe(
            map((response: PaginationResponse<Location>) => response.items),
            tap(() => {
              this.showAutocompleteResults = true;
              this.cdr.detectChanges();
            }),
            catchError(() => of([]))
          )
        ),
        tap(() => {
          if (!this.searchControl.value) { // Esto cubre ''
            setTimeout(() => {
              this.showAutocompleteResults = false;
              this.cdr.detectChanges();
              console.log('Lista debería ocultarse por borrado de input (cadena vacía) - Timeout');
            }, 0);
          } else if (this.searchControl.value === null || this.searchControl.value === undefined) {
            setTimeout(() => {
              this.showAutocompleteResults = false;
              this.cdr.detectChanges();
              console.log('Lista debería ocultarse por borrado de input (null o undefined) - Timeout');
            }, 0);
          }
        })
      );
    } else {
      this.loadAllLocations();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllLocations(): void {
    this.locationService.getLocations({ page: 0, size: 10 })
      .pipe(
        takeUntil(this.destroy$),
        expand(response => {
          if (response.pageNumber < response.totalPages - 1) {
            return this.locationService.getLocations({ page: response.pageNumber + 1, size: 10 });
          } else {
            return EMPTY;
          }
        }),
        filter(response => response !== null),
        map(response => response.items),
        reduce<Location[], Location[]>((acc, items) => [...acc, ...items], []),
        tap(allLocations => this.allLocations = allLocations),
        catchError(() => of([]))
      )
      .subscribe();
  }

  onLocationChange(event: any): void {
    const selectedId = event.target.value === '' ? null : parseInt(event.target.value, 10);
    this.locationSelected.emit(selectedId);
    this.showAutocompleteResults = false;
    this.selectionMade = true;
    this.cdr.detectChanges();
  }

  onAutocompleteSelect(location: Location): void {
    this.searchControl.setValue(`${location.cityName} - ${location.departmentName} - ${location.neighborhood}`);
    this.locationSelected.emit(location.id);
    this.showAutocompleteResults = false;
    this.selectionMade = true;
    this.cdr.detectChanges();
  }

  handleEnter(): void {
    if (this.showAutocompleteResults && this.locations$) {
      this.locations$.pipe(take(1)).subscribe(locations => {
        if (locations && locations.length > 0) {
          const firstLocation = locations[0];
          this.onAutocompleteSelect(firstLocation);
          if (this.searchInput && this.searchInput.nativeElement) {
            this.searchInput.nativeElement.blur();
          }
        } else if (this.searchControl.value) {
          this.locationSelected.emit(null);
          this.selectionMade = true;
          this.cdr.detectChanges();
        }
      });
    } else if (this.searchControl.value) {
      this.locationSelected.emit(null);
      this.selectionMade = true;
      this.cdr.detectChanges();
      console.log('Lista debería ocultarse por borrado de input');
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showAutocompleteResults = false;
      this.cdr.detectChanges();
    }, 200);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    const isInsideComponent = this.elementRef.nativeElement.contains(targetElement);

    if (this.showAutocompleteResults && !isInsideComponent) {
      this.showAutocompleteResults = false;
      this.cdr.detectChanges();
      console.log('Lista debería ocultarse por clic fuera'); // <--- AGREGAR ESTO
    }
  }
}
