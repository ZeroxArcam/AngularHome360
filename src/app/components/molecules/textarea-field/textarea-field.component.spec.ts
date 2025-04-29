import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextareaFieldComponent } from './textarea-field.component';
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
  selector: 'app-textarea',
  template: '<textarea [id]="id" [name]="name" [placeholder]="placeholder" [required]="required" [class]="textareaClass" [value]="value" [attr.maxlength]="maxlength" (input)="onInput($event)"></textarea>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockAppTextareaComponent),
      multi: true,
    },
  ],
})
class MockAppTextareaComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() textareaClass: string = '';
  @Input() value: any = '';
  @Input() maxlength: number | string | null = null;
  @Output() input: EventEmitter<any> = new EventEmitter<any>();

  onChange: any = () => { };
  onTouched: any = () => { };
  isDisabled: boolean = false;

  onInput(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
    this.onTouched();
    this.input.emit(event);
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}

// ========== Tests ==========

describe('TextareaFieldComponent', () => {
  let component: TextareaFieldComponent;
  let fixture: ComponentFixture<TextareaFieldComponent>;
  let debugElement: DebugElement;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TextareaFieldComponent,
        MockAppLabelComponent,
        MockAppTextareaComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextareaFieldComponent);
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
    const testId = 'testTextareaId';
    const testLabel = 'Test Textarea Label';
    const isRequired = true;
    component.inputId = testId;
    component.labelText = testLabel;
    component.required = isRequired;
    fixture.detectChanges();

    const labelComponent = debugElement.query(By.directive(MockAppLabelComponent))
      .componentInstance as MockAppLabelComponent;

    expect(labelComponent.for).toBe(testId);
    expect(labelComponent.labelText).toBe(testLabel);
    expect(labelComponent.isRequired).toBe(isRequired);
  });
  // ========== Textarea Tests ==========

  it('should pass correct inputs to AppTextareaComponent', () => {
    const testId = 'testTextareaId';
    const testName = 'testTextareaName';
    const testPlaceholder = 'Enter text here';
    const isRequired = true;
    const testClass = 'custom-textarea';
    const testValue = 'initial text';
    const testMaxlength = 150;

    component.inputId = testId;
    component.name = testName;
    component.placeholder = testPlaceholder;
    component.required = isRequired;
    component.textareaClass = testClass;
    component.value = testValue;
    component.maxlength = testMaxlength;
    fixture.detectChanges();

    const textareaComponent = debugElement.query(By.directive(MockAppTextareaComponent))
      .componentInstance as MockAppTextareaComponent;

    expect(textareaComponent.id).toBe(testId);
    expect(textareaComponent.name).toBe(testName);
    expect(textareaComponent.placeholder).toBe(testPlaceholder);
    expect(textareaComponent.required).toBe(isRequired);
    expect(textareaComponent.textareaClass).toBe(testClass);
    expect(textareaComponent.value).toBe(testValue);
    expect(textareaComponent.maxlength).toBe(testMaxlength);
  });

  it('should emit valueChange and call onChange and onTouched when textarea value changes', () => {
    const newValue = 'this is a new value';
    let emittedValue: string | undefined;
    const onChangeSpy = jest.spyOn(component, 'onChange');
    const onTouchedSpy = jest.spyOn(component, 'onTouched');
    component.valueChange.subscribe((value) => (emittedValue = value));

    const textareaComponent = debugElement.query(By.directive(MockAppTextareaComponent))
      .componentInstance as MockAppTextareaComponent;

    textareaComponent.onInput({ target: { value: newValue } });
    fixture.detectChanges();

    expect(emittedValue).toBe(newValue);
    expect(onChangeSpy).toHaveBeenCalledWith(newValue);
    expect(onTouchedSpy).toHaveBeenCalled();
  });

});
