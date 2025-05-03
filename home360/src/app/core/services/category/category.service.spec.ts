import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from 'src/environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  const fakeToken = 'fake-jwt-token';
  const mockCategories = [
    { id: '1', name: 'Category 1', description: 'Desc 1' },
    { id: '2', name: 'Category 2', description: 'Desc 2' }
  ];

  beforeEach(() => {
    localStorage.setItem('authToken', fakeToken);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('authToken');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCategory', () => {
    it('should send POST request with correct headers and body', () => {
      const categoryData = { name: 'Cat1', description: 'Desc1' };

      service.createCategory(categoryData).subscribe();

      const req = httpMock.expectOne(`${environment.homeapiUrl}/categories/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);
      expect(req.request.body).toEqual(categoryData);
    });

    it('should return response data', () => {
      const categoryData = { name: 'Cat1', description: 'Desc1' };
      const mockResponse = { success: true, id: '123' };

      service.createCategory(categoryData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.homeapiUrl}/categories/create`);
      req.flush(mockResponse);
    });

    it('should handle errors', () => {
      const categoryData = { name: 'Cat1', description: 'Desc1' };
      const mockError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      service.createCategory(categoryData).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.homeapiUrl}/categories/create`);
      req.flush(null, mockError);
    });
  });

  describe('getCategories', () => {

    it('should send GET request with pagination params', () => {
      const page = 1;
      const size = 5;
      const orderAsc = false;
      service.getCategories(page, size, orderAsc).subscribe();
      const req = httpMock.expectOne(
        `${environment.homeapiUrl}/categories/read?page=${page}&size=${size}&orderAsc=${orderAsc}`
      );
      expect(req.request.method).toBe('GET');

    });

    it('should map response to PaginationResponse format', () => {
      const mockApiResponse = {
        categories: mockCategories,
        totalElements: 20,
        totalPages: 4,
        pageNumber: 0,
        pageSize: 5
      };

      service.getCategories().subscribe(response => {
        expect(response).toEqual({
          items: mockCategories,
          totalElements: 20,
          totalPages: 4,
          pageNumber: 0,
          pageSize: 5
        });
      });

      const req = httpMock.expectOne(
        `${environment.homeapiUrl}/categories/read?page=0&size=10&orderAsc=true`
      );
      req.flush(mockApiResponse);
    });

    it('should use default parameters when not provided', () => {
      service.getCategories().subscribe();

      const req = httpMock.expectOne(
        req => req.url === `${environment.homeapiUrl}/categories/read` &&
          req.params.get('page') === '0' &&
          req.params.get('size') === '10' &&
          req.params.get('orderAsc') === 'true'
      );

      expect(req.request.method).toBe('GET');
    });

    it('should handle errors for getCategories', () => {
      const mockError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found'
      });

      service.getCategories().subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${environment.homeapiUrl}/categories/read?page=0&size=10&orderAsc=true`
      );

      req.flush(null, mockError);
    });
  });
});
