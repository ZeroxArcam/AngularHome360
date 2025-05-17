import { Category } from '@app/core/models/category.model';
import { PaginationResponse } from '@app/shared/interfaces/pagination.model';

export const mockCategory: Category = {
  id: 1,
  name: 'Casa',
  description: 'Propiedad destinada a vivienda',
};

export const mockCategoryList: Category[] = [
  {
    id: 1,
    name: 'Casa',
    description: 'Propiedad destinada a vivienda',
  },
  {
    id: 2,
    name: 'Apartamento',
    description: 'Unidad residencial en edificio',
  }
];

export const mockCategoryPaginationResponse: PaginationResponse<Category> = {
  items: mockCategoryList,
  totalElements: 2,
  totalPages: 1,
  pageNumber: 0,
  pageSize: 10
};

export const mockCategoryPaginationResponsePage1: PaginationResponse<Category> = {
  items: [mockCategoryList[0]],
  totalElements: 2,
  totalPages: 2,
  pageNumber: 0,
  pageSize: 1
};

export const mockCategoryPaginationResponsePage2: PaginationResponse<Category> = {
  items: [mockCategoryList[1]],
  totalElements: 2,
  totalPages: 2,
  pageNumber: 1,
  pageSize: 1
};
