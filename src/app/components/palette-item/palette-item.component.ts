import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorStore, SavedPalette } from '../../store/color.store';
import { MessageService, MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { APP_CONFIG } from '../../config/app.config';
import { getContrastColor } from '../../utils/color-utils';

@Component({
  selector: 'app-palette-item',
  standalone: true,
  imports: [CommonModule, Menu],
  templateUrl: './palette-item.component.html',
  styleUrl: './palette-item.component.scss',
})
export class PaletteItemComponent {
  private readonly messageService = inject(MessageService);
  private readonly store = inject(ColorStore);

  palette = input.required<SavedPalette>();

  delete = output<string>();
  view = output<SavedPalette>();
  duplicate = output<SavedPalette>();

  menuItems: MenuItem[] = [
    {
      label: 'Edit details',
      icon: 'pi pi-pencil',
      command: () => this.store.setSaveDialogOpen(true, this.palette()),
    },
    {
      label: 'Duplicate',
      icon: 'pi pi-copy',
      command: () => this.duplicate.emit(this.palette()),
    },
    {
      label: 'Open in Generator',
      icon: 'pi pi-external-link',
      command: () => this.view.emit(this.palette()),
    },
    {
      separator: true,
    },
    {
      label: 'Delete Palette',
      icon: 'pi pi-trash',
      styleClass: 'menu-item-danger',
      command: () => this.delete.emit(this.palette().id),
    },
  ];

  getContrastColor(hex: string): 'black' | 'white' {
    return getContrastColor(hex);
  }

  formatHex(hex: string): string {
    return hex.replace('#', '').toUpperCase();
  }

  async copyColor(event: Event, hex: string) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(hex);
      this.messageService.add({
        severity: 'success',
        summary: `Color ${hex.toUpperCase()} copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy color: ', err);
    }
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
