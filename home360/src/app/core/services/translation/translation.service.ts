// core/services/translation/translation.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: { [key: string]: string } = {
    // Mensajes de ExceptionConstants (errores)
    'The name can not exceed 50 characters': 'El nombre no puede exceder los 50 caracteres.',
    'The description of the category can not exceed 90 characters': 'La descripción de la categoría no puede exceder los 90 caracteres.',
    'The category already exists': 'La categoría ya existe.',
    'The category was not found': 'No se encontró la categoría.',
    'The description can not be empty': 'La descripción no puede estar vacía.',
    'The name can not be empty': 'El nombre no puede estar vacío.',
    'The number of pages can not be less than 0': 'El número de páginas no puede ser menor que 0.',
    'The size of the page can not be less than 1': 'El tamaño de la página no puede ser menor que 1.',
    'Name not found': 'Nombre no encontrado.',
    'Department not found.': 'Departamento no encontrado.',
    'Duplicated data.': 'Datos duplicados.',
    // 'Description cannot exceed 120 characters.': 'La descripción no puede exceder los 120 caracteres.',
    'The description can not exceed 120 characters': 'La descripción no puede exceder los 120 caracteres.',
    'Invalid parameters.': 'Parámetros inválidos.',
    'Invalid date': 'Fecha inválida.',
    'Invalid number of rooms': 'Número de habitaciones inválido.',
    'Address cannot be null or empty.': 'La dirección no puede ser nula o vacía.',
    'Address already exists.': 'La dirección ya existe.',
    'Invalid sort by': 'Ordenamiento inválido.',

    // Mensajes de DomainConstants
    'Name cannot be null.': 'El nombre no puede ser nulo.',
    'Description cannot be null.': 'La descripción no puede ser nula.',
    'Name cannot be empty.': 'El nombre no puede estar vacío.',
    'Description cannot be empty.': 'La descripción no puede estar vacía.',
    'Name cannot exceed 50 characters.': 'El nombre no puede exceder los 50 caracteres.',
    'Description cannot exceed 90 characters.': 'La descripción no puede exceder los 90 caracteres.',
    'Description cannot exceed 120 characters.': 'La descripción no puede exceder los 120 caracteres.',
    'No such data exists.': 'No existen datos.',
    'Data already exists.': 'Los datos ya existen.',
    'The publication date cannot be in the past and cannot exceed 30 days from the current date.': 'La fecha de publicación no puede ser en el pasado y no puede exceder los 30 días desde la fecha actual.',
    'The active publication date cannot be before the publication date and cannot exceed 30 days from the current date.': 'La fecha de activación no puede ser anterior a la fecha de publicación y no puede exceder los 30 días desde la fecha actual.',
    'Location ID can not be empty or null.': 'El ID de la ubicación no puede estar vacío o nulo.',
    'Invalid sortBy value: %s. Use price, numberOfRooms, numberOfBathrooms, locationId, or categoryId.': 'Valor de ordenamiento inválido: %s. Use precio, númeroDeHabitaciones, númeroDeBaños, idUbicación o idCategoría.',
    'minRooms cannot be negative.': 'El número mínimo de habitaciones no puede ser negativo.',
    'maxRooms cannot be negative.': 'El número máximo de habitaciones no puede ser negativo.',
    'minBathrooms cannot be negative.': 'El número mínimo de baños no puede ser negativo.',
    'maxBathrooms cannot be negative.': 'El número máximo de baños no puede ser negativo.',
    'minPrice cannot be negative.': 'El precio mínimo no puede ser negativo.',
    'maxPrice cannot be negative.': 'El precio máximo no puede ser negativo.',
    'Invalid sortDirection parameter: %s': 'Parámetro de dirección de ordenamiento inválido: %s',

    // Mensajes de Constants (éxito)
    'Category created successfully.': 'Categoría creada exitosamente.',
    'Location created successfully.': 'Ubicación creada exitosamente.',
    'Home created successfully.': 'Casa creada exitosamente.',
  };


  translate(key: string): string {
    return this.translations[key] || key;
  }
}
