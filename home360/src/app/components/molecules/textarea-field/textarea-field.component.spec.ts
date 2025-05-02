import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextareaFieldComponent } from './textarea-field.component';
import { Component, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ElementRef } from '@angular/core';

describe('TextareaFieldComponent', () => {
  let component: TextareaFieldComponent;
  let fixture: ComponentFixture<TextareaFieldComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [TextareaFieldComponent]
    });
    fixture = TestBed.createComponent(TextareaFieldComponent);
    component = fixture.componentInstance;

    // Simular ViewChild
    const textarea = document.createElement('textarea');
    component.textAreaInputRef = new ElementRef<HTMLTextAreaElement>(textarea);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize currentValueLength in ngOnInit', () => {
    component.value = 'Texto inicial';
    component.ngOnInit();
    expect(component.currentValueLength).toBe('Texto inicial'.length);
  });

  it('should write value correctly in writeValue', () => {
    component.writeValue('Hola mundo');
    expect(component.value).toBe('Hola mundo');
    expect(component.currentValueLength).toBe(10);
    expect(component.textAreaInputRef.nativeElement.value).toBe('Hola mundo');
  });
  it('should default to empty string if value is null in writeValue', () => {
    component.writeValue(null);
    expect(component.value).toBe('');
    expect(component.currentValueLength).toBe(0);
    expect(component.textAreaInputRef.nativeElement.value).toBe('');
  });


  it('should update textarea value in ngAfterViewInit', () => {
    component.value = 'Desde AfterViewInit';
    component.ngAfterViewInit();
    expect(component.textAreaInputRef.nativeElement.value).toBe('Desde AfterViewInit');
  });

  it('should register onChange callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.handleInputChange({ target: { value: 'Cambio' } } as any);
    expect(fn).toHaveBeenCalledWith('Cambio');
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    component.handleInputChange({ target: { value: 'Probando' } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it('should disable textarea when setDisabledState is called', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    expect(component.textAreaInputRef.nativeElement.disabled).toBe(true);
  });

  it('should not emit or update if disabled in handleInputChange', () => {
    component.disabled = true;
    const emitSpy = jest.spyOn(component.valueChange, 'emit');
    component.handleInputChange({ target: { value: 'Texto nuevo' } } as any);
    expect(component.value).not.toBe('Texto nuevo');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should return false if currentValueLength is less than maxlength', () => {
    component.maxlength = 10;
    component.currentValueLength = 5;
    expect(component.hasExceededMaxLength()).toBe(false);
  });

  it('should return true if currentValueLength is equal to maxlength', () => {
    component.maxlength = 10;
    component.currentValueLength = 10;
    expect(component.hasExceededMaxLength()).toBe(true);
  });

  it('should return true if currentValueLength is greater than maxlength', () => {
    component.maxlength = 10;
    component.currentValueLength = 12;
    expect(component.hasExceededMaxLength()).toBe(true);
  });

  it('should return false if maxlength is 0', () => {
    component.maxlength = 0;
    component.currentValueLength = 100;
    expect(component.hasExceededMaxLength()).toBe(false);
  });

});
