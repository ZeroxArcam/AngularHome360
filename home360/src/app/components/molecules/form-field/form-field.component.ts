import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, forwardRef, ChangeDetectorRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
})
export class FormFieldComponent implements OnInit, ControlValueAccessor {
  @Input() labelText: string = '';
  @Input() inputType: string = 'text';
  @Input() inputId: string = '';
  @Input() inputName: string = '';
  @Input() inputValue: string = '';
  @Input() inputPlaceholder: string = '';
  @Input() inputRequired: boolean = false;
  @Output() inputValueChange = new EventEmitter<string>();
  @Input() inputClass: string = '';
  @Input() maxlength: number | undefined = 50;
  currentValueLength: number = 0;
  @Input() showCharacterCount: boolean = true;

  @ViewChild('inputElement') inputElementRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  value: string = '';
  onChange: any = () => { };
  onTouched: any = () => { };
  disabled: boolean = false;

  ngOnInit(): void {
    this.currentValueLength = this.inputValue ? this.inputValue.length : 0;
    this.value = this.inputValue;
  }

  writeValue(value: any): void {
    this.value = value || '';
    this.currentValueLength = this.value.length;
    if (this.inputElementRef) {
      this.inputElementRef.nativeElement.value = this.value === null ? '' : this.value;
      this.cdr.detectChanges();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.inputElementRef) {
      this.inputElementRef.nativeElement.disabled = isDisabled;
    }
  }

  onInputChange(event: Event): void {
    if (this.disabled) {
      return;
    }
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      let value = inputElement.value;
      if (this.maxlength && value.length > this.maxlength) {
        value = value.substring(0, this.maxlength);
        inputElement.value = value;
      }
      this.value = value;
      this.currentValueLength = this.value.length;
      this.onChange(this.value);
      this.onTouched();
      this.inputValueChange.emit(this.value);
    }
  }
}
