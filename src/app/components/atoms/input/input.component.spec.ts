import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;
  let inputElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    inputElement = fixture.debugElement.query(By.css('input'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the input type correctly', () => {
    const type = 'email';
    component.type = type;
    fixture.detectChanges();
    expect(inputElement.nativeElement.type).toBe(type);
  });

  it('should set the input id correctly', () => {
    const id = 'my-input';
    component.id = id;
    fixture.detectChanges();
    expect(inputElement.nativeElement.id).toBe(id);
  });

  it('should set the input name correctly', () => {
    const name = 'user-email';
    component.name = name;
    fixture.detectChanges();
    expect(inputElement.nativeElement.name).toBe(name);
  });

  it('should set the input value correctly', () => {
    const value = 'test@example.com';
    component.value = value;
    fixture.detectChanges();
    expect(inputElement.nativeElement.value).toBe(value);
  });

  it('should set the input placeholder correctly', () => {
    const placeholder = 'Enter your email';
    component.placeholder = placeholder;
    fixture.detectChanges();
    expect(inputElement.nativeElement.placeholder).toBe(placeholder);
  });

  it('should set the input required attribute when required is true', () => {
    component.required = true;
    fixture.detectChanges();
    expect(inputElement.nativeElement.required).toBeTruthy();
  });

  it('should not set the input required attribute when required is false', () => {
    component.required = false;
    fixture.detectChanges();
    expect(inputElement.nativeElement.required).toBeFalsy();
  });

  it('should apply the inputClass to the input element', () => {
    const inputClass = 'custom-input-class';
    component.inputClass = inputClass;
    fixture.detectChanges();
    expect(inputElement.nativeElement.classList).toContain('input');
    expect(inputElement.nativeElement.classList).toContain(inputClass);
  });

  it('should have the default type "text"', () => {
    expect(component.type).toBe('text');
    expect(inputElement.nativeElement.type).toBe('text');
  });

  it('should have an empty default id', () => {
    expect(component.id).toBe('');
    expect(inputElement.nativeElement.id).toBe('');
  });

  it('should have an empty default name', () => {
    expect(component.name).toBe('');
    expect(inputElement.nativeElement.name).toBe('');
  });

  it('should have an empty default value', () => {
    expect(component.value).toBe('');
    expect(inputElement.nativeElement.value).toBe('');
  });

  it('should have an empty default placeholder', () => {
    expect(component.placeholder).toBe('');
    expect(inputElement.nativeElement.placeholder).toBe('');
  });

  it('should have default required as false', () => {
    expect(component.required).toBe(false);
    expect(inputElement.nativeElement.required).toBeFalsy();
  });

  it('should have the default "input" class and an empty inputClass property', () => {
    expect(component.inputClass).toBe('');
    expect(inputElement.nativeElement.className).toContain('input');
  });

  it('should apply the "input--form-control" class when inputClass is set to "input--form-control"', () => {
    const formControlClass = 'input--form-control';
    component.inputClass = formControlClass;
    fixture.detectChanges();
    expect(inputElement.nativeElement.classList).toContain('input');
    expect(inputElement.nativeElement.classList).toContain(formControlClass);
  });
});
