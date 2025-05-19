import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { HomeService } from 'src/app/core/services/home/home.service';
import { CategoryService } from '@app/core/services/category/category.service';
import { LocationService } from '@app/core/services/location/location.service';
import { SellerHomesListComponent } from './seller-homes-list.component';

describe('SellerHomesListComponent', () => {
  let component: SellerHomesListComponent;
  let fixture: ComponentFixture<SellerHomesListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SellerHomesListComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HomeService, useValue: { getHomesBySellerId: () => of([]), getProperties: () => of({ items: [], totalPages: 0, pageNumber: 0, pageSize: 0 }) } },
        { provide: CategoryService, useValue: { getCategories: () => of({ items: [], totalPages: 0, pageNumber: 0, pageSize: 0 }) } },
        { provide: LocationService, useValue: { getLocations: () => of({ items: [], totalPages: 0, pageNumber: 0, pageSize: 0 }) } }
      ]
    });
    fixture = TestBed.createComponent(SellerHomesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
