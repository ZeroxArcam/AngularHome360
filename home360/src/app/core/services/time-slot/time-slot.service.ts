import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { TimeSlotRequest, TimeSlotResponse } from '@app/core/models/time-slot.model'; // Asegúrate de tener esta interfaz

@Injectable({
  providedIn: 'root'
})
export class TimeSlotService {
  private http = inject(HttpClient);
  private servicesVisitsApiUrl = environment.visitapiUrl

  createTimeSlot(payload: TimeSlotRequest): Observable<TimeSlotResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );

    const formattedPayload = {
      ...payload,
      startTime: this.formatDateTimeToUTC(payload.startTime),
      endTime: this.formatDateTimeToUTC(payload.endTime)
    };

    return this.http.post<any>(`${this.servicesVisitsApiUrl}/time-slots/create`, formattedPayload, { headers });
  }

  private formatDateTimeToUTC(dateTime: Date | string): string {
    if (dateTime instanceof Date) {
      const year = dateTime.getUTCFullYear();
      const month = (dateTime.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = dateTime.getUTCDate().toString().padStart(2, '0');
      const hours = dateTime.getUTCHours().toString().padStart(2, '0');
      const minutes = dateTime.getUTCMinutes().toString().padStart(2, '0');
      const seconds = dateTime.getUTCSeconds().toString().padStart(2, '0');
      const milliseconds = dateTime.getUTCMilliseconds().toString().padStart(3, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
    }
    return dateTime;
  }
}
