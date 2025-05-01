import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent {
  @Input() for: string = '';
  @Input() labelText: string = '';
  @Input() isRequired: boolean = false;
}
