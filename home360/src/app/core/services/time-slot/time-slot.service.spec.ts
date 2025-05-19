import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TimeSlotService } from './time-slot.service';
import { environment } from '@env/environment';
import { TimeSlotRequest, TimeSlotResponse, TimeSlotQueryParams, PaginatedTimeSlotResponse } from '@app/core/models/time-slot.model';

describe('TimeSlotService', () => {
  let service: TimeSlotService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.visitapiUrl}/time-slots`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TimeSlotService]
    });

    service = TestBed.inject(TimeSlotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createTimeSlot', () => {
    it('should send a POST request with formatted UTC datetime and return response', () => {
      const payload: TimeSlotRequest = {
        homeId: 1,
        startTime: new Date('2025-05-17T15:00:00'),
        endTime: new Date('2025-05-17T16:00:00'),
      };

      const response: TimeSlotResponse = { message: 'TimeSlot created successfully' };

      const token = 'mocked-token';
      localStorage.setItem('authToken', token);

      service.createTimeSlot(payload).subscribe(res => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(`${apiUrl}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(req.request.body.homeId).toBe(payload.homeId);
      expect(req.request.body.startTime).toContain('T');
      expect(req.request.body.endTime).toContain('T');

      req.flush(response);
    });
  });

  describe('getTimeSlots', () => {
    it('should send a GET request with correct query params and map the response', () => {
      const queryParams: TimeSlotQueryParams = {
        sellerId: 5,
        homeId: 10,
        startTime: '2025-05-17T15:00:00',
        endTime: '2025-05-17T17:00:00',
        page: 1,
        size: 5,
        sortBy: 'startTime',
        sortDirection: 'ASC'
      };

      const mockApiResponse: PaginatedTimeSlotResponse = {
        timeSlots: [
          {
            id: 1,
            startTime: '2025-05-17T15:00:00',
            endTime: '2025-05-17T16:00:00',
            homeId: 10,
            sellerId: 5
          }
        ],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 5
      };

      service.getTimeSlots(queryParams).subscribe(res => {
        expect(res.items.length).toBe(1);
        expect(res.totalElements).toBe(1);
        expect(res.totalPages).toBe(1);
        expect(res.pageNumber).toBe(1);
        expect(res.pageSize).toBe(5);
      });

      const req = httpMock.expectOne(request => request.url === `${apiUrl}/search`);
      expect(req.request.method).toBe('GET');

      const params = req.request.params;
      expect(params.get('sellerId')).toBe('5');
      expect(params.get('homeId')).toBe('10');
      expect(params.get('page')).toBe('1');
      expect(params.get('size')).toBe('5');
      expect(params.get('sortBy')).toBe('startTime');
      expect(params.get('sortDirection')).toBe('ASC');

      req.flush(mockApiResponse);
    });
  });
});
