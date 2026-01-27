import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { ColorStore } from '../../store/color.store';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

export interface ToolbarAction {
  icon: string | (() => string);
  tooltip: string;
  label?: string;
  action?: () => void;
  disabled?: () => boolean;
  styleClass?: string | (() => string);
}

export interface ToolbarSection {
  id: string;
  actions: ToolbarAction[];
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [Button, Tooltip],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css',
})
export class ToolbarComponent {
  readonly store = inject(ColorStore);
  private readonly router = inject(Router);

  exportPng = output<void>();
  copyLink = output<void>();
  toggleFullscreen = output<void>();

  getIcon(action: ToolbarAction): string {
    return typeof action.icon === 'function' ? action.icon() : action.icon;
  }

  getStyleClass(action: ToolbarAction): string {
    const baseClass =
      typeof action.styleClass === 'function'
        ? action.styleClass()
        : action.styleClass || '';
    return `toolbar-btn ${baseClass} ${action.label ? 'btn-with-label' : ''}`;
  }

  readonly sections: ToolbarSection[] = [
    {
      id: 'extra',
      actions: [
        {
          label: 'Generate',
          icon: 'pi pi-sparkles',
          tooltip: 'Generate (Spacebar)',
          action: () => this.store.generateColors(),
        },
        {
          icon: () =>
            this.store.enforceAccessibility()
              ? 'pi pi-check-circle'
              : 'pi pi-user',
          tooltip: 'Accessible Mode (Enforce 4.5+ contrast)',
          action: () => this.store.toggleAccessibility(),
          styleClass: () =>
            this.store.enforceAccessibility() ? '!text-indigo-600' : '',
        },
      ],
    },
    {
      id: 'export',
      actions: [
        {
          icon: 'pi pi-link',
          tooltip: 'Copy Link',
          action: () => this.copyLink.emit(),
        },
        {
          icon: 'pi pi-download',
          tooltip: 'Download PNG',
          action: () => this.exportPng.emit(),
        },
        {
          icon: 'pi pi-window-maximize',
          tooltip: 'Fullscreen (F)',
          action: () => this.toggleFullscreen.emit(),
        },
      ],
    },
    {
      id: 'history',
      actions: [
        {
          icon: 'pi pi-undo',
          tooltip: 'Undo',
          action: () => this.store.undo(),
          disabled: () => this.store.history().length === 0,
        },
        {
          icon: 'pi pi-undo',
          tooltip: 'Redo',
          action: () => this.store.redo(),
          disabled: () => this.store.future().length === 0,
          styleClass: 'scale-x-[-1]',
        },
      ],
    },
    {
      id: 'main',
      actions: [
        {
          label: 'Save',
          icon: 'pi pi-heart',
          tooltip: 'Save to library',
          action: () => this.store.setSaveDialogOpen(true),
        },
      ],
    },
  ];
}
