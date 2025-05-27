export const FORM_MESSAGES = {
  REQUIRED: 'Este campo es requerido.',
  REQUIRED_FIELD: 'Por favor, completa todos los campos requeridos.',
  PATTERN_NUMBER: 'El ID debe ser un número entero.',
  INVALID_FORM: 'Asegurese de llenar el formulario con los datos correspondientes.',
  UNDERAGE: 'Lo sentimos, debes tener al menos 18 años para registrarte como vendedor.',
  // MAX_LENGTH: (maxLength: number) => `Este campo debe tener como máximo ${maxLength} caracteres.`,
  // MIN_LENGTH: (minLength: number) => `Este campo debe tener al menos ${minLength} caracteres.`,
  INVALID_EMAIL: 'Por favor, introduce un correo electrónico válido.',
  INVALID_PHONE_NUMBER: 'Por favor, introduce un número de teléfono válido.',
  INVALID_ID_NUMBER: 'Por favor, introduce un número de identificación válido.',
};

export const CATEGORY_MESSAGES = {
  CREATE_SUCCESS: 'Categoría creada exitosamente.',
  CREATE_ERROR: 'Error al crear la categoría.',
};

export const LOCATION_MESSAGES = {
  CREATE_SUCCESS: 'Ubicación creada exitosamente.',
  CREATE_ERROR: 'Error al crear la ubicación.',
};

export const BUTTON = {
  CREATE: 'Crear'
};

export const DASHBOARD_MESSAGES = {
  WELCOME: 'Bienvenido',
  WELCOME_WITH_NAME: (name: string) => `Bienvenido, ${name}`,
  CONFIRM_LOGOUT: '¿Estás seguro de que deseas cerrar sesión?',
  LOGIN_ERROR: 'Error al iniciar sesión. Por favor, verifica tus credenciales.',
  SERVER_LOGIN_ERROR: 'El server está fuera de servicio actualmente, intenta más tarde.'
};

export const VISIT_MESSAGES = {
  FILL_REQUIRED_FIELDS: 'Por favor, completa todos los campos requeridos.',
  LOGIN_AS_CUSTOMER: 'Debes iniciar sesión como COMPRADOR para poder agendar una visita.',
  ONLY_CUSTOMERS: (role: string) => `Has iniciado sesión como ${role}. Solo los COMPRADORES pueden agendar visitas.`,
  INVALID_SLOT: 'Error: El horario seleccionado no es válido. Por favor, selecciona un horario.',
  BOOKING_SUCCESS: '¡Visita agendada con éxito!',
  BOOKING_ERROR: 'Ocurrió un error al agendar la visita. Por favor, inténtalo de nuevo.',
  BOOKING_ERROR_WITH_REASON: (reason: string) => `Error al agendar: ${reason}`,
};
