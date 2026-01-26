import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ColorStore } from './store/color.store';
import { ColorPanelComponent } from './components/color-panel/color-panel.component';
import { SavePaletteComponent } from './components/save-palette/save-palette.component';

@Component({
  standalone: true,
  imports: [ColorPanelComponent, ToolbarComponent, SavePaletteComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly store = inject(ColorStore);

  ngOnInit() {
    this.store.generateColors();
  }

  @HostListener('window:keydown.space', ['$event'])
  handleSpace(event: Event) {
    if (this.store.activeShadesPanelId()) return;

    event.preventDefault();
    this.store.generateColors();
  }

  insertColor(index: number) {
    this.store.insertColor(index);
  }

  draggedIndex: number | null = null;
  allowDrag = false;

  onDragStart(index: number) {
    if (!this.allowDrag) return;
    this.draggedIndex = index;
    // Capture history only once at the start of a drag
    this.store.reorderColors(index, index);
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) return;

    const from = this.draggedIndex;
    const to = index;

    // Use View Transition API for smooth animations
    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        this.store.reorderColors(from, to, true); // Skip history for intermediate moves
        this.draggedIndex = to;
      });
    } else {
      this.store.reorderColors(from, to, true);
      this.draggedIndex = to;
    }
  }

  onDrop(index: number) {
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      this.store.reorderColors(this.draggedIndex, index);
    }
    this.draggedIndex = null;
    this.allowDrag = false;
  }

  onDragEnd() {
    this.draggedIndex = null;
    this.allowDrag = false;
  }
}
