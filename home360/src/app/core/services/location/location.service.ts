import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Location, LocationRequest, LocationResponse, PagedLocationRequest } from '@app/core/models/location.model';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { map } from 'rxjs/operators';

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
  getLocations(payload: PagedLocationRequest): Observable<PaginationResponse<Location>> {
    let params = new HttpParams()
      .set('page', payload.page.toString())
      .set('size', payload.size.toString());

    if (payload.sortBy) {
      params = params.set('sortBy', payload.sortBy);
    }
    if (payload.sortDirection) {
      params = params.set('sortDirection', payload.sortDirection);
    }
    if (payload.text) {
      params = params.set('text', payload.text);
    }
    return this.http.get<{ locations: Location[]; totalElements: number; totalPages: number; pageNumber: number; pageSize: number }>(`${this.homeApiUrl}/locations/search`, { params })
      .pipe(
        map(response => ({
          items: response.locations,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
        }))
      );
  }

}
