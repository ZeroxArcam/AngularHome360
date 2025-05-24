import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SellerHomesListComponent } from './seller-homes-list.component';
import { ListHomeComponent } from '../list-home/list-home.component';
import { TokenService } from '@app/core/services/auth/token.service';
import { Router } from '@angular/router';
import { HomeService } from '@app/core/services/home/home.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';

class MockListHomeComponent extends ListHomeComponent {
  override ngOnInit = jest.fn();
  override ngOnDestroy = jest.fn();
}

describe('SellerHomesListComponent', () => {
  let component: SellerHomesListComponent;
  let fixture: ComponentFixture<SellerHomesListComponent>;
  let tokenService: TokenService;

  const mockTokenService = {
    getUserId: jest.fn(() => 123)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SellerHomesListComponent,
        MockListHomeComponent
      ],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: { navigate: jest.fn() } },
        HomeService,
        { provide: ListHomeComponent, useExisting: MockListHomeComponent }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SellerHomesListComponent);
    component = fixture.componentInstance;
    tokenService = TestBed.inject(TokenService);
  });

  it('should load seller properties on init', () => {
    const loadSellerPropertiesSpy = jest.spyOn(component, 'loadSellerProperties');
    fixture.detectChanges();
    expect(tokenService.getUserId).toHaveBeenCalled();
    expect(loadSellerPropertiesSpy).toHaveBeenCalled();
  });

  it('should handle schedule modal visibility', () => {
    const testHomeId = 456;
    component.openScheduleModal(testHomeId);
    expect(component.isScheduleModalVisible).toBe(true);
    expect(component.selectedHomeId).toBe(testHomeId);

    component.closeScheduleModal();
    expect(component.isScheduleModalVisible).toBe(false);
    expect(component.selectedHomeId).toBeNull();
  });

  it('should update filters with seller ID on changes', fakeAsync(() => {
    const loadSellerPropertiesSpy = jest.spyOn(component, 'loadSellerProperties');
    fixture.detectChanges();

    component.filterForm.patchValue({
      categoryId: 2,
      locationId: 5
    });

    tick(300);
    expect(loadSellerPropertiesSpy).toHaveBeenCalled();
  }));

});
