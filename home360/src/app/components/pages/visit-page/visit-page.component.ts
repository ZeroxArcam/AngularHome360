import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'; // FormControl no es necesario importar explícitamente aquí si no se usa directamente en la clase para crear instancias fuera de FormBuilder
import { Subject, of } from 'rxjs'; // Observable no es necesario importar explícitamente si solo se usa como tipo de retorno de métodos de servicio
import { takeUntil, switchMap, map, catchError, take } from 'rxjs/operators'; // tap no se está usando

import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';
import { AuthService } from '@app/core/services/auth/auth.service';
import { VisitService } from '@app/core/services/visit/visit.service';

import { Property, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model';
import { TimeSlot, VisitRequest, VisitResponse } from '@app/core/models/time-slot.model';

export function notBeforeTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const controlDateParts = control.value.split('-');
    const year = parseInt(controlDateParts[0], 10);
    const month = parseInt(controlDateParts[1], 10) - 1;
    const day = parseInt(controlDateParts[2], 10);
    const selectedDate = new Date(year, month, day); selectedDate.setHours(0, 0, 0, 0);
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

  public propertyFullViewModel: HomeViewModel | null = null;
  public propertyForDisplay: Property | null = null;
  public propertyImages: string[] = [];
  public currentImageIndex: number = 0;
  public availableTimeSlotsForSelectedDate: TimeSlot[] = [];
  public isLoadingProperty: boolean = true;
  public isLoadingTimeSlots: boolean = false;
  public reservationForm: FormGroup;
  public minSelectableDate: string = '';
  public selectedDateForSlotsCalendar: string = '';
  public confirmationMessage: string | null = null;
  public selectedTimeSlotObject: TimeSlot | null = null;
  public showLoginModalForBooking: boolean = false;

  private destroy$ = new Subject<void>();
  private attemptedBookingData: Pick<VisitRequest, 'timeSlotId'> & { propertyId: number | string, type: 'visit', date: string } | null = null;


  constructor() {
    const today = new Date();
    this.minSelectableDate = today.toISOString().split('T')[0];
    this.selectedDateForSlotsCalendar = this.minSelectableDate;

    this.reservationForm = this.fb.group({
      checkInDate: [this.minSelectableDate, [Validators.required, notBeforeTodayValidator()]],
      selectedTimeSlot: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPropertyDetails();
    this.subscribeToCheckInDateChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  public selectTimeSlot(slot: TimeSlot): void {
    this.selectedTimeSlotObject = slot;
    this.reservationForm.get('selectedTimeSlot')?.setValue(this.getSlotLabel(slot));
    console.log('Objeto TimeSlot seleccionado:', this.selectedTimeSlotObject);
    if (this.selectedTimeSlotObject) {
      console.log('ID del TimeSlot seleccionado:', this.selectedTimeSlotObject.id);
    }
  }

  public onSubmitReservation(): void {
    this.reservationForm.markAllAsTouched();
    if (this.reservationForm.invalid || !this.propertyFullViewModel) {
      console.log('Formulario inválido o propiedad no cargada.');
      this.confirmationMessage = 'Por favor, completa todos los campos requeridos.';
      setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 3000);
      return;
    }

    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (!role) {
        console.log('Usuario no logueado. Mostrando modal de login...');
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
        console.warn('Usuario logueado pero no es CUSTOMER. Rol:', role);
        this.confirmationMessage = 'Debes iniciar sesión como COMPRADOR para poder agendar una visita.';
        setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  public handleLoginModalClosed(): void {
    this.showLoginModalForBooking = false;
    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (this.attemptedBookingData) {
        if (role === 'CUSTOMER') {
          console.log('Login exitoso como CUSTOMER, reintentando reserva...');
          this.proceedWithBooking(this.attemptedBookingData);
        } else if (role) {
          console.warn('Login exitoso pero no como CUSTOMER. Rol:', role, 'Reserva no realizada.');
          this.confirmationMessage = `Has iniciado sesión como ${role}. Solo los COMPRADORES pueden agendar visitas.`;
          setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 6000);
          this.attemptedBookingData = null;
        } else {
          console.log('Modal de login cerrado, usuario no logueado. Reserva no completada.');
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
          console.error('Property ID not found in route');
          this.router.navigate(['/']);
          return of(null);
        }
        this.isLoadingProperty = true;
        const detailFilters = { homeId: propertyIdParam, page: 0, size: 1 };
        return this.homeFacade.getHomesWithAvailability(detailFilters, false).pipe(
          catchError(err => {
            console.error('Error fetching property details:', err);
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
      } else if (!this.isLoadingProperty) {
        console.log('Propiedad no encontrada o error previo.');
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
      const selectedDate = new Date(dateString + "T00:00:00"); // Normalizar
      this.availableTimeSlotsForSelectedDate = this.propertyFullViewModel.timeSlots.filter(slot => {
        const slotStartDate = new Date(slot.startTime);
        return slotStartDate.getFullYear() === selectedDate.getFullYear() &&
          slotStartDate.getMonth() === selectedDate.getMonth() &&
          slotStartDate.getDate() === selectedDate.getDate();
      });
    }
    console.log(`Slots para ${dateString}:`, this.availableTimeSlotsForSelectedDate);
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
      console.log('Enviando solicitud para crear visita con payload:', visitPayload);
      this.visitService.createVisit(visitPayload).subscribe({
        next: (response: VisitResponse) => {
          console.log('Respuesta del servicio createVisit:', response);
          this.confirmationMessage = response.message || '¡Visita agendada con éxito!';
          setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 5000);
          this.resetFormAndSelections();
        },
        error: (error) => {
          console.error('Error al agendar la visita:', error);
          const backendErrorMessage = error?.error?.message || error?.message;
          this.confirmationMessage = backendErrorMessage
            ? `Error al agendar: ${backendErrorMessage}`
            : 'Ocurrió un error al agendar la visita. Por favor, inténtalo de nuevo.';
          setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 7000);
        }
      });
    } else {
      console.warn('Intento de reserva inválido. TimeSlot ID no es un número válido o está ausente.', dataForPayload.timeSlotId);
      this.confirmationMessage = 'Error: El horario seleccionado no es válido. Por favor, selecciona un horario.';
      setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 7000);
      this.resetFormAndSelections();
    }
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
    const placeholders: string[] = [];
    for (let i = 0; i < count; i++) {
      placeholders.push(`https://placehold.co/800x400/E0E0E0/333333?text=${encodeURIComponent(textPrefix)}+${i + 1}`);
    }
    return placeholders;
  }
}
