import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextareaComponent } from './textarea.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('TextareaComponent', () => {
  let component: TextareaComponent;
  let fixture: ComponentFixture<TextareaComponent>;
  let textareaElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextareaComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    textareaElement = fixture.debugElement.query(By.css('textarea'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the textarea id correctly', () => {
    const id = 'myTextareaId';
    component.id = id;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.id).toBe(id);
  });

  it('should set the textarea name correctly', () => {
    const name = 'comment';
    component.name = name;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.name).toBe(name);
  });

  it('should set the textarea placeholder correctly', () => {
    const placeholder = 'Enter your comment here';
    component.placeholder = placeholder;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.placeholder).toBe(placeholder);
  });

  it('should set the textarea required attribute when required is true', () => {
    component.required = true;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.required).toBeTruthy();
  });

  it('should not set the textarea required attribute when required is false', () => {
    component.required = false;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.required).toBeFalsy();
  });

  it('should set the textarea value correctly', () => {
    const value = 'Initial value';
    component.value = value;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.value).toBe(value);
  });

  it('should apply the textareaClass to the textarea element', () => {
    const textareaClass = 'input-like';
    component.textareaClass = textareaClass;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.classList).toContain('textarea');
    expect(textareaElement.nativeElement.classList).toContain(textareaClass);
  });

  it('should set the maxlength attribute correctly (number)', () => {
    const maxLength = 100;
    component.maxlength = maxLength;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.getAttribute('maxlength')).toBe(maxLength.toString());
  });

  it('should set the maxlength attribute correctly (string)', () => {
    const maxLength = '200';
    component.maxlength = maxLength;
    fixture.detectChanges();
    expect(textareaElement.nativeElement.getAttribute('maxlength')).toBe(maxLength);
  });

  it('should not have maxlength attribute by default', () => {
    expect(component.maxlength).toBeNull();
    expect(textareaElement.nativeElement.getAttribute('maxlength')).toBeNull();
  });

  it('should have default values for inputs', () => {
    expect(component.id).toBe('');
    expect(component.name).toBe('');
    expect(component.placeholder).toBe('');
    expect(component.required).toBe(false);
    expect(component.value).toBe('');
    expect(component.textareaClass).toBe('');
  });

  it('should have the default "textarea" class', () => {
    expect(textareaElement.nativeElement.classList).toContain('textarea');
  });

  it('should emit inputChange event on input', () => {
    jest.spyOn(component.inputChange, 'emit');
    const newValue = 'New input value';

    textareaElement.nativeElement.value = newValue;
    textareaElement.nativeElement.dispatchEvent(new Event('input'));

    expect(component.inputChange.emit).toHaveBeenCalledWith(newValue);
  });
});
