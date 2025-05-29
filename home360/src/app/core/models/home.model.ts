import { PaginationResponse } from '@app/shared/interfaces/pagination.model';
import { TimeSlot } from './time-slot.model';

export interface HomeRequest {
  name: string;
  address: string;
  description: string;
  category: string;
  numberOfRooms: number;
  numberOfBathrooms: number;
  price: number;
  cityId: number;
  activePublicationDate: Date;
  publicationDate: Date;
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
}
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
  timeSlots: TimeSlot[];
}
