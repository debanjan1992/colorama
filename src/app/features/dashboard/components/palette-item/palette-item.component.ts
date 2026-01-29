import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorStore } from '../../../../store/color.store';
import { SavedPalette } from '../../../../core/models/color.models';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { ColorService } from '../../../../core/services/color.service';

@Component({
  selector: 'app-palette-item',
  standalone: true,
  imports: [CommonModule, Menu],
  templateUrl: './palette-item.component.html',
  styleUrl: './palette-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteItemComponent {
  private readonly store = inject(ColorStore);
  private readonly clipboardService = inject(ClipboardService);
  private readonly colorService = inject(ColorService);

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
    return this.colorService.getContrastColor(hex);
  }

  formatHex(hex: string): string {
    return hex.replace('#', '').toUpperCase();
  }

  async copyColor(event: Event, hex: string) {
    event.stopPropagation();
    await this.clipboardService.copyText(
      hex,
      `Color ${hex.toUpperCase()} copied`,
    );
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
