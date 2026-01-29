import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorItem, ColorStore } from '../../../../store/color.store';

import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { APP_CONFIG } from '../../../../config/app.config';

interface ToolButton {
  icon: string;
  tooltip: string;
  action: () => void;
  visible?: boolean;
  alwaysVisible?: boolean;
  customClass?: string;
  customStyle?: Record<string, string>;
  customEvents?: Record<string, (event?: Event) => void>;
}

@Component({
  selector: 'app-color-tools',
  standalone: true,
  imports: [CommonModule, Button, Tooltip],
  templateUrl: './color-tools.component.html',
  styleUrl: './color-tools.component.scss',
})
export class ColorToolsComponent {
  readonly store = inject(ColorStore);

  item = input.required<ColorItem>();
  textColor = input<string>('inherit');
  isRemovable = computed(
    () => this.store.colors().length > APP_CONFIG.colors.minCount,
  );

  remove = output<void>();
  toggleShades = output<void>();
  copyHex = output<void>();
  toggleLock = output<void>();
  allowDrag = output<boolean>();

  tools = computed<ToolButton[]>(() => [
    {
      icon: 'pi pi-bars',
      tooltip: 'Drag',
      action: () => null,
      customClass: 'drag-handle',
      customStyle: { cursor: 'grab' },
      customEvents: {
        mouseenter: () => this.allowDrag.emit(true),
        mouseleave: () => this.allowDrag.emit(false),
        mousedown: () => this.allowDrag.emit(true),
        mouseup: () => this.allowDrag.emit(false),
      },
    },
    {
      icon: 'pi pi-times',
      tooltip: 'Remove color',
      action: () => this.remove.emit(),
      visible: this.isRemovable(),
      customClass: 'hidden md:block',
    },
    {
      icon: 'pi pi-th-large',
      tooltip: 'View shades',
      action: () => this.toggleShades.emit(),
      customClass: 'hidden md:block',
    },
    {
      icon: 'pi pi-copy',
      tooltip: 'Copy HEX',
      action: () => this.copyHex.emit(),
    },
    {
      icon: this.item().locked ? 'pi pi-lock' : 'pi pi-lock-open',
      tooltip: this.item().locked ? 'Unlock' : 'Lock',
      action: () => this.toggleLock.emit(),
      alwaysVisible: this.item().locked,
    },
  ]);

  getToolStyles(tool: ToolButton): Record<string, string> {
    return {
      color: this.textColor(),
      ...(tool.customStyle || {}),
    };
  }
}
