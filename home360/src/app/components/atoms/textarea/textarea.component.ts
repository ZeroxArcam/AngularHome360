import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss']
})
export class TextareaComponent {
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() value: string = '';
  @Input() textareaClass: string = '';
  @Input() maxlength: number | string | null = null;
  @Input() pattern: string = '';
  @Input() inputmode: string = '';
  @Input() restrictToNumbers: boolean = false;

  @Output() inputChange: EventEmitter<string> = new EventEmitter<string>();

  handleInput(event: any) {
    this.inputChange.emit(event.target.value);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }
}
