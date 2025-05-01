import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private homeApiUrl = environment.homeapiUrl;
  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient) { }

  createCategory(categoryData: { name: string; description: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    return this.http.post(`${this.homeApiUrl}/categories/create`, categoryData, { headers });
  }
}
