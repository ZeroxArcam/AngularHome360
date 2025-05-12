import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockFormFieldComponent),
      multi: true,
    },
  ],
})
export class MockFormFieldComponent implements ControlValueAccessor {
  @Input() labelText: string = '';
  @Input() inputType: string = 'text';
  @Input() inputId: string = '';
  @Input() inputName: string = '';
  @Input() inputValue: string = '';
  @Input() inputPlaceholder: string = '';
  @Input() inputRequired: boolean = false;
  @Input() inputClass: string = '';
  @Input() maxlength: number | null = 50;
  @Input() showCharacterCount: boolean = true;
  @Input() errorMessages: { [key: string]: string } = {};
  @Input() minDate: string | null = '';
  @Input() maxDate: string | null = '';

  @Output() inputValueChange = new EventEmitter<string>();

  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(value: any): void { }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void { }
}
