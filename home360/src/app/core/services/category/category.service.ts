import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Category } from '@app/core/models/category.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { map } from 'rxjs/operators';

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

  getCategories(page: number = 0, size: number = 10, orderAsc: boolean = true): Observable<PaginationResponse<Category>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('orderAsc', orderAsc.toString());

    return this.http.get<{ categories: Category[]; totalElements: number; totalPages: number; pageNumber: number; pageSize: number }>(`${this.homeApiUrl}/categories/read`, { params })
      .pipe(
        map(response => ({
          items: response.categories,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
        }))
      );
  }
}
