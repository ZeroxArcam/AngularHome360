// core/services/translation/translation.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: { [key: string]: string } = {
    // Mensajes de ExceptionConstants (errores)
    'Role Not Found': 'Rol no encontrado.',
    'Email not found': 'Correo electrónico no encontrado.',
    'Invalid email': 'Correo electrónico inválido.',
    'Invalid phone number format. Please use only numeric digits. The phone number cannot be empty or exceed 13 digits.': 'Formato de número de teléfono inválido. Use solo dígitos numéricos. El número de teléfono no puede estar vacío o exceder los 13 dígitos.',
    'Invalid id number': 'Número de identificación inválido.',
    'Invalid age': 'Edad inválida.',
    'Invalid date of birth': 'Fecha de nacimiento inválida.',
    'Invalid date format. Please enter a valid date with \'yyyy-MM-dd\' format, and 4-digit year.': 'Formato de fecha inválido. Por favor, ingrese una fecha válida con el formato \'yyyy-MM-dd\' y un año de 4 dígitos.',
    'Name cannot exceed 50 characters.': 'El nombre no puede exceder los 50 caracteres.',
    'Name cannot be empty.': 'El nombre no puede estar vacío.',
    'Description cannot be empty.': 'La descripción no puede estar vacía.',
    'Last name cannot exceed 50 characters.': 'El apellido no puede exceder los 50 caracteres.',
    'Email already exists': 'El correo electrónico ya existe.',
    'Phone number already exists': 'El número de teléfono ya existe.',
    'Id number already exists': 'El número de identificación ya existe.',
    'User already exists': 'El usuario ya existe.',
    'Id already exists': 'El ID ya existe.',
    'Role already exists': 'El rol ya existe.',
    'Invalid phone number, the number can not be empty or have more than 13 digits': 'Número de teléfono inválido, el número no puede estar vacío o tener más de 13 dígitos.',
    'Last name cannot be empty.': 'El apellido no puede estar vacío.',
    'Description cannot be null.': 'La descripción no puede ser nula.',
    'User created successfully.': 'Usuario creado exitosamente.',
    'ROLE_NOT_FOUND': 'Rol no encontrado.',
    'EMAIL_NOT_FOUND': 'Correo electrónico no encontrado.',
    'FIELD_DESCRIPTION_NULL_MESSAGE': 'La descripción no puede ser nula.',
    'Category created successfully.': 'Categoría creada exitosamente.',
    'Location created successfully.': 'Ubicación creada exitosamente.',
    'Home created successfully.': 'Casa creada exitosamente.',
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
    'The description can not exceed 120 characters': 'La descripción no puede exceder los 120 caracteres.',
    'Invalid parameters.': 'Parámetros inválidos.',
    'Invalid date': 'Fecha inválida.',
    'Invalid number of rooms': 'Número de habitaciones inválido.',
    'Address cannot be null or empty.': 'La dirección no puede ser nula o vacía.',
    'Address already exists.': 'La dirección ya existe.',
    'Invalid sort by': 'Ordenamiento inválido.',
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
    'Name cannot be null.': 'El nombre no puede ser nulo.',
  };

  translate(key: string): string {
    return this.translations[key] || key;
  }
}
