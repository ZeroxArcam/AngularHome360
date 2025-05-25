import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';
import { TimeSlotRequest, TimeSlotResponse, TimeSlot, TimeSlotQueryParams } from '@app/core/models/time-slot.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
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

  getTimeSlots(queryParams: TimeSlotQueryParams): Observable<PaginationResponse<TimeSlot>> {
    console.log('[DEBUG][TimeSlotService] Params recibidos:', queryParams);

    let params = new HttpParams()
      .set('page', queryParams.page !== undefined ? queryParams.page.toString() : '0')
      .set('size', queryParams.size !== undefined ? queryParams.size.toString() : '10')
      .set('sortBy', queryParams.sortBy ? queryParams.sortBy : 'startTime')
      .set('sortDirection', queryParams.sortDirection ? queryParams.sortDirection : 'DESC')
      .set('sellerId', queryParams.sellerId !== undefined ? queryParams.sellerId.toString() : '')
      .set('homeId', queryParams.homeId !== undefined ? queryParams.homeId.toString() : '')
      .set('startTime', queryParams.startTime ? this.formatDateTimeToUTC(queryParams.startTime) : '')
      .set('endTime', queryParams.endTime ? this.formatDateTimeToUTC(queryParams.endTime) : '');

    let finalParams = new HttpParams();
    params.keys().forEach(key => {
      if (params.get(key) !== '') {
        finalParams = finalParams.set(key, params.get(key)!);
      }
    });

    return this.http.get<{ timeSlots: TimeSlot[]; totalElements: number; totalPages: number; pageNumber: number; pageSize: number }>(
      `${this.servicesVisitsApiUrl}/time-slots/search`,
      { params: finalParams }
    ).pipe(
      map(response => ({
        items: response.timeSlots,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
      }))
    );
  }

  public formatDateTimeToUTC(dateTime: Date | string): string {
    if (dateTime instanceof Date) {
      const year = dateTime.getFullYear();
      const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
      const day = dateTime.getDate().toString().padStart(2, '0');
      const hours = dateTime.getHours().toString().padStart(2, '0');
      const minutes = dateTime.getMinutes().toString().padStart(2, '0');
      const seconds = dateTime.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    return dateTime;
  }
}
