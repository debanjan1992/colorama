import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { ColorToolsComponent } from '../color-tools/color-tools.component';
import namer from 'color-namer';
import chroma from 'chroma-js';
import { ColorItem, ColorStore } from '../../store/color.store';

@Component({
  selector: 'app-color-panel',
  standalone: true,
  imports: [ColorToolsComponent],
  templateUrl: './color-panel.component.html',
  styleUrl: './color-panel.component.scss',
})
export class ColorPanelComponent {
  readonly store = inject(ColorStore);
  private readonly el = inject(ElementRef);

  item = input.required<ColorItem>();

  delete = output<string>();
  lock = output<string>();

  color = computed(() => this.item().hex);

  showTools = computed(() => !this.store.activeShadesPanelId());

  isShadesOpen = computed(
    () => this.store.activeShadesPanelId() === this.item().id,
  );

  colorName = computed(() => {
    const names = namer(this.color());
    return names.ntc[0].name;
  });

  textColor = computed(() => {
    return this.getContrastColor(this.color());
  });

  colorDisplay = computed(() => {
    return this.color().replace('#', '');
  });

  shades = computed(() => {
    const l = chroma(this.color()).get('lab.l') / 100;

    return chroma
      .scale(['black', this.color(), 'white'])
      .domain([0, l, 1])
      .mode('lab')
      .colors(33);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isShadesOpen() && !this.el.nativeElement.contains(event.target)) {
      this.store.setActiveShadesPanel(null);
    }
  }

  @HostListener('document:keydown.escape')
  onDocumentKeydown() {
    if (this.isShadesOpen()) {
      this.store.setActiveShadesPanel(null);
    }
  }

  toggleShades() {
    if (this.isShadesOpen()) {
      this.store.setActiveShadesPanel(null);
    } else {
      this.store.setActiveShadesPanel(this.item().id);
    }
  }

  async selectShade(hex: string) {
    this.store.updateColor(this.item().id, hex);
    this.store.setActiveShadesPanel(null);

    try {
      await navigator.clipboard.writeText(hex);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyColor() {
    try {
      await navigator.clipboard.writeText(this.color());
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyShade(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  getDotColor(hex: string): string {
    return chroma(hex).luminance() > 0.5 ? 'black' : 'white';
  }

  getContrastColor(hex: string): 'black' | 'white' {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  }
}
