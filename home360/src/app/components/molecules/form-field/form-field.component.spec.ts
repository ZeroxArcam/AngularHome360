import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { InputComponent } from '@app/components/atoms/input/input.component';
import { ElementRef } from '@angular/core';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;
  let inputElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormFieldComponent, InputComponent],
    });
    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputElement = fixture.debugElement.query(By.css('app-input'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should write value correctly in ControlValueAccessor', () => {
    const testValue = 'Test Value';
    component.writeValue(testValue);
    expect(component.value).toBe(testValue);
    expect(component.currentValueLength).toBe(testValue.length);
  });

  it('should register on change callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    const inputValue = 'New Value';
    const event = { target: { value: inputValue } };
    if ((event.target as HTMLInputElement).value !== undefined) {
      component.onInputChange(event as any);
    }
    expect(fn).toHaveBeenCalledWith(inputValue);
  });


  it('should disable the input when setDisabledState is called', () => {
    const input = document.createElement('input');
    component.inputElementRef = new ElementRef(input);
    component.setDisabledState(true);
    expect(component.inputElementRef.nativeElement.disabled).toBe(true);
  });



  it('should initialize currentValueLength correctly on ngOnInit', () => {
    component.inputValue = '';
    component.ngOnInit();
    expect(component.currentValueLength).toBe(0);
    const testValue = 'Test';
    component.inputValue = testValue;
    component.ngOnInit();
    expect(component.currentValueLength).toBe(testValue.length);
  });


  it('should write value and update native input element and currentValueLength', () => {
    const testValue = 'Test value';
    const mockInput = document.createElement('input');
    component.inputElementRef = new ElementRef(mockInput);
    const detectChangesSpy = jest.spyOn((component as any).cdr, 'detectChanges');
    component.writeValue(testValue);
    expect(component.value).toBe(testValue);
    expect(component.currentValueLength).toBe(testValue.length);
    expect(component.inputElementRef.nativeElement.value).toBe(testValue);
    expect(detectChangesSpy).toHaveBeenCalled();
  });
  it('should set value to empty string when null is passed to writeValue', () => {
    const mockInput = document.createElement('input');
    component.inputElementRef = new ElementRef(mockInput);
    const detectChangesSpy = jest.spyOn((component as any).cdr, 'detectChanges');
    component.writeValue(null);
    expect(component.value).toBe('');
    expect(component.currentValueLength).toBe(0);
    expect(component.inputElementRef.nativeElement.value).toBe('');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should handle null this.value in writeValue and set input value to empty string', () => {
    const mockInput = document.createElement('input');
    component.inputElementRef = new ElementRef(mockInput);
    (component as any).value = null;
    component.writeValue(undefined);
    expect(component.inputElementRef.nativeElement.value).toBe('');
  });


  it('should update value and emit inputValueChange on input change', () => {
    jest.spyOn(component.inputValueChange, 'emit');
    const inputValue = 'new input value';
    expect(inputElement).not.toBeNull();
    inputElement.triggerEventHandler('input', { target: { value: inputValue } });
    expect(component.value).toBe(inputValue);
    expect(component.currentValueLength).toBe(inputValue.length);
    expect(component.inputValueChange.emit).toHaveBeenCalledWith(inputValue);
  });

  it('should respect maxlength and truncate input value if necessary', () => {
    jest.spyOn(component.inputValueChange, 'emit');
    const longInputValue = 'a'.repeat(100);
    const maxlength = 50;
    component.maxlength = maxlength;
    inputElement.triggerEventHandler('input', { target: { value: longInputValue } });
    expect(component.value).toBe(longInputValue.substring(0, maxlength));
    expect(component.currentValueLength).toBe(maxlength);

    expect(component.inputValueChange.emit).toHaveBeenCalledWith(longInputValue.substring(0, maxlength));
  });

  it('should not update value or emit event if input is disabled', () => {
    jest.spyOn(component.inputValueChange, 'emit');
    component.setDisabledState(true);
    fixture.detectChanges();
    const inputValue = 'new input value';
    inputElement.triggerEventHandler('input', { target: { value: inputValue } });
    expect(component.value).not.toBe(inputValue);
    expect(component.inputValueChange.emit).not.toHaveBeenCalled();
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);

    // Llamamos manualmente al método para verificar que fue asignado correctamente
    component.onTouched();

    expect(fn).toHaveBeenCalled();
  });


});
