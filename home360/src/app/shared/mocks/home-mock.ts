import { Home, HomeRequest, HomeResponse } from '@app/core/models/home.model';
import { PaginationResponse } from '../interfaces/pagination.model';

export const mockHomeRequest: HomeRequest = {
  name: 'Casa de prueba',
  address: 'Calle Falsa 123',
  description: 'Una hermosa casa para pruebas.',
  category: 'Apartamento',
  numberOfRooms: 3,
  numberOfBathrooms: 2,
  price: 150000,
  cityId: 101,
  publicationDate: new Date(),
  activePublicationDate: new Date(),
};

export const mockHomeResponse: HomeResponse = {
  message: 'Home created successfully.',
  time: new Date().toISOString(),
};

export const mockPaginationResponse: PaginationResponse<Home> = {
  items: [
    {
      id: 1,
      name: 'Casa Ejemplo',
      neighborhood: 'Centro',
      address: 'Calle 123',
      description: 'Descripción',
      category: 'Casa',
      numberOfRooms: 3,
      numberOfBathrooms: 2,
      price: 200000,
      cityName: 'Ciudad Ejemplo',
      departmentName: 'Departamento Ejemplo',
      activePublicationDate: '2023-01-01',
      userId: 1
    }
  ],
  totalElements: 1,
  totalPages: 1,
  pageNumber: 0,
  pageSize: 10
};
