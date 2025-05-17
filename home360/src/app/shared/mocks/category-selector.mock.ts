import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-category-selector',
  template: `
    <div class="mock-category-selector">
      <select (change)="onSelect($event)">
        <option value="">Todas</option>
        <option *ngFor="let cat of categories" [value]="cat.id">
          {{ cat.name }}
        </option>
      </select>
    </div>
  `
})
export class MockCategorySelector {
  @Output() categorySelected = new EventEmitter<number | null>();
  @Input() selectedValue: number | null = null;

  categories = [
    { id: 1, name: 'Casas' },
    { id: 2, name: 'Apartamentos' }
  ];

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const id = value ? parseInt(value, 10) : null;
    this.categorySelected.emit(id);
  }
}
