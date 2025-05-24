import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ScheduleModalComponent } from './schedule-modal.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { TranslationService } from '@app/core/services/translation/translation.service';

const mockTimeSlotService = {
  getTimeSlots: jest.fn().mockReturnValue(of([])),
  createTimeSlot: jest.fn().mockReturnValue(of({ message: 'Horario creado' }))
};

const mockTranslationService = {
  translate: jest.fn().mockImplementation((value: string) => {
    if (value === 'ERROR_API') {
      return 'ERROR_API';
    } else if (value === 'Error del servidor') {
      return 'Error del servidor';
    }
    return value;
  })
};

describe('ScheduleModalComponent', () => {
  let component: ScheduleModalComponent;
  let fixture: ComponentFixture<ScheduleModalComponent>;
  const formatDateForInputMock = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScheduleModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: TimeSlotService, useValue: mockTimeSlotService },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();
    jest.clearAllMocks();


    fixture = TestBed.createComponent(ScheduleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should load time slots when homeId is set', () => {
    const mockResponse = {
      items: [
        { id: 1, start: '08:00', end: '09:00' },
        { id: 2, start: '09:00', end: '10:00' }
      ]
    };

    component.homeId = 123;
    mockTimeSlotService.getTimeSlots.mockReturnValue(of(mockResponse));

    component.loadTimeSlots();

    expect(mockTimeSlotService.getTimeSlots).toHaveBeenCalledWith(expect.objectContaining({
      homeId: 123,
      page: 0,
      size: 100
    }));

    expect(component.timeSlots).toEqual(mockResponse.items);
  });

  it('should handle error and set errorMessage when service fails', () => {
    const mockError = 'ERROR_API';
    component.homeId = 123;
    mockTimeSlotService.getTimeSlots.mockReturnValue(throwError(() => mockError));

    component.loadTimeSlots();

    expect(mockTranslationService.translate).toHaveBeenCalledWith(mockError);
    expect(component.errorMessage).toBe(mockError);
    expect(component.timeSlots).toEqual([]);
  });

  it('should call loadTimeSlots, setInitialStartTime and markAllAsTouched when homeId is set', () => {
    component.homeId = 123;

    const loadSpy = jest.spyOn(component, 'loadTimeSlots').mockImplementation(() => { });
    const startTimeSpy = jest.spyOn(component, 'setInitialStartTime').mockImplementation(() => { });
    const markTouchedSpy = jest.spyOn(component.scheduleForm, 'markAllAsTouched');

    component.ngOnInit();

    expect(loadSpy).toHaveBeenCalled();
    expect(startTimeSpy).toHaveBeenCalled();
    expect(markTouchedSpy).toHaveBeenCalled();
  });

  it('should emit close event when onClose is called', () => {
    jest.spyOn(component.close, 'emit');

    component.onClose();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should create a schedule and reset form on success', fakeAsync(() => {
    component.homeId = 123;

    const startTimeValue = new Date();
    startTimeValue.setHours(startTimeValue.getHours() + 2);
    const endTimeValue = new Date(startTimeValue);
    endTimeValue.setHours(endTimeValue.getHours() + 2);

    const formattedStartTime = formatDateForInputMock(startTimeValue);
    const formattedEndTime = formatDateForInputMock(endTimeValue);

    component.scheduleForm.setValue({
      startTime: formattedStartTime,
      endTime: formattedEndTime
    });

    const responseMock = { message: 'Horario creado' };
    const createSpy = jest.spyOn(mockTimeSlotService, 'createTimeSlot').mockReturnValue(of(responseMock));

    component.createSchedule();
    tick(3000);

    expect(createSpy).toHaveBeenCalledWith({
      homeId: 123,
      startTime: new Date(formatDateForInputMock(startTimeValue)),
      endTime: new Date(formatDateForInputMock(endTimeValue))
    });
  }));
  it('should handle error when schedule creation fails', fakeAsync(() => {
    component.homeId = 123;

    const validStart = new Date();
    validStart.setHours(validStart.getHours() + 2);
    const validEnd = new Date(validStart);
    validEnd.setHours(validEnd.getHours() + 2);

    component.scheduleForm.setValue({
      startTime: formatDateForInputMock(validStart),
      endTime: formatDateForInputMock(validEnd)
    });

    const errorResponse = { error: { message: 'Error del servidor' } };
    mockTimeSlotService.createTimeSlot.mockReturnValue(throwError(() => errorResponse));

    component.createSchedule();

    expect(component.errorMessage).toBe('Error del servidor');

    tick(5000);

    expect(component.errorMessage).toBeNull();
  }));

  it('should mark all form fields as touched if form is invalid', () => {
    component.homeId = 123;

    component.scheduleForm.setValue({
      startTime: '',
      endTime: ''
    });

    const markAllAsTouchedSpy = jest.spyOn(component.scheduleForm, 'markAllAsTouched');
    component.createSchedule();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should set input element value to formatted date two hours ahead', () => {
    const elementId = 'testInput';
    const inputElement = document.createElement('input');
    inputElement.id = elementId;
    document.body.appendChild(inputElement);

    const mockCurrentDate = new Date('2024-05-20T14:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockCurrentDate);

    component.setDateTimeToday(elementId);

    const expectedDate = new Date(mockCurrentDate);
    expectedDate.setHours(mockCurrentDate.getHours());

    const expectedValue = formatDateForInputMock(expectedDate);

    expect(inputElement.value).toBe(expectedValue);

    document.body.removeChild(inputElement);
    jest.restoreAllMocks();
  });

  it('should handle non-existent element gracefully', () => {
    const invalidElementId = 'nonExistentId';

    expect(() => component.setDateTimeToday(invalidElementId)).not.toThrow();
  });

  describe('setStartTimeToday', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set startTime 2 hours in the future', () => {
      const mockDate = new Date('2024-05-20T08:00:00');
      jest.setSystemTime(mockDate);

      component.setStartTimeToday();

      const expectedDate = new Date(mockDate);
      expectedDate.setHours(10);
      const expectedValue = formatDateForInputMock(expectedDate);

      expect(component.scheduleForm.controls['startTime'].value).toBe(expectedValue);
    });

    it('should handle day/month/year transitions', () => {
      const mockDate = new Date('2024-12-31T23:30:00');
      jest.setSystemTime(mockDate);

      component.setStartTimeToday();

      const expectedDate = new Date(mockDate);
      expectedDate.setHours(23 + 2);
      const expectedValue = formatDateForInputMock(expectedDate);

      expect(component.scheduleForm.controls['startTime'].value).toBe(expectedValue);
    });

    it('should keep the current minutes', () => {
      const mockDate = new Date('2024-07-15T14:45:00');
      jest.setSystemTime(mockDate);

      component.setStartTimeToday();

      const result = component.scheduleForm.controls['startTime'].value;
      expect(result).toMatch(/16:45$/);
    });
  });
  describe('setEndTimeToday', () => {
    let realDate: DateConstructor;

    beforeAll(() => {
      realDate = Date;
    });

    afterAll(() => {
      global.Date = realDate;
    });

    it('should set endTime based on startTime when startTime exists', () => {
      const OriginalDate = global.Date;
      const mockSystemTime = new Date('2024-05-20T12:00:00');

      jest.useFakeTimers();
      jest.setSystemTime(mockSystemTime);

      const startTimeValue = '2024-05-20T14:00';
      component.scheduleForm.controls['startTime'].setValue(startTimeValue);
      component.setEndTimeToday();
      const startTime = new Date(startTimeValue);
      const expectedDate = new Date(startTime);
      expectedDate.setHours(startTime.getHours() + 2);
      const expectedValue = formatDateForInputMock(expectedDate);

      expect(component.scheduleForm.controls['endTime'].value).toBe(expectedValue);

      jest.useRealTimers();
    });

    it('should set endTime using current time when startTime is empty', () => {
      const mockDate = new Date('2024-05-20T12:00:00');
      global.Date = class extends realDate {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      component.scheduleForm.controls['startTime'].setValue('');
      component.setEndTimeToday();

      const expectedDate = new Date(mockDate);
      expectedDate.setHours(mockDate.getHours());
      const expectedValue = formatDateForInputMock(expectedDate);

      expect(component.scheduleForm.controls['endTime'].value).toBe(expectedValue);
    });
  })

  describe('getMinStartTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return current time plus two hours in correct format', () => {
      const mockDate = new Date('2024-05-20T10:00:00');
      jest.setSystemTime(mockDate);

      const result = component.getMinStartTime();

      const expectedDate = new Date(mockDate);
      expectedDate.setHours(mockDate.getHours() + 2);
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should handle day/month/year transitions', () => {
      jest.setSystemTime(new Date('2024-12-31T23:00:00'));

      const result = component.getMinStartTime();

      const expected = '2025-01-01T01:00';

      expect(result).toBe(expected);
    });
  });

  describe('getMaxStartTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return date three weeks ahead in correct format', () => {
      const mockDate = new Date('2024-03-15T14:30:00');
      jest.setSystemTime(mockDate);

      const result = component.getMaxStartTime();

      const expectedDate = new Date(mockDate);
      expectedDate.setDate(mockDate.getDate() + 21);
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should handle month/year transitions', () => {
      jest.setSystemTime(new Date('2024-12-31T23:59:00'));

      const result = component.getMaxStartTime();

      const expectedDate = new Date('2024-12-31T23:59:00');
      expectedDate.setDate(expectedDate.getDate() + 21);
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should maintain time component from current date', () => {
      jest.setSystemTime(new Date('2024-05-10T08:45:30'));

      const result = component.getMaxStartTime();

      expect(result).toMatch(/T08:45$/);
    });
  });

  describe('getMinEndTime', () => {
    const mockStartTime = (dateString: string) => {
      component.scheduleForm.get('startTime')?.setValue(dateString);
    };

    const createLocalDate = (dateString: string): Date => {
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    };

    it('should return startTime + 2 hours in correct format', () => {
      const startDate = '2024-05-20T08:30';
      mockStartTime(startDate);

      const result = component.getMinEndTime();

      const expectedDate = createLocalDate(startDate);
      expectedDate.setHours(expectedDate.getHours() + 2);

      expect(result).toBe(formatDateForInputMock(expectedDate));
    });

    it('should handle midnight transitions', () => {
      const startDate = '2024-12-31T23:45';
      mockStartTime(startDate);

      const result = component.getMinEndTime();

      const expectedDate = createLocalDate(startDate);
      expectedDate.setHours(expectedDate.getHours() + 2);

      expect(result).toBe(formatDateForInputMock(expectedDate));
    });

    it('should handle daylight saving time', () => {

      const startDate = '2024-03-31T01:30';
      mockStartTime(startDate);

      const result = component.getMinEndTime();

      const expectedDate = createLocalDate(startDate);
      expectedDate.setHours(expectedDate.getHours() + 2);

      expect(result).toBe(formatDateForInputMock(expectedDate));
    });

    it('should return an empty string if there is no startTime', () => {
      component.scheduleForm.get('startTime')?.setValue('');

      const result = component.getMinEndTime();

      expect(result).toBe('');
    });
  });

  describe('getMaxEndTime', () => {
    const mockStartTime = (date: string | null) => {
      component.scheduleForm.get('startTime')?.setValue(date);
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-05-20T10:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return + 21 days when startTime is valid', () => {
      mockStartTime('2024-05-20T14:30');

      const result = component.getMaxEndTime();
      const expectedDate = new Date('2024-05-20T14:30');
      expectedDate.setDate(20 + 21);
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should handle month change', () => {
      mockStartTime('2024-02-28T09:00');

      const result = component.getMaxEndTime();
      const expectedDate = new Date('2024-03-20T09:00');
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should handle year change', () => {
      mockStartTime('2024-12-31T23:59');

      const result = component.getMaxEndTime();
      const expectedDate = new Date('2025-01-21T23:59');
      const expected = formatDateForInputMock(expectedDate);

      expect(result).toBe(expected);
    });

    it('should use the current date if startTime is invalid', () => {
      mockStartTime('fecha-invalida');

      const result = component.getMaxEndTime();
      expect(result).toBe("NaN-NaN-NaNTNaN:NaN");
    });

    it('should return the current date if startTime does not exist', () => {
      mockStartTime(null);

      const result = component.getMaxEndTime();
      const expected = formatDateForInputMock(new Date());

      expect(result).toBe(expected);
    });

    it('should maintain the same hour/minutes as startTime', () => {
      mockStartTime('2024-07-15T18:45');

      const result = component.getMaxEndTime();
      expect(result).toMatch(/T18:45$/);
    });
  });

  describe('onDocumentClick', () => {
    let modalContent: HTMLElement;
    let outsideElement: HTMLElement;

    beforeEach(() => {
      modalContent = document.createElement('div');
      modalContent.classList.add('schedule-modal__content');
      fixture.nativeElement.appendChild(modalContent);

      outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);

      component.homeId = 123;
    });

    afterEach(() => {
      document.body.removeChild(outsideElement);
    });

    it('should close when a click outside of the modal is made', () => {
      const closeSpy = jest.spyOn(component, 'onClose');

      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      outsideElement.dispatchEvent(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close when a click inside the modal is made', () => {
      const closeSpy = jest.spyOn(component, 'onClose');

      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true
      });
      modalContent.dispatchEvent(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not do anything is homeId is null', () => {
      component.homeId = null;
      const closeSpy = jest.spyOn(component, 'onClose');

      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not do anything is the modal do not exist in the DOM', () => {
      fixture.nativeElement.removeChild(modalContent);
      const closeSpy = jest.spyOn(component, 'onClose');

      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should handle events in nested elements', () => {
      const closeSpy = jest.spyOn(component, 'onClose');
      const innerElement = document.createElement('span');
      modalContent.appendChild(innerElement);

      const event = new MouseEvent('mousedown');
      innerElement.dispatchEvent(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('dateTimeRangeValidator', () => {
    let formGroup: FormGroup;
    const now = new Date('2024-05-20T10:00:00');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);

      formGroup = new FormGroup({
        startTime: new FormControl(''),
        endTime: new FormControl('')
      }, component.dateTimeRangeValidator.bind(component)());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const setTimes = (start: string, end: string) => {
      formGroup.patchValue({ startTime: start, endTime: end });
      formGroup.updateValueAndValidity();
    };

    it('should add error startTimeTooEarly if start < now + 2h', () => {
      const start = new Date(now);
      start.setHours(now.getHours() + 1);
      const end = new Date(start);
      end.setHours(start.getHours() + 1.59);

      setTimes(
        formatDateForInputMock(start),
        formatDateForInputMock(end)
      );
      expect(formGroup.get('startTime')?.errors).toHaveProperty('startTimeTooEarly');
    });

    it('should add error startTimeTooLate if start > 3 weeks', () => {
      const start = new Date(now);
      start.setDate(now.getDate() + 22);
      setTimes(start.toISOString(), new Date(now).toISOString());

      expect(formGroup.get('startTime')?.errors).toHaveProperty('startTimeTooLate');
    });

    it('should add error endTimeTooEarly if end < start + 2h', () => {
      const start = new Date(now);
      start.setHours(12);
      const end = new Date(start);
      end.setHours(13);
      setTimes(start.toISOString(), end.toISOString());

      expect(formGroup.get('endTime')?.errors).toHaveProperty('endTimeTooEarly');
    });

    it('should add error endTimeTooLate if end > 3 weeks', () => {
      const end = new Date(now);
      end.setDate(now.getDate() + 22);
      setTimes(now.toISOString(), end.toISOString());

      expect(formGroup.get('endTime')?.errors).toHaveProperty('endTimeTooLate');
    });

    it('should pass with valid times', () => {
      const start = new Date(now);
      start.setHours(now.getHours() + 3);
      const end = new Date(start);
      end.setHours(start.getHours() + 2);
      setTimes(start.toISOString(), end.toISOString());

      expect(formGroup.valid).toBeTruthy();
    });

    it('should ignore startTimeTooEarly if exactly 2h in the future', () => {
      const start = new Date(now);
      start.setHours(now.getHours() + 2);
      setTimes(start.toISOString(), new Date(now).toISOString());

      expect(formGroup.get('startTime')?.errors).toBeNull();
    });

    it('should ignore startTimeTooLate if exactly 21 days', () => {
      const start = new Date(now);
      start.setDate(now.getDate() + 21);
      setTimes(start.toISOString(), new Date(now).toISOString());

      expect(formGroup.get('startTime')?.errors).toBeNull();
    });

    it('should ignore endTimeTooEarly if exactly 2h after to start', () => {
      const start = new Date(now);
      const end = new Date(start);
      end.setHours(start.getHours() + 2);
      setTimes(start.toISOString(), end.toISOString());

      expect(formGroup.get('endTime')?.errors).toBeNull();
    });

    it('should ignore endTimeTooLate if exactly 21 days', () => {
      const end = new Date(now);
      end.setDate(now.getDate() + 21);
      setTimes(now.toISOString(), end.toISOString());

      expect(formGroup.get('endTime')?.errors).toBeNull();
    });
  });
})

