import { Component, inject } from '@angular/core';
import { ColorStore } from '../../store/color.store';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

export interface ToolbarAction {
  icon: string;
  tooltip: string;
  label?: string;
  action?: () => void;
  disabled?: () => boolean;
  styleClass?: string;
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
        // { label: 'View', icon: 'pi pi-eye', tooltip: 'View palette' },
        // { label: 'Export', icon: 'pi pi-upload', tooltip: 'Export palette' },
        {
          label: 'Save',
          icon: 'pi pi-heart',
          tooltip: 'Save to collections',
          action: () => this.store.setSaveDialogOpen(true),
        },
      ],
    },
  ];
}
