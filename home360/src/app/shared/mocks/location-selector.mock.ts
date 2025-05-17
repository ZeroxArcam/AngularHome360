
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-location-selector',
  template: `
    <div class="mock-location-selector">
      <select *ngIf="displayType === 'dropdown'" (change)="onSelect($event)">
        <option value="">Todas</option>
        <option *ngFor="let loc of locations" [value]="loc.id">
          {{ loc.city }}
        </option>
      </select>

      <input *ngIf="displayType === 'autocomplete'"
             (click)="showOptions = true"
             (blur)="showOptions = false">

      <ul *ngIf="displayType === 'autocomplete' && showOptions">
        <li *ngFor="let loc of locations" (mousedown)="selectLocation(loc)">
          {{ loc.city }}
        </li>
      </ul>
    </div>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MockLocationSelector),
    multi: true
  }]
})
export class MockLocationSelector implements ControlValueAccessor {
  @Input() displayType: 'dropdown' | 'autocomplete' = 'dropdown';
  @Output() locationSelected = new EventEmitter<number | null>();

  locations = [
    { id: 1, city: 'Bogotá', department: 'Cundinamarca' },
    { id: 2, city: 'Medellín', department: 'Antioquia' }
  ];
  showOptions = false;
  onChange = (value: any) => { };
  onTouched = () => { };

  writeValue(value: any): void { }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const id = value ? parseInt(value, 10) : null;
    this.locationSelected.emit(id);
    this.onChange(id);
  }

  selectLocation(loc: any): void {
    this.locationSelected.emit(loc.id);
    this.onChange(loc.id);
    this.showOptions = false;
  }
}
