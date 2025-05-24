import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { HomeService } from './home.service';
import { HomeRequest, HomeResponse, PagedHomeRequest, Home } from '@app/core/models/home.model';
import { mockHomeRequest, mockHomeResponse } from '@shared/mocks/home-mock';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';

describe('HomeService', () => {
  let service: HomeService;
  let httpTestingController: HttpTestingController;
  const mockHome: Home = {
    id: 1,
    name: 'Test Home',
    neighborhood: 'Test Neighborhood',
    address: '123 Test St',
    description: 'Test Description',
    category: 'Casa',
    numberOfRooms: 3,
    numberOfBathrooms: 2,
    price: 200000,
    cityName: 'Test City',
    departmentName: 'Test Department',
    activePublicationDate: '2023-01-01',
    userId: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HomeService]
    });

    service = TestBed.inject(HomeService);
    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
  });
  beforeAll(() => {
    process.env.TZ = 'UTC';
  });

  describe('createProperty', () => {
    it('should send POST request with correct headers and body', () => {
      const token = 'test-token';
      localStorage.setItem('authToken', token);

      service.createProperty(mockHomeRequest).subscribe(response => {
        expect(response).toEqual(mockHomeResponse);
      });

      const req = httpTestingController.expectOne(`${environment.homeapiUrl}/home/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(req.request.body).toEqual(mockHomeRequest);

      req.flush(mockHomeResponse);
    });

    it('should send request without auth header when no token', () => {
      service.createProperty(mockHomeRequest).subscribe();

      const req = httpTestingController.expectOne(`${environment.homeapiUrl}/home/create`);
      expect(req.request.headers.has('Authorization')).toBeFalsy();
    });
  });

  describe('getProperties', () => {
    it('should send GET request with correct params', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        sortBy: 'price',
        sortDirection: 'asc',
        locationId: 5,
        categoryId: 2,
        minRooms: 2,
        currentDate: new Date(Date.UTC(2023, 0, 1))
      };

      const mockResponse: PaginationResponse<Home> = {
        items: [mockHome],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10
      };

      service.getProperties(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(
        req => req.url === `${environment.homeapiUrl}/home/search`
      );

      expect(req.request.method).toBe('GET');
      expect(req.request.params.toString()).toContain('page=1');
      expect(req.request.params.toString()).toContain('size=10');
      expect(req.request.params.toString()).toContain('sortBy=price');
      expect(req.request.params.toString()).toContain('sortDirection=asc');
      expect(req.request.params.toString()).toContain('locationId=5');
      expect(req.request.params.toString()).toContain('categoryId=2');
      expect(req.request.params.toString()).toContain('minRooms=2');
      expect(req.request.params.get('currentDate')).toBe('2023-01-01');

      req.flush({
        home: [mockHome],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10
      });
    });

    it('should handle null parameters correctly', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        sortBy: null,
        locationId: null,
        currentDate: null
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10`
      );

      expect(req.request.params.keys().length).toBe(2);
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should format currentDate when it is a Date', () => {
      const testDate = new Date(Date.UTC(2023, 0, 1));
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        currentDate: testDate
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        req => req.params.get('currentDate') === '2023-01-01'
      );
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should map response correctly', () => {
      const apiResponse = {
        home: [mockHome],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10
      };

      service.getProperties({ page: 1, size: 10 }).subscribe(response => {
        expect(response.items.length).toBe(1);
        expect(response.totalElements).toBe(1);
        expect(response.items[0].id).toBe(mockHome.id);
      });

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10`
      );
      req.flush(apiResponse);
    });

    it('should handle getProperties error', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'test error',
        status: 404,
        statusText: 'Not Found'
      });

      service.getProperties({ page: 1, size: 10 }).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(404);
        }
      });

      const req = httpTestingController.expectOne(`${environment.homeapiUrl}/home/search?page=1&size=10`);
      req.flush('Error', errorResponse);
    });

    it('should include userId as string when present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        userId: 123
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10&userId=123`
      );
      expect(req.request.params.get('userId')).toBe('123');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should include homeId as string when present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        homeId: 456
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10&homeId=456`
      );
      expect(req.request.params.get('homeId')).toBe('456');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should include maxRooms as string when present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        maxRooms: 5
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10&maxRooms=5`
      );
      expect(req.request.params.get('maxRooms')).toBe('5');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should include bathroom parameters as strings when present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        minBathrooms: 2,
        maxBathrooms: 3
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        req => req.url === `${environment.homeapiUrl}/home/search`
      );
      expect(req.request.params.get('minBathrooms')).toBe('2');
      expect(req.request.params.get('maxBathrooms')).toBe('3');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should include price parameters as strings when present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        minPrice: 100000,
        maxPrice: 500000
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        req => req.url === `${environment.homeapiUrl}/home/search`
      );
      expect(req.request.params.get('minPrice')).toBe('100000');
      expect(req.request.params.get('maxPrice')).toBe('500000');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should handle string currentDate without formatting', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10,
        currentDate: '2023-01-01'
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10&currentDate=2023-01-01`
      );
      expect(req.request.params.get('currentDate')).toBe('2023-01-01');
      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should exclude all optional parameters when not present', () => {
      const mockRequest: PagedHomeRequest = {
        page: 1,
        size: 10
      };

      service.getProperties(mockRequest).subscribe();

      const req = httpTestingController.expectOne(
        `${environment.homeapiUrl}/home/search?page=1&size=10`
      );

      const excludedParams = [
        'userId', 'homeId', 'minRooms', 'maxRooms',
        'minBathrooms', 'maxBathrooms', 'minPrice',
        'maxPrice', 'currentDate'
      ];

      excludedParams.forEach(param => {
        expect(req.request.params.get(param)).toBeNull();
      });

      req.flush({ home: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 });
    });

    it('should format dates correctly in UTC', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formattedDate = (service as any).formatDate(date);
      expect(formattedDate).toBe('2023-01-01');
    });

  });


});
