import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateSellerFormComponent } from '../create-seller-form/create-seller-form.component';
import { SellerService } from '@app/core/services/seller/seller.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CreateSellerFormComponent', () => {
  let component: CreateSellerFormComponent;
  let fixture: ComponentFixture<CreateSellerFormComponent>;
  let sellerServiceMock: jest.Mocked<SellerService>;
  let translationServiceMock: jest.Mocked<TranslationService>;

  const validSellerData = {
    name: 'Juan',
    lastName: 'Pérez',
    idNumber: '1234567890',
    phoneNumber: '3001234567',
    birthDate: '1990-01-01',
    email: 'juan@example.com',
    password: 'ValidPassword123!',
    role: 'Seller'
  };

  beforeEach(async () => { // Cambiar a async
    sellerServiceMock = {
      createSeller: jest.fn()
    } as any;

    translationServiceMock = {
      translate: jest.fn().mockImplementation((msg: string) => `TRADUCIDO: ${msg}`)
    } as any;

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [CreateSellerFormComponent],
      providers: [
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: TranslationService, useValue: translationServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignorar componentes hijos
    }).compileComponents(); // Compilar componentes

    fixture = TestBed.createComponent(CreateSellerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form correctly', () => {
    component.sellerForm.setValue(validSellerData);
    expect(component.sellerForm.valid).toBe(true);
  });

  it('should show error for invalid form', (done) => {
    component.sellerForm.patchValue({ name: '' });
    component.handleCreateSeller();

    component.creationResult$.subscribe((result: { success: any; error: any; }) => {
      expect(result?.success).toBe(false);
      expect(result?.error).toContain(FORM_MESSAGES.INVALID_FORM);
      done();
    });
  });

  it('should handle age validation error', (done) => {
    component.sellerForm.patchValue({
      ...validSellerData,
      birthDate: '2010-01-01'
    });

    component.handleCreateSeller();

    component.creationResult$.subscribe((result: { success: any; error: any; }) => {
      expect(result?.success).toBe(false);
      expect(result?.error).toContain(FORM_MESSAGES.UNDERAGE);
      done();
    });
  });

  it('should call service on valid submission', fakeAsync(() => {
    sellerServiceMock.createSeller.mockReturnValue(
      of({
        message: 'seller.created',
        time: '2023-10-05T00:00:00Z'
      })
    );

    component.sellerForm.setValue(validSellerData);
    component.handleCreateSeller();
    tick();

    expect(sellerServiceMock.createSeller).toHaveBeenCalledWith(validSellerData);
  }));

  it('should handle server error', fakeAsync(() => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'EMAIL_EXISTS' }
    });

    sellerServiceMock.createSeller.mockReturnValue(throwError(() => errorResponse));

    component.sellerForm.setValue(validSellerData);
    component.handleCreateSeller();
    tick();

    component.creationResult$.subscribe((result: { success: any; error: any; }) => {
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('TRADUCIDO: EMAIL_EXISTS');
    });
  }));
});
