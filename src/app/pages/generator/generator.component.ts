import {
  Component,
  HostListener,
  inject,
  OnInit,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ColorStore } from '../../store/color.store';
import { ColorPanelComponent } from '../../components/color-panel/color-panel.component';
import { Tooltip } from 'primeng/tooltip';
import { ExportService } from '../../core/services/export.service';

@Component({
  standalone: true,
  imports: [ColorPanelComponent, ToolbarComponent, Tooltip],
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrl: './generator.component.scss',
})
export class GeneratorComponent implements OnInit {
  readonly store = inject(ColorStore);
  private readonly exportService = inject(ExportService);

  paletteContainer = viewChild<ElementRef>('paletteContainer');

  ngOnInit() {
    this.store.generateColors();
  }

  isFullscreen = signal(false);

  async toggleFullscreen() {
    if (!this.isFullscreen()) {
      // Enter fullscreen
      try {
        await document.documentElement.requestFullscreen();
        this.isFullscreen.set(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    } else {
      // Exit fullscreen
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        this.isFullscreen.set(false);
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  }

  async exportAsPng() {
    const colors = this.store.colors();

    const result = await this.exportService.exportAsPng(colors);

    if (result.success && result.blob) {
      this.exportService.downloadImage(result.blob);
    } else {
      console.error('Failed to export palette:', result.error);
      // TODO: Show user-friendly error message
    }
  }

  @HostListener('window:keydown.space', ['$event'])
  handleSpace(event: Event) {
    if (this.store.activeShadesPanelId()) return;

    event.preventDefault();
    this.store.generateColors();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  @HostListener('window:keydown.f', ['$event'])
  handleFullscreen(event: Event) {
    event.preventDefault();
    this.toggleFullscreen();
  }

  insertColor(index: number) {
    this.store.insertColor(index);
  }

  draggedIndex = signal<number | null>(null);
  allowDrag = signal(false);

  onDragStart(index: number) {
    if (!this.allowDrag()) return;
    this.draggedIndex.set(index);

    this.store.reorderColors(index, index);
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    const draggedIdx = this.draggedIndex();
    if (draggedIdx === null || draggedIdx === index) return;

    const from = draggedIdx;
    const to = index;

    if (
      'startViewTransition' in document &&
      typeof (
        document as { startViewTransition?: (callback: () => void) => void }
      ).startViewTransition === 'function'
    ) {
      (
        document as { startViewTransition: (callback: () => void) => void }
      ).startViewTransition(() => {
        this.store.reorderColors(from, to, true);
        this.draggedIndex.set(to);
      });
    } else {
      this.store.reorderColors(from, to, true);
      this.draggedIndex.set(to);
    }
  }

  onDrop(index: number) {
    const draggedIdx = this.draggedIndex();
    if (draggedIdx !== null && draggedIdx !== index) {
      this.store.reorderColors(draggedIdx, index);
    }
    this.draggedIndex.set(null);
    this.allowDrag.set(false);
  }

  onDragEnd() {
    this.draggedIndex.set(null);
    this.allowDrag.set(false);
  }
}
