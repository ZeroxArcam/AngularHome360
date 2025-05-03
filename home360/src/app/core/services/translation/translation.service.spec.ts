import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the translation if key exists', () => {
    const result = service.translate('The name can not exceed 50 characters');
    expect(result).toBe('El nombre no puede exceder los 50 caracteres.');
  });

  it('should return the original key if translation does not exist', () => {
    const unknownKey = 'This key does not exist';
    const result = service.translate(unknownKey);
    expect(result).toBe(unknownKey);
  });
});
