import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, forwardRef, ChangeDetectorRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

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
  @Input() inputClass: string = '';
  @Input() maxlength: number | null = 50;
  @Input() showCharacterCount: boolean = true;
  @Input() formControl?: FormControl;
  @Input() errorMessages: { [key: string]: string } = {};
  @Input() minDate: string | null = '';
  @Input() maxDate: string | null = '';
  @ViewChild('inputElement') inputElementRef!: ElementRef<HTMLInputElement>;
  @Output() inputValueChange = new EventEmitter<string>();

  private cdr = inject(ChangeDetectorRef);

  value: string = '';
  onChange: any = () => { };
  onTouched: any = () => { };
  disabled: boolean = false;
  currentValueLength: number = 0;
  // hasExceededMaxLength: boolean = false;

  ngOnInit(): void {
    this.currentValueLength = this.inputValue ? this.inputValue.length : 0;
    this.value = this.inputValue;
    if (this.formControl && this.formControl.value && this.value !== this.formControl.value) {
      this.writeValue(this.formControl.value);
    }
    // this.checkMaxLength();
  }

  writeValue(value: any): void {
    this.value = value || '';
    this.currentValueLength = this.value.length;
    // this.checkMaxLength();
    if (this.inputElementRef && this.inputElementRef.nativeElement) {
      this.inputElementRef.nativeElement.value = this.value === null ? '' : this.value;
    }
    this.cdr.detectChanges();
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
      if (this.formControl) {
        this.formControl.setValue(this.value);
      }
    }
  }
  hasExceededMaxLength(): boolean {
    return this.maxlength !== null && this.maxlength > 0 && this.currentValueLength >= this.maxlength;
  }
  //  hasExceededMaxLength(): boolean {
  //   return this.maxlength > 0 && this.currentValueLength >= this.maxlength;
  // }

  // private checkMaxLength(): void {
  //   this.hasExceededMaxLength = this.maxlength !== null && this.currentValueLength > this.maxlength;
  // }
}
