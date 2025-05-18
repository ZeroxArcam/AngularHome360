import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateSellerFormComponent, emailValidatorCustom } from './create-seller-form.component';
import { SellerService } from '@app/core/services/seller/seller.service';
import { TranslationService } from '@app/core/services/translation/translation.service';
import { of, throwError } from 'rxjs';
import { MockFormFieldComponent } from '@app/shared/mocks/mock-form-field.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';

describe('CreateSellerFormComponent', () => {
  let component: CreateSellerFormComponent;
  let fixture: ComponentFixture<CreateSellerFormComponent>;
  let sellerService: jest.Mocked<SellerService>;
  let translationService: jest.Mocked<TranslationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateSellerFormComponent, MockFormFieldComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        {
          provide: SellerService,
          useValue: {
            createSeller: jest.fn(),
          },
        },
        {
          provide: TranslationService,
          useValue: {
            translate: jest.fn((text) => text),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSellerFormComponent);
    component = fixture.componentInstance;
    sellerService = TestBed.inject(SellerService) as jest.Mocked<SellerService>;
    translationService = TestBed.inject(TranslationService) as jest.Mocked<TranslationService>;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit error if form is invalid and birthDate is underage', () => {
    const spy = jest.fn();
    component.creationResult$.subscribe(spy);

    component.sellerForm.patchValue({
      name: 'Juan',
      lastName: 'Pérez',
      idNumber: '1234567890',
      phoneNumber: '3001234567',
      birthDate: '2020-01-01',
      email: 'juan@example.com',
      password: 'password123',
    });

    component.handleCreateSeller();

    expect(spy).toHaveBeenCalledWith({
      success: false,
      error: component.formMessages.UNDERAGE,
    });
  });

  it('should create seller and emit success message', fakeAsync(() => {
    const creationResponse = { message: 'Vendedor creado con éxito', time: "" };
    sellerService.createSeller.mockReturnValue(of(creationResponse));

    const spy = jest.fn();
    component.creationResult$.subscribe(spy);

    component.sellerForm.setValue({
      name: 'Juan',
      lastName: 'Pérez',
      idNumber: '1234567890',
      phoneNumber: '3001234567',
      birthDate: '1990-01-01',
      email: 'juan@example.com',
      password: 'password123',
      role: 'Seller',
    });

    component.handleCreateSeller();

    tick(3000);
    fixture.detectChanges();

    expect(sellerService.createSeller).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      success: true,
      message: 'Vendedor creado con éxito',
    });
  }));

  it('should emit error message if seller creation fails', () => {
    sellerService.createSeller.mockReturnValue(
      throwError(() => ({ error: { message: 'Error al crear vendedor' } }))
    );

    const spy = jest.fn();
    component.creationResult$.subscribe(spy);

    component.sellerForm.setValue({
      name: 'Juan',
      lastName: 'Pérez',
      idNumber: '1234567890',
      phoneNumber: '3001234567',
      birthDate: '1990-01-01',
      email: 'juan@example.com',
      password: 'password123',
      role: 'Seller',
    });

    component.handleCreateSeller();

    expect(spy).toHaveBeenCalledWith({
      success: false,
      error: 'Error al crear vendedor',
    });
  });


  describe('emailValidatorCustom', () => {
    it('should return error if email is invalid', () => {
      const control = new FormControl('invalid-email', emailValidatorCustom());
      const result = control.errors;
      expect(result).toEqual({ invalidEmailCustom: true });
    });
  });

  it('should return error if email is invalid', () => {
    const control = new FormControl('invalid-email');
    const validator = emailValidatorCustom();
    const result = validator(control);
    expect(result).toEqual({ invalidEmailCustom: true });
  });

  it('should return null if email is valid', () => {
    const control = new FormControl('test@example.com');
    const validator = emailValidatorCustom();
    const result = validator(control);
    expect(result).toBeNull();
  });
});

