import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, catchError, take } from 'rxjs/operators';

import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';
import { AuthService } from '@app/core/services/auth/auth.service';
import { VisitService } from '@app/core/services/visit/visit.service';

import { Property, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model';
import { TimeSlot, VisitRequest, VisitResponse } from '@app/core/models/time-slot.model';
import { VISIT_MESSAGES } from '@app/shared/constants/messages.constants';
import { TranslationService } from '@app/core/services/translation/translation.service';

export function notBeforeTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [year, month, day] = control.value.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today ? { 'dateBeforeToday': true } : null;
  };
}

@Component({
  selector: 'app-visit-page',
  templateUrl: './visit-page.component.html',
  styleUrls: ['./visit-page.component.scss']
})
export class VisitPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private homeFacade = inject(HomeFacadeService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private visitService = inject(VisitService);
  private translationService = inject(TranslationService);

  public propertyFullViewModel: HomeViewModel | null = null;
  public propertyForDisplay: Property | null = null;
  public propertyImages: string[] = [];
  public currentImageIndex = 0;
  public availableTimeSlotsForSelectedDate: TimeSlot[] = [];
  public isLoadingProperty = true;
  public isLoadingTimeSlots = false;
  public reservationForm!: FormGroup;
  public minSelectableDate = '';
  public selectedDateForSlotsCalendar = '';
  public confirmationMessage: string | null = null;
  public selectedTimeSlotObject: TimeSlot | null = null;
  public showLoginModalForBooking = false;

  private destroy$ = new Subject<void>();
  private attemptedBookingData: Pick<VisitRequest, 'timeSlotId'> & { propertyId: number | string, type: 'visit', date: string } | null = null;

  ngOnInit(): void {
    this.initDatesAndForm();
    this.loadPropertyDetails();
    this.subscribeToCheckInDateChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDatesAndForm(): void {
    const today = new Date();
    this.minSelectableDate = today.toISOString().split('T')[0];
    this.selectedDateForSlotsCalendar = this.minSelectableDate;
    this.reservationForm = this.fb.group({
      checkInDate: [this.minSelectableDate, [Validators.required, notBeforeTodayValidator()]],
      selectedTimeSlot: [null, Validators.required]
    });
  }

  public selectTimeSlot(slot: TimeSlot): void {
    this.selectedTimeSlotObject = slot;
    this.reservationForm.get('selectedTimeSlot')?.setValue(this.getSlotLabel(slot));
  }

  public onSubmitReservation(): void {
    this.reservationForm.markAllAsTouched();
    if (this.reservationForm.invalid || !this.propertyFullViewModel) {
      this.showConfirmation(VISIT_MESSAGES.FILL_REQUIRED_FIELDS, 3000);
      return;
    }

    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (!role) {
        this.attemptedBookingData = {
          propertyId: this.propertyFullViewModel!.id,
          type: 'visit',
          date: this.reservationForm.value.checkInDate,
          timeSlotId: this.selectedTimeSlotObject ? this.selectedTimeSlotObject.id : undefined,
        };
        this.showLoginModalForBooking = true;
      } else if (role === 'CUSTOMER') {
        this.proceedWithBooking();
      } else {
        this.showConfirmation(VISIT_MESSAGES.LOGIN_AS_CUSTOMER, 5000);
      }
    });
  }

  public handleLoginModalClosed(): void {
    this.showLoginModalForBooking = false;
    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (this.attemptedBookingData) {
        if (role === 'CUSTOMER') {
          this.proceedWithBooking(this.attemptedBookingData);
        } else if (role) {
          this.showConfirmation(VISIT_MESSAGES.ONLY_CUSTOMERS(role), 6000);
          this.attemptedBookingData = null;
        } else {
          this.attemptedBookingData = null;
        }
      }
    });
  }

  public getSlotLabel(slot: { startTime: string | Date; endTime: string | Date }): string {
    const start = typeof slot.startTime === 'string' ? new Date(slot.startTime) : slot.startTime;
    const end = typeof slot.endTime === 'string' ? new Date(slot.endTime) : slot.endTime;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  public nextImage(): void {
    if (this.propertyImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.propertyImages.length;
    }
  }

  public prevImage(): void {
    if (this.propertyImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.propertyImages.length) % this.propertyImages.length;
    }
  }

  public changeDate(offset: number): void {
    const currentDateStr = this.reservationForm.get('checkInDate')?.value;
    if (!currentDateStr) return;

    const currentDate = new Date(currentDateStr + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + offset);

    const todayLimit = new Date(this.minSelectableDate + 'T00:00:00');
    if (currentDate >= todayLimit) {
      const newDateStr = currentDate.toISOString().split('T')[0];
      this.reservationForm.get('checkInDate')?.setValue(newDateStr);
    }
  }

  public isPrevDayDisabled(): boolean {
    const currentDateStr = this.reservationForm.get('checkInDate')?.value;
    if (!currentDateStr) return true;
    const currentDate = new Date(currentDateStr + 'T00:00:00');
    const todayLimit = new Date(this.minSelectableDate + 'T00:00:00');
    return currentDate <= todayLimit;
  }

  private loadPropertyDetails(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const propertyIdParam = params.get('id');
        if (!propertyIdParam) {
          this.isLoadingProperty = false;
          this.router.navigate(['/']);
          return of(null);
        }
        this.isLoadingProperty = true;
        const detailFilters = { homeId: propertyIdParam, page: 0, size: 1 };
        return this.homeFacade.getHomesWithAvailability(detailFilters, false).pipe(
          catchError(err => {
            this.isLoadingProperty = false;
            this.router.navigate(['/']);
            return of(null);
          })
        );
      })
    ).subscribe((paginatedResponse: PaginatedHomeViewModel | null) => {
      if (paginatedResponse?.items?.length) {
        this.propertyFullViewModel = paginatedResponse.items[0];
        this.propertyForDisplay = this.mapHomeViewModelToPropertyForDisplay(this.propertyFullViewModel);
        this.propertyImages = this.propertyFullViewModel.image
          ? [this.propertyFullViewModel.image, ...this.getPlaceholderImages(2, "Galería")]
          : this.getPlaceholderImages(3, "Propiedad");
        this.updateDisplayableTimeSlotsForDate(this.selectedDateForSlotsCalendar);
      }
      this.isLoadingProperty = false;
      this.cdr.detectChanges();
    });
  }

  private subscribeToCheckInDateChanges(): void {
    this.reservationForm.get('checkInDate')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(date => {
      if (date && this.propertyFullViewModel) {
        this.selectedDateForSlotsCalendar = date;
        this.updateDisplayableTimeSlotsForDate(date);
        this.reservationForm.get('selectedTimeSlot')?.reset();
        this.selectedTimeSlotObject = null;
      }
    });
  }

  private mapHomeViewModelToPropertyForDisplay(vm: HomeViewModel): Property {
    let finalType: 'sale' | 'rent' | string = 'unknown';
    if (vm.type === 'sale' || vm.type === 'rent') {
      finalType = vm.type;
    } else if (typeof vm.type === 'string' && vm.type.trim() !== '') {
      finalType = vm.type;
    }
    return {
      id: vm.id,
      name: vm.name,
      image: vm.image,
      type: finalType,
      cityName: vm.cityName,
      departmentName: vm.departmentName,
      neighborhood: vm.neighborhood,
      price: vm.price,
      category: vm.category,
      numberOfRooms: vm.numberOfRooms,
      numberOfBathrooms: vm.numberOfBathrooms,
      activePublicationDate: vm.activePublicationDate,
      hasTimeSlots: vm.hasTimeSlots,
      timeSlots: vm.timeSlots || [],
      description: vm.description || 'Descripción no disponible.',
    };
  }

  private updateDisplayableTimeSlotsForDate(dateString: string): void {
    if (!this.propertyFullViewModel?.timeSlots || !dateString) {
      this.availableTimeSlotsForSelectedDate = [];
    } else {
      const selectedDate = new Date(dateString + "T00:00:00");
      this.availableTimeSlotsForSelectedDate = this.propertyFullViewModel.timeSlots.filter(slot => {
        const slotStartDate = new Date(slot.startTime);
        return slotStartDate.getFullYear() === selectedDate.getFullYear() &&
          slotStartDate.getMonth() === selectedDate.getMonth() &&
          slotStartDate.getDate() === selectedDate.getDate();
      });
    }
    this.cdr.detectChanges();
  }

  private proceedWithBooking(bookingData?: Pick<VisitRequest, 'timeSlotId'> & { propertyId: number | string, type: 'visit', date: string } | null): void {
    const dataForPayload = bookingData || {
      propertyId: this.propertyFullViewModel!.id,
      type: 'visit',
      date: this.reservationForm.value.checkInDate,
      timeSlotId: this.selectedTimeSlotObject?.id,
    };

    if (typeof dataForPayload.timeSlotId === 'number') {
      const visitPayload: VisitRequest = {
        timeSlotId: dataForPayload.timeSlotId
      };
      this.visitService.createVisit(visitPayload).subscribe({
        next: (response: VisitResponse) => {
          const msg = response.code
            ? this.translationService.translate(response.code)
            : VISIT_MESSAGES.BOOKING_SUCCESS;
          this.showConfirmation(msg, 5000);
          this.resetFormAndSelections();
        },
        error: (error) => {
          const code = error?.error?.code;
          const msg = code
            ? this.translationService.translate(code)
            : VISIT_MESSAGES.BOOKING_ERROR;
          this.showConfirmation(msg, 7000);
        }
      });
    } else {
      this.showConfirmation(VISIT_MESSAGES.INVALID_SLOT, 7000);
      this.resetFormAndSelections();
    }
  }

  private showConfirmation(message: string, timeout: number): void {
    this.confirmationMessage = message;
    setTimeout(() => {
      this.confirmationMessage = null;
      this.cdr.detectChanges();
    }, timeout);
  }

  private resetFormAndSelections(): void {
    this.reservationForm.reset({
      checkInDate: this.minSelectableDate,
      selectedTimeSlot: null
    });
    this.selectedTimeSlotObject = null;
    this.attemptedBookingData = null;
    this.cdr.detectChanges();
  }

  private getPlaceholderImages(count: number, textPrefix: string = "Imagen"): string[] {
    return Array.from({ length: count }, (_, i) =>
      `https://placehold.co/800x400/E0E0E0/333333?text=${encodeURIComponent(textPrefix)}+${i + 1}`
    );
  }
}
