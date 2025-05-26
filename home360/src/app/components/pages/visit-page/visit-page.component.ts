import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError, tap, take } from 'rxjs/operators';

import { HomeFacadeService } from '@app/core/services/home-facade/home-facade.service';

import { Property, HomeViewModel, PaginatedHomeViewModel } from '@app/core/models/home.model';
import { TimeSlot, VisitRequest, VisitResponse } from '@app/core/models/time-slot.model';
import { AuthService } from '@app/core/services/auth/auth.service';
import { VisitService } from '@app/core/services/visit/visit.service';

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

  private destroy$ = new Subject<void>();
  public selectedTimeSlotObject: TimeSlot | null = null;
  public showLoginModalForBooking: boolean = false;
  private attemptedBookingData: any = null;

  propertyFullViewModel: HomeViewModel | null = null;
  propertyForDisplay: Property | null = null;
  propertyImages: string[] = [];
  currentImageIndex: number = 0;

  // availableTimeSlots se llenará por la lógica del calendario o por los slots iniciales en propertyFullViewModel
  availableTimeSlotsForSelectedDate: TimeSlot[] = [];
  isLoadingProperty: boolean = true;
  isLoadingTimeSlots: boolean = false;

  reservationForm: FormGroup;

  minSelectableDate: string = '';
  selectedDateForSlotsCalendar: string = ''; // Para el calendario de la página de visita

  confirmationMessage: string | null = null;

  constructor() {
    const today = new Date();
    this.minSelectableDate = today.toISOString().split('T')[0];
    this.selectedDateForSlotsCalendar = this.minSelectableDate;

    this.reservationForm = this.fb.group({
      reservationType: ['visit', Validators.required],
      checkInDate: [this.minSelectableDate, [Validators.required, notBeforeTodayValidator()]],
      checkOutDate: [null, [notBeforeTodayValidator()]], // Añadir validador aquí también
      selectedTimeSlot: [null]
    });
  }

  ngOnInit(): void {
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
        const propertyId = propertyIdParam; // Puede ser string o number según tu ruta
        this.isLoadingProperty = true;

        const detailFilters = {
          homeId: propertyId,
          page: 0,
          size: 1,
          // No pasamos startTime/endTime aquí para que el facade use su lógica de
          // carga de slots por defecto para el homeId especificado.
          // componentRequestsFilteringByTime será false.
        };
        // Usamos el método existente getHomesWithAvailability
        return this.homeFacade.getHomesWithAvailability(detailFilters, false).pipe(
          catchError(err => {
            console.error('Error fetching property details via getHomesWithAvailability:', err);
            this.isLoadingProperty = false;
            this.router.navigate(['/']);
            return of(null);
          })
        );
      })
    ).subscribe((paginatedResponse: PaginatedHomeViewModel | null) => {
      if (paginatedResponse && paginatedResponse.items && paginatedResponse.items.length > 0) {
        this.propertyFullViewModel = paginatedResponse.items[0];
        this.propertyForDisplay = this.mapHomeViewModelToPropertyForDisplay(this.propertyFullViewModel); // Mapear a la interfaz Property si es necesario para el template

        this.propertyImages = this.propertyFullViewModel.image ?
          [this.propertyFullViewModel.image, ...this.getPlaceholderImages(2, "Galería")] :
          this.getPlaceholderImages(3, "Propiedad");
        this.currentImageIndex = 0;

        // Los timeSlots ya vienen poblados en propertyFullViewModel.timeSlots
        // Estos son los generales (ej. próximas 3 semanas).
        // Los mostramos o usamos para el día seleccionado por defecto.
        this.updateDisplayableTimeSlotsForDate(this.selectedDateForSlotsCalendar);

        this.reservationForm.get('reservationType')?.valueChanges.pipe(takeUntil(this.destroy$))
          .subscribe(type => this.onReservationTypeChange(type as 'visit' | 'book'));
        this.onReservationTypeChange(this.reservationForm.get('reservationType')?.value);

        this.reservationForm.get('checkInDate')?.valueChanges.pipe(takeUntil(this.destroy$))
          .subscribe(date => {
            if (date && this.propertyFullViewModel) {
              this.selectedDateForSlotsCalendar = date;
              // Actualizar los slots específicamente para esta nueva fecha
              this.updateDisplayableTimeSlotsForDate(date);
              this.reservationForm.get('selectedTimeSlot')?.reset();
            }
          });
      } else if (paginatedResponse === null && !this.isLoadingProperty) {
        // Error ya manejado en el catchError o propiedad no encontrada
        console.log('Propiedad no encontrada o error previo.');
      }
      this.isLoadingProperty = false;
      this.cdr.detectChanges();
    });
  }

  // Mapeo si la estructura que usa el template (`Property`) es ligeramente diferente de `HomeViewModel`
  // o si quieres asegurar ciertas propiedades.
  private mapHomeViewModelToPropertyForDisplay(vm: HomeViewModel): Property {
    let finalType: 'sale' | 'rent' | string;
    if (vm.type === 'sale' || vm.type === 'rent') {
      finalType = vm.type;
    } else if (typeof vm.type === 'string' && vm.type.trim() !== '') {
      finalType = vm.type;
    } else {
      finalType = 'unknown';
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
      // areaSqFt: vm.areaSqFt,
      activePublicationDate: vm.activePublicationDate,
      hasTimeSlots: vm.hasTimeSlots,
      timeSlots: vm.timeSlots || [], // Asegurar que es un array
      // Añade aquí las propiedades que tu template espera de `Property`
      description: (vm as any).description || 'Descripción no disponible.',
      // amenities: (vm as any).amenities || [],
    };
  }

  // Este método ahora filtra los slots ya cargados en propertyFullViewModel para la fecha seleccionada
  updateDisplayableTimeSlotsForDate(dateString: string): void {
    if (!this.propertyFullViewModel || !this.propertyFullViewModel.timeSlots || !dateString) {
      this.availableTimeSlotsForSelectedDate = [];
      this.cdr.detectChanges();
      return;
    }

    const selectedDate = new Date(dateString + "T00:00:00"); // Normalizar a inicio del día para comparación

    this.availableTimeSlotsForSelectedDate = this.propertyFullViewModel.timeSlots.filter(slot => {
      const slotStartDate = new Date(slot.startTime);
      // Comparar solo la parte de la fecha
      return slotStartDate.getFullYear() === selectedDate.getFullYear() &&
        slotStartDate.getMonth() === selectedDate.getMonth() &&
        slotStartDate.getDate() === selectedDate.getDate();
    });
    console.log(`Slots para ${dateString}:`, this.availableTimeSlotsForSelectedDate);
    this.cdr.detectChanges();
  }

  getSlotLabel(slot: { startTime: string | Date; endTime: string | Date }): string {
    // Ensure startTime and endTime are Date objects
    const start = typeof slot.startTime === 'string' ? new Date(slot.startTime) : slot.startTime;
    const end = typeof slot.endTime === 'string' ? new Date(slot.endTime) : slot.endTime;
    // Format as "HH:mm - HH:mm"
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }
  onReservationTypeChange(type: 'visit' | 'book'): void {
    const checkOutDateControl = this.reservationForm.get('checkOutDate');
    const selectedTimeSlotControl = this.reservationForm.get('selectedTimeSlot');

    if (type === 'book') {
      checkOutDateControl?.setValidators([Validators.required, notBeforeTodayValidator()]); // Re-añadir validador si se quita
      selectedTimeSlotControl?.clearValidators();
      selectedTimeSlotControl?.reset();
    } else {
      checkOutDateControl?.clearValidators();
      checkOutDateControl?.reset();
      selectedTimeSlotControl?.setValidators([Validators.required]);
    }
    checkOutDateControl?.updateValueAndValidity();
    selectedTimeSlotControl?.updateValueAndValidity();
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.propertyImages.length;
  }

  prevImage(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.propertyImages.length) % this.propertyImages.length;
  }

  changeDate(offset: number): void {
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

  isPrevDayDisabled(): boolean {
    const currentDateStr = this.reservationForm.get('checkInDate')?.value;
    if (!currentDateStr) return true;
    const currentDate = new Date(currentDateStr + 'T00:00:00');
    const todayLimit = new Date(this.minSelectableDate + 'T00:00:00');
    return currentDate <= todayLimit;
  }

  // selectTimeSlot(slotDisplayValue: string): void { // El valor es ahora 'HH:mm-HH:mm'
  //   this.reservationForm.get('selectedTimeSlot')?.setValue(slotDisplayValue);
  // }

  selectTimeSlot(slot: TimeSlot): void { // Ahora recibe el objeto TimeSlot completo
    this.selectedTimeSlotObject = slot; // Guarda el objeto completo
    // Actualiza el valor del formulario con la etiqueta para visualización (si aún la necesitas ahí)
    this.reservationForm.get('selectedTimeSlot')?.setValue(this.getSlotLabel(slot));

    // --- ¡Aquí está tu console.log! ---
    console.log('Objeto TimeSlot seleccionado:', this.selectedTimeSlotObject);
    if (this.selectedTimeSlotObject) {
      console.log('ID del TimeSlot seleccionado:', this.selectedTimeSlotObject.id);
    }
    // ------------------------------------
  }

  onSubmitReservation(): void {
    this.reservationForm.markAllAsTouched();
    if (this.reservationForm.invalid || !this.propertyFullViewModel) {
      console.log('Formulario inválido o propiedad no cargada.');
      return;
    }

    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (!role) {
        console.log('Usuario no logueado. Mostrando modal de login...');
        const formData = this.reservationForm.value;
        this.attemptedBookingData = {
          propertyId: this.propertyFullViewModel!.id,
          type: formData.reservationType,
          date: formData.checkInDate,
          timeSlotId: formData.reservationType === 'visit' && this.selectedTimeSlotObject
            ? this.selectedTimeSlotObject.id
            : null,
          checkOutDate: formData.reservationType === 'book' ? formData.checkOutDate : null,
        };
        this.showLoginModalForBooking = true;
      } else if (role === 'CUSTOMER') { // <--- VERIFICACIÓN DE ROL AQUÍ
        // Usuario logueado y es CUSTOMER, proceder con la reserva
        this.proceedWithBooking();
      } else {
        // Usuario logueado pero NO es CUSTOMER
        console.warn('Usuario logueado pero no es CUSTOMER. Rol:', role);
        this.confirmationMessage = 'Debes iniciar sesión como COMPRADOR para poder agendar una visita.'; // <--- MENSAJE AL USUARIO
        // Hacemos que el mensaje desaparezca después de unos segundos
        setTimeout(() => {
          this.confirmationMessage = null;
          this.cdr.detectChanges(); // Notificar a Angular para que actualice la vista
        }, 5000);
        // AQUÍ PODRÍAS MOSTRAR UN MENSAJE AL USUARIO
        // this.confirmationMessage = 'Solo los clientes pueden agendar visitas.';
        // setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 4000);
      }
    });
  }

  proceedWithBooking(bookingData?: any): void {
    const dataToSend = bookingData || {
      propertyId: this.propertyFullViewModel!.id,
      type: this.reservationForm.value.reservationType,
      date: this.reservationForm.value.checkInDate,
      timeSlotId: this.reservationForm.value.reservationType === 'visit' && this.selectedTimeSlotObject
        ? this.selectedTimeSlotObject.id
        : null,
      checkOutDate: this.reservationForm.value.reservationType === 'book' ? this.reservationForm.value.checkOutDate : null,
    };

    // Solo llamar al servicio si es una visita y tenemos el ID del TimeSlot
    if (dataToSend.type === 'visit' && dataToSend.timeSlotId) {
      const visitPayload: VisitRequest = {
        timeSlotId: dataToSend.timeSlotId // Asumimos que el 'id' en VisitRequest es el ID del TimeSlot
      }

      console.log('Enviando solicitud para crear visita con payload:', visitPayload);

      // Llamada al servicio
      this.visitService.createVisit(visitPayload).subscribe({
        next: (response: VisitResponse) => {
          console.log('Respuesta del servicio createVisit:', response);
          this.confirmationMessage = response.message || '¡Visita agendada con éxito!'; // Usar mensaje del backend
          setTimeout(() => {
            this.confirmationMessage = null;
            this.cdr.detectChanges();
          }, 5000); // Mostrar mensaje por 5 segundos
          this.resetFormAndSelections(); // Limpiar formulario y selecciones
        },
        error: (error) => {
          console.error('Error al agendar la visita:', error);
          const backendErrorMessage = error?.error?.message || error?.message;
          this.confirmationMessage = backendErrorMessage
            ? `Error al agendar: ${backendErrorMessage}`
            : 'Ocurrió un error al intentar agendar la visita. Por favor, inténtalo de nuevo.';
          setTimeout(() => {
            this.confirmationMessage = null;
            this.cdr.detectChanges();
          }, 7000); // Mostrar mensaje de error por 7 segundos
          // Opcional: podrías querer limpiar this.attemptedBookingData aquí si el error es definitivo
          // this.attemptedBookingData = null;
        }
      });

    } else if (dataToSend.type === 'book') {
      // Aquí iría la lógica si tienes un servicio diferente para "Reservar Estancia"
      console.log('Lógica para "Reservar Estancia" (tipo book) no implementada.');
      this.confirmationMessage = 'La funcionalidad de reservar estancia aún no está implementada.';
      setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 4000);
      this.resetFormAndSelections();
    } else {
      // Caso donde no es 'visit' con timeSlotId, o es un tipo no manejado.
      console.warn('Intento de reserva inválido. Tipo:', dataToSend.type, 'TimeSlot ID:', dataToSend.timeSlotId);
      this.resetFormAndSelections();
      console.error('TimeSlot ID es inválido (null, undefined, o no es un número). Payload no enviado.', dataToSend.timeSlotId);
      this.confirmationMessage = 'Error: El horario seleccionado no tiene un ID válido. Por favor, intente de nuevo o contacte a soporte.';
      setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 7000);
      this.resetFormAndSelections();
    }
  }

  // Nuevo método para encapsular el reseteo del formulario y selecciones
  private resetFormAndSelections(): void {
    this.reservationForm.reset({
      reservationType: 'visit',
      checkInDate: this.minSelectableDate,
      checkOutDate: null,
      selectedTimeSlot: null // El label en el form
    });
    this.selectedTimeSlotObject = null; // El objeto TimeSlot guardado
    this.attemptedBookingData = null;   // Los datos del intento de reserva guardados
    this.cdr.detectChanges(); // Asegurar que la UI se actualice si es necesario
  }

  handleLoginModalClosed(): void {
    this.showLoginModalForBooking = false;
    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (this.attemptedBookingData) { // Solo procesar si había un intento de reserva
        if (role === 'CUSTOMER') { // <--- VERIFICACIÓN DE ROL AQUÍ
          console.log('Login exitoso como CUSTOMER, reintentando reserva...');
          this.proceedWithBooking(this.attemptedBookingData);
        } else if (role) { // Se logueó, pero no como CUSTOMER
          console.warn('Login exitoso pero no como CUSTOMER. Rol:', role, 'Reserva no realizada.');
          // AQUÍ PODRÍAS MOSTRAR UN MENSAJE
          // this.confirmationMessage = `Logueado como ${role}. Solo los clientes pueden agendar.`;
          // setTimeout(() => { this.confirmationMessage = null; this.cdr.detectChanges(); }, 4000);
          this.attemptedBookingData = null; // Limpiar datos, no se procederá
        } else { // No se logueó (ej. cerró el modal sin loguearse)
          console.log('Modal de login cerrado, usuario no logueado. Reserva no completada.');
          this.attemptedBookingData = null;
        }
      }
    });
  }

  // Helper para obtener startTime y endTime válidos a partir del formulario
  private getSelectedSlotDateTimes(): { startTime: string | null, endTime: string | null } {
    const checkInDate = this.reservationForm.get('checkInDate')?.value;
    const selectedTimeSlot = this.reservationForm.get('selectedTimeSlot')?.value;
    if (!checkInDate || !selectedTimeSlot) return { startTime: null, endTime: null };
    const [start, end] = selectedTimeSlot.split('-');
    if (!start || !end) return { startTime: null, endTime: null };
    // Formato: YYYY-MM-DDTHH:mm:ss
    const startTime = `${checkInDate}T${start.trim()}:00`;
    const endTime = `${checkInDate}T${end.trim()}:00`;
    // Validar que sean fechas válidas
    if (isNaN(new Date(startTime).getTime()) || isNaN(new Date(endTime).getTime())) {
      return { startTime: null, endTime: null };
    }
    return { startTime, endTime };
  }

  // Ejemplo de uso seguro antes de llamar a un servicio:
  // const { startTime, endTime } = this.getSelectedSlotDateTimes();
  // if (startTime && endTime) {
  //   this.timeSlotService.getTimeSlots({ startTime, endTime, ...otrosParams }).subscribe(...);
  // }

  private getPlaceholderImages(count: number, textPrefix: string = "Imagen"): string[] {
    const placeholders: string[] = [];
    for (let i = 0; i < count; i++) {
      placeholders.push(`https://placehold.co/800x400/E0E0E0/333333?text=${textPrefix}+${i + 1}`);
    }
    return placeholders;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
