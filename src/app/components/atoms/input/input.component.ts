import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() value: any = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() inputClass: string = '';
}
