import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { VisitPageComponent } from './visit-page.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { VISIT_MESSAGES } from '@app/shared/constants/messages.constants';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';
import { AuthService } from '@app/core/services/auth/auth.service';
import { VisitService } from '@app/core/services/visit/visit.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Injectable } from '@angular/core';
import { TimeSlot } from '@app/core/models/time-slot.model';
import { HomeViewModel } from '@app/core/models/home.model';

@Injectable()
class HomeFacadeServiceStub {
  getHomesWithAvailability = jest.fn(() => of({ items: [{ id: 1, name: 'Test Home' }], totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 1 }));
}

@Injectable()
class AuthServiceStub {
  userRole$ = new BehaviorSubject<string>('');
}

@Injectable()
class VisitServiceStub {
  createVisit = jest.fn(() => of({ code: 'BOOKING_SUCCESS', message: 'Booking successful' }));
}

@Injectable()
class TranslationServiceStub {
  translate = jest.fn((code: string) => `Translated: ${code}`);
}

@Injectable()
class RouterStub {
  navigate = jest.fn();
}

describe('VisitPageComponent', () => {
  let component: VisitPageComponent;
  let fixture: ComponentFixture<VisitPageComponent>;
  let homeFacadeService: HomeFacadeService;
  let authService: AuthService;
  let visitService: VisitService;
  let translationService: TranslationService;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  let changeDetectorRef: ChangeDetectorRef;

  const activatedRouteMock = {
    paramMap: of({ get: (key: string) => (key === 'id' ? '1' : null) }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisitPageComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: HomeFacadeService, useClass: HomeFacadeServiceStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: VisitService, useClass: VisitServiceStub },
        { provide: TranslationService, useClass: TranslationServiceStub },
        { provide: Router, useClass: RouterStub },
        { provide: ChangeDetectorRef, useClass: ChangeDetectorRef },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitPageComponent);
    component = fixture.componentInstance;
    homeFacadeService = TestBed.inject(HomeFacadeService);
    authService = TestBed.inject(AuthService);
    visitService = TestBed.inject(VisitService);
    translationService = TestBed.inject(TranslationService);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    changeDetectorRef = TestBed.inject(ChangeDetectorRef);
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load property details on init', () => {
    expect(homeFacadeService.getHomesWithAvailability).toHaveBeenCalled();
  });
  it('should handle invalid property ID', fakeAsync(() => {
    activatedRouteMock.paramMap = of({ get: (key: string) => null });
    const router = TestBed.inject(Router);

    const fixtureInvalid = TestBed.createComponent(VisitPageComponent);
    fixtureInvalid.detectChanges();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));


  it('should handle date selection with no available time slots', fakeAsync(() => {
    component.propertyFullViewModel = {
      id: 1,
      timeSlots: [{
        id: 1,
        startTime: '2024-01-02T10:00:00',
        endTime: '2024-01-02T11:00:00'
      }]
    } as any;

    component.reservationForm.get('checkInDate')?.setValue('2024-01-01');
    tick(100);

    expect(component.availableTimeSlotsForSelectedDate).toEqual([]);
    expect(component.reservationForm.get('selectedTimeSlot')?.value).toBeNull();
  }));

  it('should show appropriate message for expired time slots', () => {
    const expiredSlot: TimeSlot = {
      id: 1,
      startTime: '2020-01-01T10:00:00',
      endTime: '2020-01-01T11:00:00',
      homeId: 1,
      sellerId: 1
    };

    component.propertyFullViewModel = {
      id: 1,
      timeSlots: [expiredSlot]
    } as any;

    component.reservationForm.patchValue({ checkInDate: '2024-01-01' });
    fixture.detectChanges();

    expect(component.availableTimeSlotsForSelectedDate).toEqual([]);
  });

  it('should initialize the form with correct validators', () => {
    expect(component.reservationForm.get('checkInDate')?.hasValidator(Validators.required)).toBe(true);
    expect(component.reservationForm.get('selectedTimeSlot')?.hasValidator(Validators.required)).toBe(true);
  });


  describe('onSubmitReservation', () => {
    beforeEach(() => {
      component.propertyFullViewModel = {
        id: 1,
        name: 'Test Property'
      } as HomeViewModel;

      component.selectedTimeSlotObject = {
        id: 1,
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00'
      } as TimeSlot;

      component.reservationForm.patchValue({
        checkInDate: '2024-01-01',
        selectedTimeSlot: '10:00 - 11:00'
      });
    });

    it('should show required fields message when form is invalid', () => {
      component.reservationForm.setErrors({ 'invalid': true });

      component.onSubmitReservation();

      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

    it('should show required fields message when propertyFullViewModel is null', () => {
      component.propertyFullViewModel = null;

      component.onSubmitReservation();

      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

    it('should display required fields message when form is invalid', () => {
      component.onSubmitReservation();
      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

  });

  describe('selectTimeSlot', () => {
    it('should set selectedTimeSlotObject and update form control with formatted time', () => {
      const mockTimeSlot: TimeSlot = {
        id: 1,
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        homeId: 1,
        sellerId: 1
      };

      component.selectTimeSlot(mockTimeSlot);

      expect(component.selectedTimeSlotObject).toBe(mockTimeSlot);
      expect(component.reservationForm.get('selectedTimeSlot')?.value)
        .toBe('10:00 - 11:00');
    });

    it('should handle time slots with minutes', () => {
      const mockTimeSlot: TimeSlot = {
        id: 2,
        startTime: '2024-01-01T14:30:00',
        endTime: '2024-01-01T15:45:00',
        homeId: 1,
        sellerId: 1
      };

      component.selectTimeSlot(mockTimeSlot);

      expect(component.selectedTimeSlotObject).toBe(mockTimeSlot);
      expect(component.reservationForm.get('selectedTimeSlot')?.value)
        .toBe('14:30 - 15:45');
    });
  });

  it('should show translated success message on booking success', () => {
    component.propertyFullViewModel = { id: 1 } as any;
    component.reservationForm.patchValue({ checkInDate: '2024-01-01', selectedTimeSlot: '1' });
    component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
    component['proceedWithBooking']();
    expect(translationService.translate).toHaveBeenCalledWith('BOOKING_SUCCESS');
    expect(component.confirmationMessage).toBe('Translated: BOOKING_SUCCESS');
  });

  it('should show translated error message on booking error', () => {
    (visitService.createVisit as jest.Mock).mockReturnValue(throwError({ error: { code: 'BOOKING_ERROR' } }));
    component.propertyFullViewModel = { id: 1 } as any;
    component.reservationForm.patchValue({ checkInDate: '2024-01-01', selectedTimeSlot: '1' });
    component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
    component['proceedWithBooking']();
    expect(translationService.translate).toHaveBeenCalledWith('BOOKING_ERROR');
    expect(component.confirmationMessage).toBe('Translated: BOOKING_ERROR');
  });


  describe('when property id is not found', () => {
    it('should navigate to home page', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [VisitPageComponent],
        imports: [ReactiveFormsModule],
        providers: [
          FormBuilder,
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: (key: string) => null }) } },
          { provide: HomeFacadeService, useClass: HomeFacadeServiceStub },
          { provide: AuthService, useClass: AuthServiceStub },
          { provide: VisitService, useClass: VisitServiceStub },
          { provide: TranslationService, useClass: TranslationServiceStub },
          { provide: Router, useClass: RouterStub },
          { provide: ChangeDetectorRef, useClass: ChangeDetectorRef },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      const router = TestBed.inject(Router);
      const fixtureNotFound = TestBed.createComponent(VisitPageComponent);
      fixtureNotFound.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('handleLoginModalClosed', () => {
    beforeEach(() => {
      component['attemptedBookingData'] = {
        propertyId: 1,
        type: 'visit',
        date: '2024-01-01',
        timeSlotId: 1
      };
    });

    it('should close the login modal', () => {
      component.handleLoginModalClosed();

      expect(component.showLoginModalForBooking).toBe(false);
    });

    it('should show ONLY_CUSTOMERS message if role is not CUSTOMER', () => {
      const authServiceInstance = TestBed.inject(AuthService);
      (authServiceInstance.userRole$ as BehaviorSubject<string>).next('SELLER');
      const showConfirmationSpy = jest.spyOn(component as any, 'showConfirmation');

      component.handleLoginModalClosed();

      expect(showConfirmationSpy).toHaveBeenCalledWith(
        VISIT_MESSAGES.ONLY_CUSTOMERS('SELLER'),
        6000
      );
      expect(component['attemptedBookingData']).toBeNull();
    });

    it('should clear attemptedBookingData if no role is provided', () => {
      const authServiceInstance = TestBed.inject(AuthService);
      (authServiceInstance.userRole$ as BehaviorSubject<string>).next('');

      component.handleLoginModalClosed();

      expect(component['attemptedBookingData']).toBeNull();

    });
  });
  describe('changeDate', () => {
    beforeEach(() => {
      component.minSelectableDate = '2024-01-01';
      component.reservationForm.patchValue({
        checkInDate: '2024-01-02'
      });
    });

    it('should do nothing if checkInDate is not set', () => {
      component.reservationForm.patchValue({ checkInDate: null });

      component.changeDate(1);

      expect(component.reservationForm.get('checkInDate')?.value).toBeNull();
    });

    it('should increment the date by the offset', () => {
      component.changeDate(1);

      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-03');
    });

    it('should decrement the date by the offset', () => {
      component.changeDate(-1);

      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-01');
    });

    it('should allow setting a date equal to minSelectableDate', () => {
      component.changeDate(-1);

      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-01');
    });

    it('should allow setting a date later than minSelectableDate', () => {
      component.changeDate(2);

      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-04');
    });
  });

  describe('showConfirmation', () => {
    it('should set the confirmation message immediately', () => {
      component['showConfirmation']('Test Message', 3000);

      expect(component.confirmationMessage).toBe('Test Message');
    });

    it('should clear the confirmation message after the timeout', fakeAsync(() => {
      const cdrSpy = jest.spyOn(component['cdr'], 'detectChanges');

      component['showConfirmation']('Test Message', 3000);
      tick(3000);

      expect(component.confirmationMessage).toBeNull();
      expect(cdrSpy).toHaveBeenCalled();
    }));
  });

  describe('Image navigation', () => {
    beforeEach(() => {
      component.propertyImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      component.currentImageIndex = 0;
    });

    describe('nextImage', () => {
      it('should move to the next image', () => {
        component.nextImage();

        expect(component.currentImageIndex).toBe(1);
      });

      it('should loop back to the first image after the last image', () => {
        component.currentImageIndex = 2;

        component.nextImage();

        expect(component.currentImageIndex).toBe(0);
      });

      it('should do nothing if there are no images', () => {
        component.propertyImages = [];
        component.currentImageIndex = 0;

        component.nextImage();
        expect(component.currentImageIndex).toBe(0);
      });
    });

    describe('prevImage', () => {
      it('should move to the previous image', () => {
        component.currentImageIndex = 1;

        component.prevImage();

        expect(component.currentImageIndex).toBe(0);
      });

      it('should loop back to the last image when at the first image', () => {
        component.currentImageIndex = 0;

        component.prevImage();

        expect(component.currentImageIndex).toBe(2);
      });

      it('should do nothing if there are no images', () => {
        component.propertyImages = [];
        component.currentImageIndex = 0;

        component.prevImage();

        expect(component.currentImageIndex).toBe(0);
      });
    });
  });

  // it('should proceed with booking for CUSTOMER role', () => {
  //   (authService.userRole$ as BehaviorSubject<string | null>).next('CUSTOMER');
  //   const proceedWithBookingSpy = jest.spyOn(component, 'proceedWithBooking');

  //   component.proceedWithBooking();

  //   expect(proceedWithBookingSpy).toHaveBeenCalled();
  //   expect(visitService.createVisit).toHaveBeenCalled();
  // });

  // it('should show login modal for booking when no role is present', () => {
  //   authService.userRole$.next('');
  //   const showLoginModalSpy = jest.spyOn(component, 'showLoginModalForBooking');

  //   component.proceedWithBooking();

  //   expect(showLoginModalSpy).toHaveBeenCalled();
  // });

  // it('should show confirmation after successful booking', () => {
  //   authService.userRole$.next('CUSTOMER');
  //   jest.spyOn(visitService, 'createVisit').mockReturnValue(of({ code: 'BOOKING_SUCCESS', message: 'Booking successful' }));
  //   const showConfirmationSpy = jest.spyOn(component, 'showConfirmation');

  //   component.proceedWithBooking();

  //   expect(showConfirmationSpy).toHaveBeenCalledWith('Booking successful');
  // });
});

