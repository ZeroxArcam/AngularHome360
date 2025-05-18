import { TestBed } from '@angular/core/testing';

import { TimeSlotService } from './time-slot.service';
import { HttpClientModule } from '@angular/common/http';

describe('TimeSlotService', () => {
  let service: TimeSlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    service = TestBed.inject(TimeSlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
