import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HomeRequest, HomeResponse } from '@app/core/models/home.model';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private homeApiUrl = environment.homeapiUrl;

  createProperty(payload: HomeRequest): Observable<HomeResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );
    return this.http.post<HomeResponse>(`${this.homeApiUrl}/home/create`, payload, { headers })
  }

}
