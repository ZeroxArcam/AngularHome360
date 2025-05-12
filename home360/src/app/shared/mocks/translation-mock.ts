export const mockTranslationData: { [key: string]: string } = {
  'Home created successfully.': 'Casa creada exitosamente.',
  'Category created successfully.': 'Categoría creada exitosamente.',
  'Invalid date': 'Fecha inválida.',
};

export class MockTranslationService {
  private translations = mockTranslationData;

  translate(key: string): string {
    return this.translations[key] || key;
  }
}
