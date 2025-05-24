import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { TimeSlotService } from '@app/core/services/time-slot/time-slot.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, tap, catchError, of } from 'rxjs';
import { TimeSlotQueryParams } from '@app/core/models/time-slot.model';
import { TranslationService } from '@app/core/services/translation/translation.service';

@Component({
  selector: 'app-schedule-modal',
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss']
})
export class ScheduleModalComponent implements OnInit, OnDestroy {
  @Input() homeId: number | null = null;
  @Output() close = new EventEmitter<void>();
  private timeSlotService = inject(TimeSlotService);
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private el = inject(ElementRef);
  scheduleForm = this.fb.group({
    startTime: ['', Validators.required],
    endTime: ['', Validators.required]
  }, { validators: this.dateTimeRangeValidator() });
  timeSlots: any[] = [];
  private destroy$ = new Subject<void>();
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    if (this.homeId) {
      this.loadTimeSlots();
    }
    this.setInitialStartTime();
    this.scheduleForm.markAllAsTouched();
  }

  setInitialStartTime(): void {
    const nowPlusTwoHours = new Date();
    const nowPlusFourHours = new Date();
    nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 2);
    nowPlusFourHours.setHours(nowPlusFourHours.getHours() + 4);
    this.scheduleForm.controls['startTime'].setValue(this.formatDateForInput(nowPlusTwoHours));
    this.scheduleForm.controls['endTime'].setValue(this.formatDateForInput(nowPlusFourHours));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTimeSlots(): void {
    if (this.homeId) {
      const today = new Date();
      const threeWeeksFromNow = new Date();
      threeWeeksFromNow.setDate(today.getDate() + 21);

      const queryParams: TimeSlotQueryParams = {
        homeId: this.homeId,
        page: 0,
        size: 100,
        startTime: today,
        endTime: threeWeeksFromNow
      };

      this.timeSlotService.getTimeSlots(queryParams)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.errorMessage = this.translationService.translate(error);
            return of({ items: [] });
          })
        )
        .subscribe(response => {
          this.timeSlots = response.items;
        });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  createSchedule(): void {
    if (this.scheduleForm.valid && this.homeId) {
      const payload = {
        homeId: this.homeId,
        startTime: this.scheduleForm.value['startTime'] ? new Date(this.scheduleForm.value['startTime']) : '',
        endTime: this.scheduleForm.value['endTime'] ? new Date(this.scheduleForm.value['endTime']) : ''
      };
      this.timeSlotService.createTimeSlot(payload)
        .pipe(
          takeUntil(this.destroy$),
          tap(response => {
            this.successMessage = this.translationService.translate(response.message);
            setTimeout(() => this.successMessage = null, 3000);
            this.scheduleForm.reset();
            this.loadTimeSlots();
          }),
          catchError(error => {
            this.errorMessage = this.translationService.translate(error.error?.message);
            setTimeout(() => this.errorMessage = null, 5000);
            return of(null);
          })
        )
        .subscribe();
    } else {
      this.scheduleForm.markAllAsTouched();
    }
  }

  setDateTimeToday(elementId: string): void {
    const nowPlusTwoHours = new Date();
    nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 2);
    nowPlusTwoHours.setMinutes(nowPlusTwoHours.getMinutes());
    const formattedDate = this.formatDateForInput(nowPlusTwoHours);
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      element.value = formattedDate;
    }
  }

  setStartTimeToday(): void {
    const nowPlusTwoHours = new Date();
    nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 2);
    this.scheduleForm.controls['startTime'].setValue(this.formatDateForInput(nowPlusTwoHours));
  }

  setEndTimeToday(): void {
    const startTimeValue = this.scheduleForm.controls['startTime'].value;
    if (startTimeValue) {
      const startTime = new Date(startTimeValue);
      startTime.setHours(startTime.getHours() + 2);
      this.scheduleForm.controls['endTime'].setValue(this.formatDateForInput(startTime));
    } else {
      const nowPlusOneHour = new Date();
      nowPlusOneHour.setHours(nowPlusOneHour.getHours() + 2);
      this.scheduleForm.controls['endTime'].setValue(this.formatDateForInput(nowPlusOneHour));
    }
  }

  getMinStartTime(): string {
    const nowPlusTwoHours = new Date();
    nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 2);
    const year = nowPlusTwoHours.getFullYear();
    const month = (nowPlusTwoHours.getMonth() + 1).toString().padStart(2, '0');
    const day = nowPlusTwoHours.getDate().toString().padStart(2, '0');
    const hours = nowPlusTwoHours.getHours().toString().padStart(2, '0');
    const minutes = nowPlusTwoHours.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }


  getMaxStartTime(): string {
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);
    return this.formatDateForInput(threeWeeksFromNow);
  }

  getMinEndTime(): string {
    if (this.scheduleForm.get('startTime')?.value) {
      const startTimeValue = this.scheduleForm.get('startTime')!.value;
      const startTime = startTimeValue ? new Date(startTimeValue) : new Date();
      const minEndTime = new Date(startTime);
      minEndTime.setHours(minEndTime.getHours() + 2);
      return this.formatDateForInput(minEndTime);
    }
    return '';
  }

  getMaxEndTime(): string {
    if (this.scheduleForm.get('startTime')?.value) {
      const startTimeValue = this.scheduleForm.get('startTime')!.value;
      const startTime = startTimeValue ? new Date(startTimeValue) : new Date();
      const maxEndTime = new Date(startTime);
      maxEndTime.setDate(maxEndTime.getDate() + 21);
      return this.formatDateForInput(maxEndTime);
    }
    return this.formatDateForInput(new Date());
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const modalContent = this.el.nativeElement.querySelector('.schedule-modal__content');
    if (this.homeId !== null && modalContent && !modalContent.contains(event.target as Node)) {
      this.onClose();
    }
  }

  dateTimeRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const start = formGroup.get('startTime')?.value;
      const end = formGroup.get('endTime')?.value;

      if (!start || !end) {
        return null;
      }

      const nowPlusTwoHours = new Date();
      nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 1);
      nowPlusTwoHours.setMinutes(nowPlusTwoHours.getMinutes() + 59);
      nowPlusTwoHours.setSeconds(nowPlusTwoHours.getSeconds() + 0);
      const threeWeeksFromNow = new Date();
      threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);

      const startTime = new Date(start);
      const endTime = new Date(end);

      if (startTime < nowPlusTwoHours) {
        formGroup.get('startTime')?.setErrors({ startTimeTooEarly: true });
      }

      if (startTime > threeWeeksFromNow) {
        formGroup.get('startTime')?.setErrors({ startTimeTooLate: true });
      }

      const minEndTime = new Date(startTime);
      minEndTime.setHours(minEndTime.getHours() + 2);

      if (endTime < minEndTime) {
        formGroup.get('endTime')?.setErrors({ endTimeTooEarly: true });
      }

      if (endTime > threeWeeksFromNow) {
        formGroup.get('endTime')?.setErrors({ endTimeTooLate: true });
      }

      return null;
    };
  }
}
