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
  id: number,
  name: string,
  neighborhood: string,
  address: string,
  description: string,
  category: string,
  numberOfRooms: number,
  numberOfBathrooms: number,
  price: number,
  cityName: string,
  departmentName: string,
  activePublicationDate: string,
  userId: number
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
