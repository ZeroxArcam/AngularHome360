import { Location } from '@app/core/models/location.model';
export interface CityDepartment {
  id: number;
  name: string;
  department: string;
}

export const mockCityDepartments: CityDepartment[] = [
  { id: 1, name: 'Valledupar', department: 'Cesar' },
  { id: 2, name: 'Zipaquirá', department: 'Cundinamarca' },
  { id: 3, name: 'Chía', department: 'Cundinamarca' },
  { id: 4, name: 'Soacha', department: 'Cundinamarca' },
  { id: 5, name: 'Facatativá', department: 'Cundinamarca' },
  { id: 6, name: 'Madrid', department: 'Cundinamarca' },
  { id: 7, name: 'Cajicá', department: 'Cundinamarca' },
  { id: 8, name: 'Guatavita', department: 'Cundinamarca' },
  { id: 9, name: 'Sesquilé', department: 'Cundinamarca' },
  { id: 10, name: 'Tocancipá', department: 'Cundinamarca' },
];
export const mockLocations: Location[] = mockCityDepartments.map(cd => ({
  id: cd.id,
  cityName: cd.name,
  departmentName: cd.department,
  neighborhood: 'DEFAULT_NEIGHBORHOOD'
}));


export const mockLocation: Location = mockLocations[0];



