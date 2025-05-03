import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
  templateUrl: './textarea-field.component.html',
  styleUrls: ['./textarea-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaFieldComponent),
      multi: true,
    },
  ],
})
export class TextareaFieldComponent implements OnInit, ControlValueAccessor {
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

  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('textAreaInput') textAreaInputRef!: ElementRef<HTMLTextAreaElement>;

  value: string = '';
  currentValueLength: number = 0;
  onChange: any = () => { };
  onTouched: any = () => { };
  disabled: boolean = false;

  ngOnInit(): void {
    this.currentValueLength = this.value.length;
  }

  hasExceededMaxLength(): boolean {
    return this.maxlength > 0 && this.currentValueLength >= this.maxlength;
  }

  writeValue(value: any): void {
    this.value = value || '';
    this.currentValueLength = this.value.length;
    if (this.textAreaInputRef?.nativeElement) {
      this.textAreaInputRef.nativeElement.value = this.value;
    }
  }
  ngAfterViewInit(): void {
    if (this.textAreaInputRef?.nativeElement) {
      this.textAreaInputRef.nativeElement.value = this.value;
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
    if (this.textAreaInputRef) {
      this.textAreaInputRef.nativeElement.disabled = isDisabled;
    }
  }

  handleInputChange(event: Event): void {
    if (this.disabled) {
      return;
    }
    const inputElement = event.target as HTMLTextAreaElement;
    if (inputElement) {
      this.value = inputElement.value;
      this.currentValueLength = this.value.length;
      this.onChange(this.value);
      this.onTouched();
      this.valueChange.emit(this.value);
    }
  }
}
