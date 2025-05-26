// src/app/core/models/home.model.ts (Actualización)
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { TimeSlot } from './time-slot.model';

// Tus interfaces existentes:
export interface HomeRequest {
  name: string;
  address: string;
  description: string;
  category: string;
  numberOfRooms: number;
  numberOfBathrooms: number;
  price: number;
  cityId: number;
  activePublicationDate: Date; // Ojo: en Home es string
  publicationDate: Date;       // Ojo: en Home no existe, y en HomeRequest es Date
}

export interface HomeResponse {
  message: string;
  time: string;
}

export interface Home {
  id: number;
  name: string;
  neighborhood: string;
  address: string;
  description: string;
  category: string;
  numberOfRooms: number;
  numberOfBathrooms: number;
  price: number;
  cityName: string;
  departmentName: string;
  activePublicationDate: string;
  userId: number;
}

export interface PagedHomeRequest {
  page: number;
  size: number;
  sortBy?: string | null;
  sortDirection?: string | null;
  locationId?: number | null | undefined;
  categoryId?: number | null;
  userId?: number | null;
  homeId?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minBathrooms?: number | null;
  maxBathrooms?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  currentDate?: Date | string | null;
}


export interface HomeViewModel extends Home {
  image: string;
  timeSlots: TimeSlot[];
  hasTimeSlots: boolean;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  type?: string;
  locationName?: string;
}

export interface PaginatedHomeViewModel extends PaginationResponse<HomeViewModel> {
  // Solo necesita extender PaginationResponse
}
// export interface HomeViewModel { // Ejemplo si no se importa
//   id: number | string;
//   name: string;
//   image?: string;
//   type?: 'sale' | 'rent' | string; // << CLAVE: type puede ser undefined aquí
//   cityName: string;
//   departmentName: string;
//   neighborhood?: string;
//   price: number;
//   numberOfRooms: number;
//   numberOfBathrooms: number;
//   areaSqFt?: number | string;
//   activePublicationDate?: string | Date;
//   hasTimeSlots: boolean;
//   timeSlots?: TimeSlot[];
//   // ...otras propiedades de HomeViewModel
// }

// export interface TimeSlot {
//   startTime: string | Date;
//   endTime: string | Date;
// }

export interface Property {
  id: number | string;
  name: string;
  image?: string;
  type: 'sale' | 'rent' | string;
  description: string;
  cityName: string;
  departmentName: string;
  neighborhood?: string;
  category: string;
  price: number;
  numberOfRooms: number;
  numberOfBathrooms: number;
  areaSqFt?: number | string;
  activePublicationDate?: string | Date;
  hasTimeSlots: boolean;
  timeSlots: TimeSlot[]; // << CAMBIO: Asegurar que timeSlots siempre sea un array en Property
}
