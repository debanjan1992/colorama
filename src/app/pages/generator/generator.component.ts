import {
  Component,
  HostListener,
  inject,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ColorStore } from '../../store/color.store';
import { ColorPanelComponent } from '../../components/color-panel/color-panel.component';
import { ExportModalComponent } from '../../components/export-modal/export-modal.component';
import { SaveModalComponent } from '../../components/save-modal/save-modal.component';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ExportService } from '../../core/services/export.service';
import { APP_CONFIG } from '../../config/app.config';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  standalone: true,
  imports: [
    ColorPanelComponent,
    ToolbarComponent,
    Tooltip,
    ExportModalComponent,
    SaveModalComponent,
    HeaderComponent,
  ],
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrl: './generator.component.scss',
})
export class GeneratorComponent {
  readonly store = inject(ColorStore);
  private readonly exportService = inject(ExportService);
  private readonly messageService = inject(MessageService);

  paletteContainer = viewChild<ElementRef>('paletteContainer');

  isFullscreen = signal(false);

  constructor() {
    this.store.syncUrl();
  }

  async toggleFullscreen() {
    if (!this.isFullscreen()) {
      try {
        await document.documentElement.requestFullscreen();
        this.isFullscreen.set(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    } else {
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

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.messageService.add({
        severity: 'success',
        summary: 'Link copied to clipboard',
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  }

  async exportAsPng() {
    this.store.setExportDialogOpen(true);
  }

  @HostListener('window:keydown.space', ['$event'])
  handleSpace(event: Event) {
    const target = event.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(
      target.tagName,
    );
    const isDialogueOpen =
      this.store.isSaveDialogOpen() || this.store.isExportDialogOpen();

    if (
      this.store.activeShadesPanelId() ||
      isInput ||
      isDialogueOpen ||
      target.isContentEditable
    ) {
      return;
    }

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
