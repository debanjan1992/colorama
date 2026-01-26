import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorItem, ColorStore } from '../../store/color.store';

import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-color-tools',
  standalone: true,
  imports: [CommonModule, Button, Tooltip],
  templateUrl: './color-tools.component.html',
})
export class ColorToolsComponent {
  readonly store = inject(ColorStore);

  item = input.required<ColorItem>();
  textColor = input<string>('inherit');
  isRemovable = computed(() => this.store.colors().length > 2);

  remove = output<void>();
  toggleShades = output<void>();
  copyHex = output<void>();
  toggleLock = output<void>();
}
