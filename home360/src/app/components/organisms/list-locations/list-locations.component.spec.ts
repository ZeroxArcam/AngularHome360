import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ListLocationsComponent } from './list-locations.component';
import { LocationService } from '@app/core/services/location/location.service';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { Location } from '@app/core/models/location.model';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('ListLocationsComponent', () => {
  let component: ListLocationsComponent;
  let fixture: ComponentFixture<ListLocationsComponent>;
  let locationServiceMock: any;
  let mockLocations: Location[];
  let mockPaginationResponse: PaginationResponse<Location>;

  beforeEach(async () => {
    mockLocations = [
      { id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca', neighborhood: 'Usaquén' },
      { id: 2, cityName: 'Medellín', departmentName: 'Antioquia', neighborhood: 'Poblado' }
    ];

    mockPaginationResponse = {
      items: mockLocations,
      totalElements: 2,
      totalPages: 2,
      pageNumber: 0,
      pageSize: 10
    };

    locationServiceMock = {
      getLocations: jest.fn().mockReturnValue(of(mockPaginationResponse))
    };

    await TestBed.configureTestingModule({
      declarations: [ListLocationsComponent],
      providers: [
        { provide: LocationService, useValue: locationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default pagination parameters', () => {
    expect(component.currentSortBy).toBe('cityName');
    expect(component.currentSortDirection).toBe('ASC');
    expect(component['pageSize']).toBe(10);
  });

  it('should load locations on init', () => {
    component.ngOnInit();
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      sortBy: 'cityName',
      sortDirection: 'ASC',
      text: ''
    });
  });

  it('should update pagination parameters on filter change', fakeAsync(() => {
    component.filterTextControl.setValue('test');
    tick(300);
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'test', page: 0 })
    );
  }));

  it('should handle null text filter', fakeAsync(() => {
    component.filterTextControl.setValue(null);
    tick(300);
    expect(component['paginationParams'].value.text).toBe('');
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ text: '' })
    );
  }));

  it('should handle empty text filter', fakeAsync(() => {
    component.filterTextControl.setValue('');
    tick(300);
    expect(component['paginationParams'].value.text).toBe('');
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ text: '' })
    );
  }));

  it('should handle zero total pages in nextPage navigation', () => {
    component['totalPagesSubject'].next(0);
    const initialPage = component['paginationParams'].value.page;
    component.nextPage();
    expect(component['paginationParams'].value.page).toBe(initialPage);
  });

  it('should handle invalid total pages in nextPage navigation', () => {
    // Test para valores inválidos (undefined, null, valores negativos)
    [undefined, null, -1].forEach(testCase => {
      (component['totalPagesSubject'] as BehaviorSubject<any>).next(testCase);
      const initialPage = component['paginationParams'].value.page;
      component.nextPage();
      expect(component['paginationParams'].value.page).toBe(initialPage);
    });
  });

  it('should change page correctly', () => {
    component.goToPage(2);
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('should handle previous page navigation', () => {
    component['paginationParams'].next({ ...component['paginationParams'].value, page: 2 });
    component.prevPage();
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('should handle next page navigation', () => {
    component['totalPagesSubject'].next(3);
    component.nextPage();
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('should toggle sort order', () => {
    component.toggleOrder('cityName');
    expect(component.currentSortDirection).toBe('DESC');
    expect(locationServiceMock.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'cityName', sortDirection: 'DESC', page: 0 })
    );

    component.toggleOrder('departmentName');
    expect(component.currentSortBy).toBe('departmentName');
    expect(component.currentSortDirection).toBe('ASC');
  });

  it('should update total pages and page numbers', (done) => {
    component.locationsDto$.subscribe(() => {
      expect(component['totalPagesSubject'].value).toBe(2);
      component.pages$?.subscribe(pages => {
        expect(pages).toEqual([0, 1]);
        done();
      });
    });
  });

  it('should re-throw error from locationsDto$', fakeAsync(() => {
    const testError = new Error('Test error');
    locationServiceMock.getLocations.mockReturnValueOnce(throwError(() => testError));

    let errorThrown = false;
    component.locationsDto$.subscribe({
      error: (err) => {
        expect(err).toBe(testError);
        errorThrown = true;
      }
    });

    tick();
    expect(errorThrown).toBe(true);
  }));

  it('should render location data', fakeAsync(() => {
    locationServiceMock.getLocations.mockReturnValue(of(mockPaginationResponse));
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    const tableBody = fixture.debugElement.query(By.css('.location-list__table tbody'));
    const rows = tableBody.queryAll(By.css('tr'));
    expect(rows.length).toBe(2);

    const firstRowCells = rows[0].queryAll(By.css('td'));
    expect(firstRowCells[0].nativeElement.textContent.trim()).toBe('#LOC-1');
    expect(firstRowCells[1].nativeElement.textContent.trim()).toBe('Bogotá');
    expect(firstRowCells[2].nativeElement.textContent.trim()).toBe('Cundinamarca');
    expect(firstRowCells[3].nativeElement.textContent.trim()).toBe('Usaquén');

    const secondRowCells = rows[1].queryAll(By.css('td'));
    expect(secondRowCells[0].nativeElement.textContent.trim()).toBe('#LOC-2');
    expect(secondRowCells[1].nativeElement.textContent.trim()).toBe('Medellín');
  }));
});
