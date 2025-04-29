import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';
import { DebugElement, Input, Output, EventEmitter, forwardRef, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// ========== Mock Components ==========

@Component({
  selector: 'app-label',
  template: '<div><label [for]="for">{{ labelText }}<span *ngIf="isRequired">*</span></label></div>',
})
class MockAppLabelComponent {
  @Input() for: string = '';
  @Input() labelText: string = '';
  @Input() isRequired: boolean = false;
}

@Component({
  selector: 'app-input',
  template: `
    <input
      [type]="type"
      [id]="id"
      [name]="name"
      [value]="value"
      [placeholder]="placeholder"
      [required]="required"
      [class]="inputClass"
      [attr.maxlength]="maxlength"
      [disabled]="isDisabled"
      (input)="onInput($event)"
    >
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockAppInputComponent),
      multi: true,
    },
  ],
})
class MockAppInputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() value: any = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() inputClass: string = '';
  @Input() maxlength: number | string | null = null;
  @Output() input: EventEmitter<any> = new EventEmitter<any>();

  isDisabled: boolean = false;

  onChange: any = () => { };
  onTouched: any = () => { };

  onInput(event: any) {
    this.input.emit(event);
    this.onChange(event.target.value);
    this.onTouched();
  }

  onBlur() {
    this.onTouched();
  }

  writeValue(value: any): void { this.value = value; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled = isDisabled; }
}

// ========== Tests ==========

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;
  let debugElement: DebugElement;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        FormFieldComponent,
        MockAppLabelComponent,
        MockAppInputComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    nativeElement = fixture.nativeElement;
    component.onChange = jest.fn();
    component.onTouched = jest.fn();
    fixture.detectChanges();
  });

  // ========== Creation ==========

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== Label Tests ==========

  it('should pass correct "for" and "labelText" to AppLabelComponent', () => {
    component.inputId = 'testId';
    component.labelText = 'Test Label';
    fixture.detectChanges();

    const labelComponent = debugElement.query(By.directive(MockAppLabelComponent)).componentInstance as MockAppLabelComponent;

    expect(labelComponent.for).toBe('testId');
    expect(labelComponent.labelText).toBe('Test Label');
  });

  // ========== Input Tests ==========

  it('should pass correct inputs to AppInputComponent', () => {
    component.inputType = 'email';
    component.inputId = 'testInputId';
    component.inputName = 'testInputName';
    component.inputValue = 'test@example.com';
    component.inputPlaceholder = 'Enter email';
    component.inputRequired = true;
    component.inputClass = 'custom-input';
    component.maxlength = undefined;
    fixture.detectChanges();

    const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;

    expect(inputComponent.type).toBe('email');
    expect(inputComponent.id).toBe('testInputId');
    expect(inputComponent.name).toBe('testInputName');
    expect(inputComponent.value).toBe('test@example.com');
    expect(inputComponent.placeholder).toBe('Enter email');
    expect(inputComponent.required).toBe(true);
    expect(inputComponent.inputClass).toBe('custom-input');
    expect(inputComponent.maxlength).toBeNull();
  });

  // ========== Character Count Tests ==========

  it('should display character count when maxlength and showCharacterCount are true', () => {
    component.maxlength = 50;
    component.showCharacterCount = true;
    component.inputValue = 'test value';
    component.currentValueLength = component.inputValue.length;
    fixture.detectChanges();

    const characterCount = nativeElement.querySelector('.character-count');

    expect(characterCount).toBeTruthy();
    expect(characterCount?.textContent).toContain(`${component.currentValueLength} / ${component.maxlength}`);
  });

  it('should not display character count when maxlength is undefined', () => {
    component.maxlength = undefined;
    component.showCharacterCount = true;
    fixture.detectChanges();

    const characterCount = nativeElement.querySelector('.character-count');

    expect(characterCount).toBeFalsy();
  });

  it('should not display character count when showCharacterCount is false', () => {
    component.maxlength = 50;
    component.showCharacterCount = false;
    fixture.detectChanges();

    const characterCount = nativeElement.querySelector('.character-count');

    expect(characterCount).toBeFalsy();
  });

  // ========== Value and Change Handling ==========

  it('should emit inputValueChange when the input value changes', () => {
    const newValue = 'new value';
    let emittedValue: string | undefined;

    component.inputValueChange.subscribe((value) => (emittedValue = value));

    const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;
    inputComponent.onInput({ target: { value: newValue } });
    fixture.detectChanges();

    expect(emittedValue).toBe(newValue);
  });

  // it('should set value in the input when writeValue is called', fakeAsync(() => {
  //   const testValue = 'writeValue test';
  //   component.writeValue(testValue);
  //   tick();
  //   fixture.detectChanges();

  //   const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;
  //   expect(inputComponent.value).toBe(testValue);
  // }));

  it('should call onChange when input value changes', () => {
    const onChangeSpy = jest.spyOn(component, 'onChange');

    const newValue = 'change test';
    const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;
    inputComponent.onInput({ target: { value: newValue } });

    expect(onChangeSpy).toHaveBeenCalledWith(newValue);
  });

  // it('should call onTouched when input loses focus', fakeAsync(() => {
  //   const onTouchedSpy = jest.spyOn(component, 'onTouched');

  //   const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;
  //   inputComponent.onBlur();
  //   tick();
  //   fixture.detectChanges();

  //   expect(onTouchedSpy).toHaveBeenCalled();
  // }));

  // it('should disable the input when setDisabledState is called', fakeAsync(() => {
  //   component.setDisabledState(true);
  //   tick();
  //   fixture.detectChanges();

  //   const inputComponent = debugElement.query(By.directive(MockAppInputComponent)).componentInstance as MockAppInputComponent;
  //   expect(inputComponent.isDisabled).toBeTruthy();
  // }));

});
