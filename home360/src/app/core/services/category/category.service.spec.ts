import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from 'src/environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  const fakeToken = 'fake-jwt-token';

  beforeEach(() => {
    localStorage.setItem('authToken', fakeToken);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('authToken');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createCategory should POST to correct URL with Authorization header and body', () => {
    const categoryData = { name: 'Cat1', description: 'Desc1' };
    let responseBody: any;

    service.createCategory(categoryData).subscribe(res => {
      responseBody = res;
    });

    const req = httpMock.expectOne(`${environment.homeapiUrl}/categories/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);
    expect(req.request.body).toEqual(categoryData);

    const mockResponse = { success: true, id: '123' };
    req.flush(mockResponse);
    expect(responseBody).toEqual(mockResponse);
  });
});
