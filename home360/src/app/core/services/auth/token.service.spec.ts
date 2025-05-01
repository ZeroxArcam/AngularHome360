import { JWT_OPTIONS, JwtHelperService } from "@auth0/angular-jwt";
import { TokenService } from "./token.service";
import { TestBed } from "@angular/core/testing";

describe('TokenService', () => {
  let service: TokenService;
  let jwtHelperMock: Partial<JwtHelperService>;

  beforeEach(() => {
    jwtHelperMock = {
      decodeToken: jest.fn(),
      isTokenExpired: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TokenService,
        { provide: JwtHelperService, useValue: jwtHelperMock },
        { provide: JWT_OPTIONS, useValue: {} }
      ]
    });

    service = TestBed.inject(TokenService);
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return token from localStorage', () => {
    localStorage.setItem('authToken', 'test-token');
    expect(service.getToken()).toBe('test-token');
    localStorage.removeItem('authToken');
    expect(service.getToken()).toBeNull();
  });

  it('should decode valid token', () => {
    const mockDecoded = { name: 'Test User' };
    jest.spyOn(service, 'getToken').mockReturnValue('valid-token');
    (jwtHelperMock.decodeToken as jest.Mock).mockReturnValue(mockDecoded);
    expect(service.decodeToken()).toEqual(mockDecoded);
    expect(jwtHelperMock.decodeToken).toHaveBeenCalledWith('valid-token');
  });

  it('should return null when decoding invalid token', () => {
    jest.spyOn(service, 'getToken').mockReturnValue('invalid-token');
    (jwtHelperMock.decodeToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    expect(service.decodeToken()).toBeNull();
    expect(jwtHelperMock.decodeToken).toHaveBeenCalledWith('invalid-token');
  });

  it('should return role without ROLE_ prefix', () => {
    let mockDecoded = { roles: ['ROLE_ADMIN'] };
    jest.spyOn(service, 'decodeToken').mockReturnValue(mockDecoded);
    expect(service.getRole()).toBe('ADMIN');
    mockDecoded = { roles: 'ROLE_USER' } as any;
    jest.spyOn(service, 'decodeToken').mockReturnValue(mockDecoded);
    expect(service.getRole()).toBe('USER');
  });

  it('should handle missing roles', () => {
    jest.spyOn(service, 'decodeToken').mockReturnValue({});
    expect(service.getRole()).toBeNull();

    const mockDecoded = { roles: ['INVALID_ROLE'] };
    jest.spyOn(service, 'decodeToken').mockReturnValue(mockDecoded);
    expect(service.getRole()).toBeNull();
    const mockDecodedValid = { roles: ['ROLE_VALID'] };
    jest.spyOn(service, 'decodeToken').mockReturnValue(mockDecodedValid);
    expect(service.getRole()).toBe('VALID');
  });

  it('should check token expiration', () => {
    jest.spyOn(service, 'getToken').mockReturnValue('expired-token');
    (jwtHelperMock.isTokenExpired as jest.Mock).mockReturnValue(true);
    expect(service.isTokenExpired()).toBe(true);
    jest.spyOn(service, 'getToken').mockReturnValue('valid-token');
    (jwtHelperMock.isTokenExpired as jest.Mock).mockReturnValue(false);
    expect(service.isTokenExpired()).toBe(false);
    jest.spyOn(service, 'getToken').mockReturnValue(null);
    expect(service.isTokenExpired()).toBe(true);
  });
});
