import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateSellerFormComponent } from './create-seller-form.component';
import { SellerService } from '@app/core/services/seller/seller.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FORM_MESSAGES } from '@app/shared/constants/messages.constants';
import * as moment from 'moment-timezone';
import { FormFieldComponent } from '@app/components/molecules/form-field/form-field.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

moment.tz.setDefault('America/Bogota');

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

  beforeEach(() => {
    sellerServiceMock = {
      createSeller: jest.fn()
    } as any;

    translationServiceMock = {
      translate: jest.fn().mockImplementation((msg: string) => `TRADUCIDO: ${msg}`)
    } as any;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        CreateSellerFormComponent,
        FormFieldComponent // 1. Añade el componente dependiente
      ],
      providers: [
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: TranslationService, useValue: translationServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // 2. Opcional: para ignorar elementos desconocidos
    });

    fixture = TestBed.createComponent(CreateSellerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Resto de las pruebas se mantienen igual...
});
