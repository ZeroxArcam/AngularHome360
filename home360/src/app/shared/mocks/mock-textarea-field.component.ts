import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockTextareaFieldComponent),
      multi: true,
    },
  ],
})
export class MockTextareaFieldComponent implements ControlValueAccessor {
  @Input() inputId: string = '';
  @Input() name: string = '';
  @Input() labelText: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() textareaClass: string = '';
  @Input() errorMessage: string = '';
  @Input() maxlength: number = 90;
  @Input() pattern: string = '';
  @Input() inputmode: string = '';
  @Input() showCharacterCount: boolean = true;
  @Input() restrictToNumbers: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

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
