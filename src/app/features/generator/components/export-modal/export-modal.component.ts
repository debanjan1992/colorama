import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ColorStore } from '../../../../store/color.store';
import { ExportService } from '../../../../core/services/export.service';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, Button, InputText, Select],
  templateUrl: './export-modal.component.html',
  styleUrl: './export-modal.component.scss',
})
export class ExportModalComponent {
  readonly store = inject(ColorStore);
  private readonly exportService = inject(ExportService);

  title = signal('');
  selectedColorSpace = signal('HEX');
  colorSpaces = signal([
    { label: 'HEX', value: 'HEX' },
    { label: 'RGB', value: 'RGB' },
    { label: 'HSL', value: 'HSL' },
    { label: 'LAB', value: 'LAB' },
  ]);

  async handleExport() {
    const colors = this.store.colors();
    const result = await this.exportService.exportAsPng(colors, {
      footerText: this.title() || 'Colorama',
      colorSpace: this.selectedColorSpace() as 'HEX' | 'RGB' | 'HSL' | 'LAB',
    });

    if (result.success && result.blob) {
      const fileName = this.title()
        ? `colorama-${this.title().toLowerCase().replace(/\s+/g, '-')}`
        : `colorama-palette-${Date.now()}`;
      this.exportService.downloadImage(result.blob, `${fileName}.png`);
      this.store.setExportDialogOpen(false);
    }
  }

  close() {
    this.store.setExportDialogOpen(false);
  }
}
