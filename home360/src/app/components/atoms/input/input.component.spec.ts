import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onChange and onTouched on input', () => {
    const onChangeSpy = jest.fn();
    const onTouchedSpy = jest.fn();

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));

    expect(onChangeSpy).toHaveBeenCalledWith('test');
    expect(onTouchedSpy).toHaveBeenCalled();
    expect(component.value).toBe('test');
  });

  it('should write value', () => {
    component.writeValue('abc');
    expect(component.value).toBe('abc');
  });

  it('should register onChange and onTouched', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    component.registerOnChange(fn1);
    component.registerOnTouched(fn2);

    expect(component.onChange).toBe(fn1);
    expect(component.onTouched).toBe(fn2);
  });

  it('should disable input when setDisabledState(true)', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(input.disabled).toBe(true);
  });

  it('should update value and disabled state on formControl change (ngOnChanges)', () => {
    const control = new FormControl({ value: 'hello', disabled: true });
    component.formControl = control;

    component.ngOnChanges({
      formControl: {
        currentValue: control,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.value).toBe('hello');
    expect(component.disabled).toBe(true);
  });

  it('should update formControl value when input changes', () => {
    component.formControl = new FormControl('');
    component.value = '';

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'new value';
    input.dispatchEvent(new Event('input'));

    expect(component.formControl.value).toBe('new value');
  });

  it('should bind input attributes correctly', () => {
    component.type = 'number';
    component.id = 'test-id';
    component.name = 'test-name';
    component.placeholder = 'Enter value';
    component.required = true;
    component.inputClass = 'custom-class';
    component.maxlength = 50;
    component.min = '1';
    component.max = '100';

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement;

    expect(input.type).toBe('number');
    expect(input.id).toBe('test-id');
    expect(input.name).toBe('test-name');
    expect(input.placeholder).toBe('Enter value');
    expect(input.required).toBe(true);
    expect(input.className).toContain('custom-class');
    expect(input.maxLength).toBe(50);
    expect(input.getAttribute('min')).toBe('1');
    expect(input.getAttribute('max')).toBe('100');
  });
});
