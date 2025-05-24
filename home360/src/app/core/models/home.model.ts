// src/app/core/models/home.model.ts (Actualización)

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
  activePublicationDate: string; // Es un string, como indicas
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

// ¡NUEVO!: Importa TimeSlot si aún no lo has hecho
import { TimeSlot } from '@app/core/models/time-slot.model'; // Asegúrate de que esta ruta sea correcta

// ¡NUEVA INTERFAZ PARA LA VISTA!
export interface HomeViewModel extends Home {
  // Propiedades adicionales necesarias para la vista
  image: string; // La URL de la imagen que manejas en el frontend
  timeSlots?: TimeSlot[]; // Los horarios, si los adjuntas a cada propiedad
  hasTimeSlots?: boolean; // Un flag para saber si tiene horarios o no
}
