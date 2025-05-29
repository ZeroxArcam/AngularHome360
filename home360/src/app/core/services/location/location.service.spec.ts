import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { environment } from '@env/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { LocationRequest, LocationResponse, PagedLocationRequest, Location } from '@app/core/models/location.model';

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;
  const fakeToken = 'fake-jwt-token';

  const mockLocationRequest: LocationRequest = {
    neighborhood: 'Test Location',
    cityDepartmentId: 1,
  };

  const mockLocationResponse: LocationResponse = {
    message: 'Location created',
  };

  const mockPagedLocationRequest: PagedLocationRequest = {
    page: 0,
    size: 10,
    sortBy: 'cityName',
    sortDirection: 'ASC',
    text: 'Bogotá'
  };

  const mockLocations: Location[] = [
    { id: 1, cityName: 'Bogotá', departmentName: 'Cundinamarca', neighborhood: 'Usaquén' },
    { id: 2, cityName: 'Medellín', departmentName: 'Antioquia', neighborhood: 'Poblado' }
  ];

  const mockApiResponse = {
    locations: mockLocations,
    totalElements: 2,
    totalPages: 1,
    pageNumber: 0,
    pageSize: 10
  };

  beforeEach(() => {
    localStorage.setItem('authToken', fakeToken);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LocationService]
    });

    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('authToken');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createLocation', () => {
    it('should send POST request with correct headers and body', () => {
      service.createLocation(mockLocationRequest).subscribe();

      const req = httpMock.expectOne(`${environment.homeapiUrl}/locations/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);
      expect(req.request.body).toEqual(mockLocationRequest);
    });

    it('should return LocationResponse on success', () => {
      service.createLocation(mockLocationRequest).subscribe(response => {
        expect(response).toEqual(mockLocationResponse);
      });

      const req = httpMock.expectOne(`${environment.homeapiUrl}/locations/create`);
      req.flush(mockLocationResponse);
    });

    it('should handle errors', () => {
      const mockError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      service.createLocation(mockLocationRequest).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.homeapiUrl}/locations/create`);
      req.flush(null, mockError);
    });

    it('should handle null token', () => {
      localStorage.removeItem('authToken');
      service.createLocation(mockLocationRequest).subscribe();
      const req = httpMock.expectOne(`${environment.homeapiUrl}/locations/create`);
      expect(req.request.headers.has('Authorization')).toBe(false);
    });
  });

  describe('getLocations', () => {
    it('should send GET request with correct encoded URL parameters', () => {
      service.getLocations(mockPagedLocationRequest).subscribe();

      const encodedText = encodeURIComponent('Bogotá');
      const expectedUrl = `${environment.homeapiUrl}/locations/search?page=0&size=10&sortBy=cityName&sortDirection=ASC&text=${encodedText}`;

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.toString()).toBe(
        'page=0&size=10&sortBy=cityName&sortDirection=ASC&text=Bogot%C3%A1'
      );
    });

    it('should return mapped PaginationResponse on success', () => {
      service.getLocations(mockPagedLocationRequest).subscribe(response => {
        expect(response).toEqual({
          items: mockLocations,
          totalElements: 2,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10
        });
      });

      const req = httpMock.expectOne(req =>
        req.url === `${environment.homeapiUrl}/locations/search`
      );
      req.flush(mockApiResponse);
    });

    it('should handle errors', () => {
      const mockError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found'
      });

      service.getLocations(mockPagedLocationRequest).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(req =>
        req.url === `${environment.homeapiUrl}/locations/search`
      );
      req.flush(null, mockError);
    });

    it('should use default parameters when optional params are empty', () => {
      const minimalRequest: PagedLocationRequest = {
        page: 1,
        size: 5,
        sortBy: '',
        sortDirection: '',
        text: ''
      };

      service.getLocations(minimalRequest).subscribe();

      const req = httpMock.expectOne(
        `${environment.homeapiUrl}/locations/search?page=1&size=5`
      );
      expect(req.request.params.toString()).toBe('page=1&size=5');
    });

    it('should include only provided parameters', () => {
      const partialRequest: PagedLocationRequest = {
        page: 2,
        size: 20,
        sortBy: 'departmentName',
        text: 'Cundinamarca'
      };

      service.getLocations(partialRequest).subscribe();

      const encodedText = encodeURIComponent('Cundinamarca');
      const expectedUrl = `${environment.homeapiUrl}/locations/search?page=2&size=20&sortBy=departmentName&text=${encodedText}`;

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.params.toString()).toBe(
        'page=2&size=20&sortBy=departmentName&text=Cundinamarca'
      );
    });
  });
});
