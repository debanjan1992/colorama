import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorStore } from '../../store/color.store';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'app-save-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, Button, InputText, Textarea],
  templateUrl: './save-palette.component.html',
  styleUrl: './save-palette.component.css',
})
export class SavePaletteComponent {
  readonly store = inject(ColorStore);

  name = signal('');
  description = signal('');
  tags = signal<string[]>([]);
  tagsString = signal('');

  onTagsChange(value: string) {
    this.tagsString.set(value);
  }

  handleTagInput(event: KeyboardEvent) {
    const value = this.tagsString().trim();
    if ((event.key === 'Enter' || event.key === ',') && value) {
      event.preventDefault();

      if (this.tags().length >= 5) {
        return;
      }

      const sanitized = value.replace(/,/g, '').trim();
      if (sanitized && !this.tags().includes(sanitized)) {
        this.tags.set([...this.tags(), sanitized]);
      }
      this.tagsString.set('');
    }
  }

  removeTag(index: number) {
    this.tags.set(this.tags().filter((_, i) => i !== index));
  }

  onClose() {
    this.store.setSaveDialogOpen(false);
    this.resetFields();
  }

  onSave() {
    if (!this.name()) return;

    this.store.savePalette({
      name: this.name(),
      description: this.description(),
      tags: this.tags(),
    });
    this.resetFields();
  }

  private resetFields() {
    this.name.set('');
    this.description.set('');
    this.tags.set([]);
  }
}
