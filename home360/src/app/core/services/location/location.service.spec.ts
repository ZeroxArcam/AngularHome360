import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { environment } from '@env/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { LocationRequest, LocationResponse } from '@app/core/models/location.model';


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
      // expect(req.request.headers.get('Authorization')).toBeNull();
    });
  });
});
