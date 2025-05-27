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

  // it('should handle API error when loading property', fakeAsync(() => {
  //   const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

  //   // Mockear el error antes de llamar a ngOnInit
  //   (homeFacadeService.getHomesWithAvailability as jest.Mock).mockReturnValue(
  //     throwError(() => new Error('API Error'))
  //   );

  //   // Crear nuevo componente después de mockear
  //   fixture = TestBed.createComponent(VisitPageComponent);
  //   component = fixture.componentInstance;
  //   component.ngOnInit();
  //   tick();

  //   expect(consoleSpy).toHaveBeenCalledWith('Error cargando propiedades:', expect.any(Error));
  //   consoleSpy.mockRestore();
  // }));

  // it('should reset form and messages', () => {
  //   component.reservationForm.patchValue({ checkInDate: '2024-01-01' });
  //   component.confirmationMessage = 'Test message';

  //   component.resetForm();

  //   expect(component.reservationForm.pristine).toBe(true);
  //   expect(component.confirmationMessage).toBe('');
  // });

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

  // it('should handle time slot selection validation', () => {
  //   // Establecer todos los campos requeridos
  //   component.reservationForm.patchValue({
  //     checkInDate: '2024-01-01',
  //     selectedTimeSlot: '10:00 - 11:00'
  //   });

  //   // Asignar el slot object
  //   component.selectedTimeSlotObject = {
  //     id: 1,
  //     startTime: '2024-01-01T10:00:00',
  //     endTime: '2024-01-01T11:00:00',
  //     homeId: 1,
  //     sellerId: 1
  //   } as TimeSlot;

  //   fixture.detectChanges();
  //   expect(component.reservationForm.valid).toBe(true);
  // });

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
      // Setup base test data
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
      // Arrange
      component.reservationForm.setErrors({ 'invalid': true });

      // Act
      component.onSubmitReservation();

      // Assert
      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

    it('should show required fields message when propertyFullViewModel is null', () => {
      // Arrange
      component.propertyFullViewModel = null;

      // Act
      component.onSubmitReservation();

      // Assert
      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

    // it('should show login modal when user is not logged in', fakeAsync(() => {
    //   // Configurar el formulario y datos necesarios
    //   component.propertyFullViewModel = { id: 1 } as HomeViewModel;
    //   component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
    //   component.reservationForm.patchValue({
    //     checkInDate: '2024-01-01',
    //     selectedTimeSlot: '10:00 - 11:00'
    //   });

    //   // Asegurar que el formulario sea válido
    //   expect(component.reservationForm.valid).toBe(true);

    //   // Configurar el auth service
    //   const authServiceInstance = TestBed.inject(AuthService);
    //   (authServiceInstance.userRole$ as BehaviorSubject<string>).next('');

    //   component.onSubmitReservation();
    //   tick(); // Esperar a que se resuelva el observable
    //   fixture.detectChanges();

    //   expect(component.showLoginModalForBooking).toBe(true);
    // }));

    // it('should proceed with booking when user is a customer', fakeAsync(() => {
    //   // Configurar el formulario y datos necesarios
    //   component.propertyFullViewModel = { id: 1 } as HomeViewModel;
    //   component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
    //   component.reservationForm.patchValue({
    //     checkInDate: '2024-01-01',
    //     selectedTimeSlot: '10:00 - 11:00'
    //   });

    //   // Asegurar que el formulario sea válido
    //   expect(component.reservationForm.valid).toBe(true);

    //   // Configurar auth service como CUSTOMER
    //   const authServiceInstance = TestBed.inject(AuthService);
    //   (authServiceInstance.userRole$ as BehaviorSubject<string>).next('CUSTOMER');

    //   // Espiar el método privado
    //   const proceedWithBookingSpy = jest.spyOn(component as any, 'proceedWithBooking');

    //   component.onSubmitReservation();
    //   tick();
    //   fixture.detectChanges();

    //   expect(proceedWithBookingSpy).toHaveBeenCalled();
    // }));

    // it('should show login as customer message for non-customer roles', fakeAsync(() => {
    //   // Configurar el formulario y datos necesarios
    //   component.propertyFullViewModel = { id: 1 } as HomeViewModel;
    //   component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
    //   component.reservationForm.patchValue({
    //     checkInDate: '2024-01-01',
    //     selectedTimeSlot: '10:00 - 11:00'
    //   });

    //   // Asegurar que el formulario sea válido
    //   expect(component.reservationForm.valid).toBe(true);

    //   // Configurar auth service como SELLER
    //   const authServiceInstance = TestBed.inject(AuthService);
    //   (authServiceInstance.userRole$ as BehaviorSubject<string>).next('SELLER');

    //   component.onSubmitReservation();
    //   tick();
    //   fixture.detectChanges();

    //   expect(component.confirmationMessage).toBe(VISIT_MESSAGES.LOGIN_AS_CUSTOMER);
    // }));

    it('should display required fields message when form is invalid', () => {
      component.onSubmitReservation();
      expect(component.confirmationMessage).toBe(VISIT_MESSAGES.FILL_REQUIRED_FIELDS);
    });

  });

  describe('selectTimeSlot', () => {
    it('should set selectedTimeSlotObject and update form control with formatted time', () => {
      // Arrange
      const mockTimeSlot: TimeSlot = {
        id: 1,
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        homeId: 1,
        sellerId: 1
      };

      // Act
      component.selectTimeSlot(mockTimeSlot);

      // Assert
      expect(component.selectedTimeSlotObject).toBe(mockTimeSlot);
      expect(component.reservationForm.get('selectedTimeSlot')?.value)
        .toBe('10:00 - 11:00');
    });

    it('should handle time slots with minutes', () => {
      // Arrange
      const mockTimeSlot: TimeSlot = {
        id: 2,
        startTime: '2024-01-01T14:30:00',
        endTime: '2024-01-01T15:45:00',
        homeId: 1,
        sellerId: 1
      };

      // Act
      component.selectTimeSlot(mockTimeSlot);

      // Assert
      expect(component.selectedTimeSlotObject).toBe(mockTimeSlot);
      expect(component.reservationForm.get('selectedTimeSlot')?.value)
        .toBe('14:30 - 15:45');
    });
  });

  // it('should show login modal when user is not logged in', () => {
  //   const authServiceInstance = TestBed.inject(AuthService) as any;
  //   authServiceInstance.userRole$ = new BehaviorSubject<string>(''); // Usar BehaviorSubject
  //   fixture = TestBed.createComponent(VisitPageComponent);
  //   component = fixture.componentInstance;
  //   fixture.detectChanges();

  //   component.propertyFullViewModel = { id: 1 } as any;
  //   component.reservationForm.patchValue({ checkInDate: '2024-01-01', selectedTimeSlot: '1' });
  //   component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
  //   component.onSubmitReservation();
  //   expect(component.showLoginModalForBooking).toBe(true);
  // });

  // it('should proceed with booking when user is a customer', () => {
  //   const authServiceInstance = TestBed.inject(AuthService) as any;
  //   authServiceInstance.userRole$ = new BehaviorSubject<string>('CUSTOMER'); // Usar BehaviorSubject
  //   fixture = TestBed.createComponent(VisitPageComponent);
  //   component = fixture.componentInstance;
  //   fixture.detectChanges();

  //   component.propertyFullViewModel = { id: 1 } as any;
  //   component.reservationForm.patchValue({ checkInDate: '2024-01-01', selectedTimeSlot: '1' });
  //   component.selectedTimeSlotObject = { id: 1 } as TimeSlot;
  //   component.onSubmitReservation();
  //   expect(visitService.createVisit).toHaveBeenCalled();
  // });

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



  // it('should update availableTimeSlotsForSelectedDate when date changes', fakeAsync(() => {
  //   const timeSlots: TimeSlot[] = [{ id: 1, startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00', homeId: 1, sellerId: 1 }];
  //   component.propertyFullViewModel = { id: 1, timeSlots: timeSlots } as any;
  //   component.ngOnInit();
  //   component.reservationForm.get('checkInDate')?.setValue('2024-01-01');
  //   tick(100);
  //   expect(component.availableTimeSlotsForSelectedDate).toEqual(timeSlots);
  // }));

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
      // Act
      component.handleLoginModalClosed();

      // Assert
      expect(component.showLoginModalForBooking).toBe(false);
    });

    // it('should proceed with booking if role is CUSTOMER', () => {
    //   // Arrange
    //   const authServiceInstance = TestBed.inject(AuthService);
    //   (authServiceInstance.userRole$ as BehaviorSubject<string>).next('CUSTOMER');
    //   const proceedWithBookingSpy = jest.spyOn(component as any, 'proceedWithBooking');

    //   // Act
    //   component.handleLoginModalClosed();

    //   // Assert
    //   expect(proceedWithBookingSpy).toHaveBeenCalledWith(component['attemptedBookingData']);
    // });

    it('should show ONLY_CUSTOMERS message if role is not CUSTOMER', () => {
      // Arrange
      const authServiceInstance = TestBed.inject(AuthService);
      (authServiceInstance.userRole$ as BehaviorSubject<string>).next('SELLER');
      const showConfirmationSpy = jest.spyOn(component as any, 'showConfirmation');

      // Act
      component.handleLoginModalClosed();

      // Assert
      expect(showConfirmationSpy).toHaveBeenCalledWith(
        VISIT_MESSAGES.ONLY_CUSTOMERS('SELLER'),
        6000
      );
      expect(component['attemptedBookingData']).toBeNull();
    });

    it('should clear attemptedBookingData if no role is provided', () => {
      // Arrange
      const authServiceInstance = TestBed.inject(AuthService);
      (authServiceInstance.userRole$ as BehaviorSubject<string>).next('');

      // Act
      component.handleLoginModalClosed();

      // Assert
      expect(component['attemptedBookingData']).toBeNull();

    });
  });
  describe('changeDate', () => {
    beforeEach(() => {
      // Inicializar el formulario y la fecha mínima seleccionable
      component.minSelectableDate = '2024-01-01';
      component.reservationForm.patchValue({
        checkInDate: '2024-01-02'
      });
    });

    it('should do nothing if checkInDate is not set', () => {
      // Arrange
      component.reservationForm.patchValue({ checkInDate: null });

      // Act
      component.changeDate(1);

      // Assert
      expect(component.reservationForm.get('checkInDate')?.value).toBeNull();
    });

    it('should increment the date by the offset', () => {
      // Act
      component.changeDate(1);

      // Assert
      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-03');
    });

    it('should decrement the date by the offset', () => {
      // Act
      component.changeDate(-1);

      // Assert
      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-01');
    });

    // it('should not set a date earlier than minSelectableDate', () => {
    //   // Act
    //   component.changeDate(-2);

    //   // Assert
    //   expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-01');
    // });

    it('should allow setting a date equal to minSelectableDate', () => {
      // Act
      component.changeDate(-1);

      // Assert
      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-01');
    });

    it('should allow setting a date later than minSelectableDate', () => {
      // Act
      component.changeDate(2);

      // Assert
      expect(component.reservationForm.get('checkInDate')?.value).toBe('2024-01-04');
    });
  });

  describe('showConfirmation', () => {
    it('should set the confirmation message immediately', () => {
      // Act
      component['showConfirmation']('Test Message', 3000);

      // Assert
      expect(component.confirmationMessage).toBe('Test Message');
    });

    it('should clear the confirmation message after the timeout', fakeAsync(() => {
      // Arrange
      const cdrSpy = jest.spyOn(component['cdr'], 'detectChanges');

      // Act
      component['showConfirmation']('Test Message', 3000);
      tick(3000); // Avanzar el tiempo

      // Assert
      expect(component.confirmationMessage).toBeNull();
      expect(cdrSpy).toHaveBeenCalled();
    }));

    // it('should not clear the confirmation message before the timeout', fakeAsync(() => {
    //   // Act
    //   component['showConfirmation']('Test Message', 3000);
    //   tick(2000); // Avanzar menos tiempo que el timeout

    //   // Assert
    //   expect(component.confirmationMessage).toBe('Test Message');
    // }));

  });

  describe('Image navigation', () => {
    beforeEach(() => {
      component.propertyImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      component.currentImageIndex = 0; // Inicializar en la primera imagen
    });

    describe('nextImage', () => {
      it('should move to the next image', () => {
        // Act
        component.nextImage();

        // Assert
        expect(component.currentImageIndex).toBe(1);
      });

      it('should loop back to the first image after the last image', () => {
        // Arrange
        component.currentImageIndex = 2; // Última imagen

        // Act
        component.nextImage();

        // Assert
        expect(component.currentImageIndex).toBe(0);
      });

      it('should do nothing if there are no images', () => {
        // Arrange
        component.propertyImages = [];
        component.currentImageIndex = 0;

        // Act
        component.nextImage();

        // Assert
        expect(component.currentImageIndex).toBe(0);
      });
    });

    describe('prevImage', () => {
      it('should move to the previous image', () => {
        // Arrange
        component.currentImageIndex = 1;

        // Act
        component.prevImage();

        // Assert
        expect(component.currentImageIndex).toBe(0);
      });

      it('should loop back to the last image when at the first image', () => {
        // Arrange
        component.currentImageIndex = 0;

        // Act
        component.prevImage();

        // Assert
        expect(component.currentImageIndex).toBe(2); // Última imagen
      });

      it('should do nothing if there are no images', () => {
        // Arrange
        component.propertyImages = [];
        component.currentImageIndex = 0;

        // Act
        component.prevImage();

        // Assert
        expect(component.currentImageIndex).toBe(0);
      });
    });
  });

  // describe('onSubmitReservation', () => {
  //   beforeEach(() => {
  //     // Configurar datos iniciales
  //     component.propertyFullViewModel = {
  //       id: 1,
  //       name: 'Test Property'
  //     } as HomeViewModel;

  //     component.selectedTimeSlotObject = {
  //       id: 1,
  //       startTime: '2024-01-01T10:00:00',
  //       endTime: '2024-01-01T11:00:00'
  //     } as TimeSlot;

  //     component.reservationForm.patchValue({
  //       checkInDate: '2024-01-01',
  //       selectedTimeSlot: '10:00 - 11:00'
  //     });
  //   });

  //   it('should show login modal when user is not logged in', fakeAsync(() => {
  //     // Configurar el authService para simular usuario deslogueado
  //     const authServiceInstance = TestBed.inject(AuthService);
  //     (authServiceInstance.userRole$ as BehaviorSubject<string>).next('');

  //     // Actuar
  //     component.onSubmitReservation();
  //     tick(); // Avanzar el tiempo para resolver el observable

  //     // Asegurar que se muestra el modal de login
  //     expect(component.showLoginModalForBooking).toBe(true);
  //   }));

  //   it('should proceed with booking when user is a customer', fakeAsync(() => {
  //     // Configurar el authService para simular usuario CUSTOMER
  //     const authServiceInstance = TestBed.inject(AuthService);
  //     (authServiceInstance.userRole$ as BehaviorSubject<string>).next('CUSTOMER');

  //     // Espiar el método privado proceedWithBooking
  //     const proceedWithBookingSpy = jest.spyOn(component as any, 'proceedWithBooking');

  //     // Actuar
  //     component.onSubmitReservation();
  //     tick(); // Avanzar el tiempo para resolver el observable

  //     // Asegurar que se llama a proceedWithBooking
  //     expect(proceedWithBookingSpy).toHaveBeenCalled();
  //   }));

  //   it('should show login as customer message for non-customer roles', fakeAsync(() => {
  //     // Configurar el authService para simular usuario con rol diferente a CUSTOMER
  //     const authServiceInstance = TestBed.inject(AuthService);
  //     (authServiceInstance.userRole$ as BehaviorSubject<string>).next('SELLER');

  //     // Actuar
  //     component.onSubmitReservation();
  //     tick(); // Avanzar el tiempo para resolver el observable

  //     // Asegurar que se muestra el mensaje de login como CUSTOMER
  //     expect(component.confirmationMessage).toBe(VISIT_MESSAGES.LOGIN_AS_CUSTOMER);
  //   }));
  // });

});

// aquí 86%
