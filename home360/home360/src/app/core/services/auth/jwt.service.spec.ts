import { TestBed } from '@angular/core/testing';
import { TokenService } from './jwt.service';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';

describe('TokenService', () => {
  let service: TokenService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TokenService,
        JwtHelperService,
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
      ]
    });

    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
