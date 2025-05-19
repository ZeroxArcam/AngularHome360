export interface TimeSlotRequest {
  homeId: number;
  startTime: Date | string;
  endTime: Date | string;
}

export interface TimeSlotResponse {
  message: string;
}

export interface TimeSlotErrorResponse {
  code: string;
  message: string;
  timestamp: string;
}

export interface PaginatedTimeSlotResponse {
  timeSlots: TimeSlot[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface TimeSlot {
  id: number;
  startTime: Date | string; // Formato YYYY-MM-DDTHH:MM:SS
  endTime: Date | string;   // Formato YYYY-MM-DDTHH:MM:SS
  homeId: number;
  sellerId: number;
}

export interface TimeSlotQueryParams {
  sellerId?: number;
  homeId?: number;
  startTime?: Date | string; // Formato YYYY-MM-DDTHH:MM:SS
  endTime?: Date | string;   // Formato YYYY-MM-DDTHH:MM:SS
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
