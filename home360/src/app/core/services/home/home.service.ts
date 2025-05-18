import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Home, HomeRequest, HomeResponse, PagedHomeRequest } from '@app/core/models/home.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private homeApiUrl = environment.homeapiUrl;


  createProperty(payload: HomeRequest): Observable<HomeResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {});
    return this.http.post<HomeResponse>(`${this.homeApiUrl}/home/create`, payload, { headers })
  }
  getProperties(payload: PagedHomeRequest): Observable<PaginationResponse<Home>> {
    let params = new HttpParams()
      .set('page', payload.page.toString())
      .set('size', payload.size.toString())
      .set('sortBy', payload.sortBy ? payload.sortBy : '')
      .set('sortDirection', payload.sortDirection ? payload.sortDirection : '')
      .set('locationId', payload.locationId ? payload.locationId.toString() : '')
      .set('categoryId', payload.categoryId ? payload.categoryId.toString() : '')
      .set('userId', payload.userId ? payload.userId.toString() : '')
      .set('homeId', payload.homeId ? payload.homeId.toString() : '')
      .set('minRooms', payload.minRooms ? payload.minRooms.toString() : '')
      .set('maxRooms', payload.maxRooms ? payload.maxRooms.toString() : '')
      .set('minBathrooms', payload.minBathrooms ? payload.minBathrooms.toString() : '')
      .set('maxBathrooms', payload.maxBathrooms ? payload.maxBathrooms.toString() : '')
      .set('minPrice', payload.minPrice ? payload.minPrice.toString() : '')
      .set('maxPrice', payload.maxPrice ? payload.maxPrice.toString() : '')
      .set('currentDate', payload.currentDate ? (payload.currentDate instanceof Date ? this.formatDate(payload.currentDate) : payload.currentDate) : '')

    let finalParams = new HttpParams();
    params.keys().forEach(key => {
      if (params.get(key) !== '') {
        finalParams = finalParams.set(key, params.get(key)!);
      }
    });

    return this.http.get<{ home: Home[]; totalElements: number; totalPages: number; pageNumber: number; pageSize: number }>(
      `${this.homeApiUrl}/home/search`,
      { params: finalParams }
    ).pipe(
      map(response => ({
        items: response.home,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
      }))
    );
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
