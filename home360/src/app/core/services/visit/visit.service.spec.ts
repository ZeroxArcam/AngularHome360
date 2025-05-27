import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VisitService } from './visit.service';
import { VisitRequest, VisitResponse } from '@app/core/models/time-slot.model';
import { environment } from '@env/environment';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

describe('VisitService', () => {
  let service: VisitService;
  let httpMock: HttpTestingController;
  const visitapiUrl = environment.visitapiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VisitService]
    });
    service = TestBed.inject(VisitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createVisit', () => {
    it('should create a visit', () => {
      const mockPayload: VisitRequest = {
        timeSlotId: 1,
      };
      const mockResponse: VisitResponse = {
        code: '200',
        message: 'Visit created'
      };

      localStorage.setItem('authToken', 'test-token');

      service.createVisit(mockPayload).subscribe((response: VisitResponse) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${visitapiUrl}/visits/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

      req.flush(mockResponse);
    });

    it('should create a visit without a token', () => {
      const mockPayload: VisitRequest = {
        timeSlotId: 1,
      };
      const mockResponse: VisitResponse = {
        code: '200',
        message: 'Visit created'
      };

      localStorage.removeItem('authToken');

      service.createVisit(mockPayload).subscribe((response: VisitResponse) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${visitapiUrl}/visits/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      expect(req.request.headers.get('Authorization')).toBeNull();

      req.flush(mockResponse);
    });
  });
});
