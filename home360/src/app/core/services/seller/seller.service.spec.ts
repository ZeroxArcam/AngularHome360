import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SellerService } from './seller.service';
import { environment } from '@env/environment';
import { SellerRequest, CreateSellerResponse } from '@app/core/models/seller.model';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

describe('SellerService', () => {
  let service: SellerService;
  let httpTestingController: HttpTestingController;
  const mockSellerRequest: SellerRequest = {
    name: 'John',
    lastName: 'Doe',
    idNumber: '12345',
    phoneNumber: '555-1234',
    birthDate: '2000-01-01',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'Seller'
  };
  const mockCreateSellerResponse: CreateSellerResponse = {
    message: 'Seller created successfully',
    time: '2025-05-03T20:38:20.6078462'
  };
  const mockErrorResponse = {
    success: false,
    message: 'Failed to create seller',
    error: 'Internal Server Error'
  };
  const createSellerUrl = `${environment.usersapiUrl}/user/create`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SellerService]
    });
    service = TestBed.inject(SellerService);
    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createSeller', () => {
    it('should send a POST request to the correct URL with the provided payload and authorization header', () => {
      localStorage.setItem('authToken', 'test-token');

      service.createSeller(mockSellerRequest).subscribe();

      const req = httpTestingController.expectOne(createSellerUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSellerRequest);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

      req.flush(mockCreateSellerResponse);
    });

    it('should send a POST request without authorization header if no token is in localStorage', () => {
      service.createSeller(mockSellerRequest).subscribe();

      const req = httpTestingController.expectOne(createSellerUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSellerRequest);
      expect(req.request.headers.get('Authorization')).toBeNull();

      req.flush(mockCreateSellerResponse);
    });

    it('should return an Observable of CreateSellerResponse on successful creation', (done) => {
      localStorage.setItem('authToken', 'test-token');

      service.createSeller(mockSellerRequest).subscribe(response => {
        expect(response).toEqual(mockCreateSellerResponse);
        done();
      });

      const req = httpTestingController.expectOne(createSellerUrl);
      req.flush(mockCreateSellerResponse);
    });

    it('should return an Observable that errors on unsuccessful creation (500 Internal Server Error)', (done) => {
      localStorage.setItem('authToken', 'test-token');

      service.createSeller(mockSellerRequest).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(500);
          expect(error.error).toEqual(mockErrorResponse);
          done();
        }
      });

      const req = httpTestingController.expectOne(createSellerUrl);
      req.flush(mockErrorResponse, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors and return an error Observable (400 Bad Request)', (done) => {
      localStorage.setItem('authToken', 'test-token');

      const mockValidationError = { message: 'Validation error' };

      service.createSeller(mockSellerRequest).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error instanceof HttpErrorResponse).toBe(true);
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
          expect(error.error).toEqual(mockValidationError);
          done();
        }
      });

      const req = httpTestingController.expectOne(createSellerUrl);
      req.flush(
        mockValidationError,
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});
