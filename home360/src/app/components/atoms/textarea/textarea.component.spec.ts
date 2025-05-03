import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextareaComponent } from './textarea.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('TextareaComponent', () => {
  let component: TextareaComponent;
  let fixture: ComponentFixture<TextareaComponent>;
  let textarea: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextareaComponent]
    });
    fixture = TestBed.createComponent(TextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    textarea = fixture.debugElement.query(By.css('textarea'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit inputChange when handleInput is called', () => {
    jest.spyOn(component.inputChange, 'emit');
    const inputValue = 'new input value';
    textarea.triggerEventHandler('input', { target: { value: inputValue } });
    expect(component.inputChange.emit).toHaveBeenCalledWith(inputValue);
  });

  it('should prevent non-numeric input when restrictToNumbers is true', () => {
    component.restrictToNumbers = true;
    fixture.detectChanges();

    const textareaEl = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    const event = new KeyboardEvent('keypress', { key: 'a', cancelable: true });
    const preventSpy = jest.spyOn(event, 'preventDefault');

    textareaEl.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
  });

  it('should allow numeric input when restrictToNumbers is true', () => {
    component.restrictToNumbers = true;
    fixture.detectChanges();

    const textareaEl = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    const event = new KeyboardEvent('keypress', { key: '5', cancelable: true });
    const preventSpy = jest.spyOn(event, 'preventDefault');

    textareaEl.dispatchEvent(event);

    expect(preventSpy).not.toHaveBeenCalled();
  });

});
