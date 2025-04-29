import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    buttonElement = fixture.debugElement.query(By.css('button'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the button text', () => {
    const text = 'Click Me!';
    component.buttonText = text;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.textContent).toContain(text);
  });

  it('should apply the primary class when isPrimary is true', () => {
    component.isPrimary = true;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList).toContain('button--primary');
  });

  it('should not apply the primary class when isPrimary is false', () => {
    component.isPrimary = false;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList).not.toContain('button--primary');
  });

  it('should set the button type correctly', () => {
    const type = 'submit';
    component.type = type;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.type).toBe(type);
  });

  it('should emit buttonClick event when clicked', () => {
    jest.spyOn(component.buttonClick, 'emit');

    buttonElement.nativeElement.click();

    expect(component.buttonClick.emit).toHaveBeenCalled();
  });
});
