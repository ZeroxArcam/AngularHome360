import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { LocationRequest, LocationResponse } from '@app/core/models/location.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private homeApiUrl = environment.homeapiUrl;

  createLocation(payload: LocationRequest): Observable<LocationResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );
    return this.http.post<LocationResponse>(`${this.homeApiUrl}/locations/create`, payload, { headers })
  }

}
