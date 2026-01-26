import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorStore } from '../../store/color.store';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class ToolbarComponent {
  readonly store = inject(ColorStore);
}
