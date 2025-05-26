import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { VisitResponse, VisitRequest } from '@app/core/models/time-slot.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  private http = inject(HttpClient);
  private servicesVisitsApiUrl = environment.visitapiUrl


  createVisit(payload: VisitRequest): Observable<VisitResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );
    return this.http.post<VisitResponse>(`${this.servicesVisitsApiUrl}/visits/create`, payload, { headers });
  }
}
