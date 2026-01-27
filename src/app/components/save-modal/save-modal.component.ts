import { Component, inject, signal, effect } from '@angular/core';
import { ColorPickerModule } from 'primeng/colorpicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ColorStore } from '../../store/color.store';

@Component({
  selector: 'app-save-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    Button,
    InputText,
    Textarea,
    ColorPickerModule,
  ],
  templateUrl: './save-modal.component.html',
  styleUrl: './save-modal.component.scss',
})
export class SaveModalComponent {
  readonly store = inject(ColorStore);

  name = signal('');
  description = signal('');
  tagsString = signal('');
  colors = signal<string[]>([]);

  constructor() {
    effect(() => {
      const editing = this.store.editingPalette();
      if (editing) {
        this.name.set(editing.name);
        this.description.set(editing.description);
        this.tagsString.set(editing.tags.join(', '));
        this.colors.set([...editing.colors]); // Clone array
      } else {
        this.resetFields();
      }
    });
  }

  handleSave() {
    const metadata = {
      name: this.name() || 'Untitled Palette',
      description: this.description(),
      tags: this.tagsString()
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      colors: this.colors(),
    };

    const editing = this.store.editingPalette();
    if (editing) {
      this.store.updatePalette(editing.id, metadata);
    } else {
      this.store.savePalette(metadata);
    }

    this.resetFields();
  }

  resetFields() {
    this.name.set('');
    this.description.set('');
    this.tagsString.set('');
    this.colors.set([]);
  }

  updateColor(index: number, newColor: any) {
    if (!newColor) return;
    const currentCallback = this.colors();
    const updated = [...currentCallback];
    const colorStr = newColor.toString();
    updated[index] = colorStr.startsWith('#') ? colorStr : `#${colorStr}`;
    this.colors.set(updated);
  }

  close() {
    this.store.setSaveDialogOpen(false);
  }
}
