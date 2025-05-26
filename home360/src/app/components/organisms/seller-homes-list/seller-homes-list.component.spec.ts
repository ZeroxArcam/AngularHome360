import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SellerHomesListComponent } from './seller-homes-list.component';
import { TokenService } from '@app/core/services/auth/token.service';

describe('SellerHomesListComponent', () => {
  let component: SellerHomesListComponent;
  let fixture: ComponentFixture<SellerHomesListComponent>;
  let tokenService: jest.Mocked<TokenService>;;

  beforeEach(async () => {
    const tokenServiceMock = {
      getUserId: jest.fn(() => '')
    };
    await TestBed.configureTestingModule({
      declarations: [SellerHomesListComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: TokenService,
          useValue: tokenServiceMock
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SellerHomesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    tokenService = TestBed.inject(TokenService) as jest.Mocked<TokenService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call "paginationParams.next" when sellerId is null', fakeAsync(() => {
    tokenService.getUserId.mockReturnValue(null);
    const paginationParamsNextSpy = jest.spyOn(component['paginationParams'], 'next');

    component.ngOnInit();
    tick(300);
    fixture.detectChanges();
    component.filterForm.patchValue(component.filterForm.value);
    tick(300);
    fixture.detectChanges();

    expect(paginationParamsNextSpy).toHaveBeenCalled();
  }));

  it('should call "paginationParams.next" when sellerId is number', fakeAsync(() => {
    tokenService.getUserId.mockReturnValue(8);
    const paginationParamsNextSpy = jest.spyOn(component['paginationParams'], 'next');

    component.ngOnInit();
    tick(300);
    fixture.detectChanges();
    component.filterForm.patchValue(component.filterForm.value);
    tick(300);
    fixture.detectChanges();

    expect(paginationParamsNextSpy).toHaveBeenCalled();
  }));

  it('should update "loadSellerProperties"', () => {
    const homeIdMock = 20;
    component.selectedHomeId = 30;
    component.openScheduleModal(homeIdMock);
    expect(component.selectedHomeId).toEqual(homeIdMock);
  });

  it('should update "isScheduleModalVisible"', () => {
    component.isScheduleModalVisible = true;
    component.closeScheduleModal();
    expect(component.isScheduleModalVisible).toEqual(false);
  });
});
