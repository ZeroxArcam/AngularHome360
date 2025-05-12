import { HomeRequest, HomeResponse } from '@app/core/models/home.model';

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
