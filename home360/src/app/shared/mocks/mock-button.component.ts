import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: '<button [type]="type" (click)="handleClick()" [class.primary]="isPrimary">{{ buttonText }}</button>',
  styles: [`
    .primary {
      background-color: blue;
      color: white;
    }
  `]
})
export class MockButtonComponent {
  @Input() buttonText: string = '';
  @Input() isPrimary: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() click = new EventEmitter<Event>();

  handleClick() {
    this.click.emit();
  }
}
