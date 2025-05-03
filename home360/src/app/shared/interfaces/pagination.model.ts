export interface PaginationResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}
