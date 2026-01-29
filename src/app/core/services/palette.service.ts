import { Injectable } from '@angular/core';
import { SavedPalette } from '../models/color.models';

@Injectable({
  providedIn: 'root',
})
export class PaletteService {
  private readonly STORAGE_KEY = 'saved_palettes';

  getPalettes(): SavedPalette[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  savePalette(palette: SavedPalette): void {
    const palettes = this.getPalettes();
    const updated = [palette, ...palettes];
    this.saveToStorage(updated);
  }

  updatePalette(id: string, updates: Partial<SavedPalette>): void {
    const palettes = this.getPalettes();
    const index = palettes.findIndex((p) => p.id === id);
    if (index !== -1) {
      palettes[index] = { ...palettes[index], ...updates };
      this.saveToStorage(palettes);
    }
  }

  deletePalette(id: string): SavedPalette[] {
    const palettes = this.getPalettes();
    const updated = palettes.filter((p) => p.id !== id);
    this.saveToStorage(updated);
    return updated;
  }

  private saveToStorage(palettes: SavedPalette[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(palettes));
  }
}
