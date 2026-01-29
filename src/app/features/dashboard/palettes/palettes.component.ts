import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteItemComponent } from '../components/palette-item/palette-item.component';
import { SaveModalComponent } from '../../../components/save-modal/save-modal.component';
import { SavedPalette, ColorStore } from '../../../store/color.store';
import { Router } from '@angular/router';

import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-dashboard-palettes',
  standalone: true,
  imports: [
    CommonModule,
    PaletteItemComponent,
    SaveModalComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './palettes.component.html',
})
export class DashboardPalettesComponent implements OnInit {
  private readonly router = inject(Router);
  public readonly confirmationService = inject(ConfirmationService);
  readonly store = inject(ColorStore);

  savedPalettes = signal<SavedPalette[]>([]);

  constructor() {
    effect(() => {
      // Reload palettes when the save dialog closes (might have been an edit)
      if (!this.store.isSaveDialogOpen()) {
        this.loadPalettes();
      }
    });
  }

  ngOnInit() {
    this.loadPalettes();
  }

  loadPalettes() {
    const data = localStorage.getItem('saved_palettes');
    if (data) {
      try {
        this.savedPalettes.set(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse saved palettes', e);
        this.savedPalettes.set([]);
      }
    }
  }

  deletePalette(id: string) {
    const palette = this.savedPalettes().find((p) => p.id === id);
    this.confirmationService.confirm({
      header: palette?.name || 'Delete Confirmation',
      message: 'Are you sure you want to delete this palette?',
      acceptLabel: 'Delete Palette',
      rejectLabel: 'Cancel',
      accept: () => {
        const current = this.savedPalettes();
        const updated = current.filter((p) => p.id !== id);
        localStorage.setItem('saved_palettes', JSON.stringify(updated));
        this.savedPalettes.set(updated);
      },
    });
  }

  duplicatePalette(palette: SavedPalette) {
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newPalette: SavedPalette = {
      ...palette,
      id: crypto.randomUUID(),
      name: `${palette.name} (Copy ${randomStr})`,
      timestamp: Date.now(),
    };

    const current = this.savedPalettes();
    const updated = [newPalette, ...current];
    localStorage.setItem('saved_palettes', JSON.stringify(updated));
    this.savedPalettes.set(updated);
  }

  viewPalette(palette: SavedPalette) {
    // Navigate to generator with the palette colors
    const hexList = palette.colors.map((c) => c.replace('#', '')).join('-');
    this.router.navigate(['/generator'], { queryParams: { colors: hexList } });
  }
}
