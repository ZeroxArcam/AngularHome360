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
  @Output() inputChange: EventEmitter<string> = new EventEmitter<string>();

  handleInput(event: any) {
    this.inputChange.emit(event.target.value);
  }
}
