import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelComponent } from './label.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('LabelComponent', () => {
  let component: LabelComponent;
  let fixture: ComponentFixture<LabelComponent>;
  let labelElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LabelComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    labelElement = fixture.debugElement.query(By.css('label'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the "for" attribute correctly', () => {
    const forId = 'myInputId';
    component.for = forId;
    fixture.detectChanges();
    expect(labelElement.nativeElement.getAttribute('for')).toBe(forId);
  });

  it('should render the labelText correctly', () => {
    const text = 'Email Address';
    component.labelText = text;
    fixture.detectChanges();
    expect(labelElement.nativeElement.textContent).toContain(text);
  });

  it('should display the required star when isRequired is true', () => {
    component.isRequired = true;
    fixture.detectChanges();
    const requiredStar = labelElement.query(By.css('.required-star'));
    expect(requiredStar).toBeTruthy();
    expect(requiredStar.nativeElement.textContent).toBe('*');
  });

  it('should not display the required star when isRequired is false', () => {
    component.isRequired = false;
    fixture.detectChanges();
    const requiredStar = labelElement.query(By.css('.required-star'));
    expect(requiredStar).toBeFalsy();
  });

  it('should have the default "for" as an empty string', () => {
    expect(component.for).toBe('');
    expect(labelElement.nativeElement.getAttribute('for')).toBe('');
  });

  it('should have the default labelText as an empty string', () => {
    expect(component.labelText).toBe('');
    expect(labelElement.nativeElement.textContent).toBe('');
  });

  it('should have default isRequired as false', () => {
    expect(component.isRequired).toBe(false);
    const requiredStar = labelElement.query(By.css('.required-star'));
    expect(requiredStar).toBeFalsy();
  });

  it('should apply the "app-label" class to the label element', () => {
    expect(labelElement.nativeElement.classList).toContain('app-label');
  });
});
