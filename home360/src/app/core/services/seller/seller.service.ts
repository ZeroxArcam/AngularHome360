import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateSellerResponse, SellerRequest } from '@app/core/models/seller.model';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SellerService {
  private http = inject(HttpClient);
  private usersapiUrl = environment.usersapiUrl;
  createSeller(payload: SellerRequest): Observable<CreateSellerResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders(
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );
    return this.http.post<CreateSellerResponse>(`${this.usersapiUrl}/user/create`, payload, { headers })
  }
}
