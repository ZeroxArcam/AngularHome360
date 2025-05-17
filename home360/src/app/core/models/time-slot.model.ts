export interface TimeSlotRequest {
  homeId: number;
  startTime: string;
  endTime: string;
}

export interface TimeSlotResponse {
  message: string;
}

export interface TimeSlotErrorResponse {
  code: string;
  message: string;
  timestamp: string;
}
