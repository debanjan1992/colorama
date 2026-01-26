import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorItem, ColorStore } from '../../store/color.store';

@Component({
  selector: 'app-color-tools',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-tools.component.html',
})
export class ColorToolsComponent {
  readonly store = inject(ColorStore);

  item = input.required<ColorItem>();
  isRemovable = computed(() => this.store.colors().length > 2);

  remove = output<void>();
  toggleShades = output<void>();
  copyHex = output<void>();
  toggleLock = output<void>();
}
