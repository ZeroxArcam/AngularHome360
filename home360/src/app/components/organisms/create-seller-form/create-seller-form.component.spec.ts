import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateSellerFormComponent } from './create-seller-form.component';
import { SellerService } from '@app/core/services/seller/seller.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';

describe('CreateSellerFormComponent', () => {
  let component: CreateSellerFormComponent;
  let fixture: ComponentFixture<CreateSellerFormComponent>;
  let sellerServiceMock: jest.Mocked<SellerService>;
  let translationServiceMock: jest.Mocked<TranslationService>;

  beforeEach(() => {
    sellerServiceMock = {
      createSeller: jest.fn()
    } as unknown as jest.Mocked<SellerService>;

    translationServiceMock = {
      translate: jest.fn((msg: string) => `translated: ${msg}`)
    } as unknown as jest.Mocked<TranslationService>;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [CreateSellerFormComponent],
      providers: [
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: TranslationService, useValue: translationServiceMock }
      ]
    });

    fixture = TestBed.createComponent(CreateSellerFormComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', (done) => {
    component.sellerForm.patchValue({ name: '' });
    component.handleCreateSeller();

    component.creationResult$.subscribe(result => {
      expect(result.success).toBe(false);
      expect(result.error).toBe(FORM_MESSAGES.INVALID_FORM);
      expect(sellerServiceMock.createSeller).not.toHaveBeenCalled();
      done();
    });
  });

  it('should call sellerService and translate message on success', (done) => {
    const validData = {
      name: 'Juan',
      lastName: 'Pérez',
      idNumber: '12345678',
      phoneNumber: '123456789',
      birthDate: '2000-01-01',
      email: 'juan@example.com',
      password: 'password123',
      role: 'Seller'
    };

    component.sellerForm.setValue(validData);

    sellerServiceMock.createSeller.mockReturnValue(
      of({
        message: 'CREATED_OK',
        time: '2025-05-03T12:00:00Z'
      })
    );


    component.handleCreateSeller();

    component.creationResult$.subscribe(result => {
      expect(result.success).toBe(true);
      expect(translationServiceMock.translate).toHaveBeenCalledWith('CREATED_OK');
      expect(result.message).toBe('translated: CREATED_OK');
      done();
    });
  });

  it('should handle and translate HTTP error response', (done) => {
    const validData = {
      name: 'Ana',
      lastName: 'López',
      idNumber: '87654321',
      phoneNumber: '987654321',
      birthDate: '1995-05-05',
      email: 'ana@example.com',
      password: 'securepass',
      role: 'Seller'
    };

    component.sellerForm.setValue(validData);

    const errorResponse = new HttpErrorResponse({
      error: { message: 'EMAIL_EXISTS' },
      status: 400
    });

    sellerServiceMock.createSeller.mockReturnValue(throwError(() => errorResponse));

    component.handleCreateSeller();

    component.creationResult$.subscribe(result => {
      expect(result.success).toBe(false);
      expect(result.error).toBe('translated: EMAIL_EXISTS');
      expect(translationServiceMock.translate).toHaveBeenCalledWith('EMAIL_EXISTS');
      done();
    });
  });
});
