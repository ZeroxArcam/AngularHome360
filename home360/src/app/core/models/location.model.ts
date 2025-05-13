export interface CityDepartment {
  id: number;
  name: string;
  department: string;
}

export interface LocationRequest {
  neighborhood: string;
  cityDepartmentId: number;
}

export interface LocationResponse {
  message: string;
}

export interface PagedLocationRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  text?: string;
}

export interface Location {
  id: number;
  cityName: string;
  departmentName: string;
  neighborhood: string;
}
