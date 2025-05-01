import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextareaFieldComponent } from './textarea-field.component';
import { LabelComponent } from '../../atoms/label/label.component';
import { TextareaComponent } from '../../atoms/textarea/textarea.component';

describe('TextareaFieldComponent', () => {
  let component: TextareaFieldComponent;
  let fixture: ComponentFixture<TextareaFieldComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextareaFieldComponent, LabelComponent, TextareaComponent]
    });
    fixture = TestBed.createComponent(TextareaFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
