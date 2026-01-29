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
import { ColorItem, ColorStore } from '../../../../store/color.store';
import {
  getContrastColor,
  hexToRgb,
  hexToHsl,
  getContrastRatio,
  getWCAGLevel,
} from '../../../../utils/color-utils';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { APP_CONFIG } from '../../../../config/app.config';

@Component({
  selector: 'app-color-panel',
  standalone: true,
  imports: [ColorToolsComponent, Tooltip],
  templateUrl: './color-panel.component.html',
  styleUrl: './color-panel.component.scss',
})
export class ColorPanelComponent {
  readonly store = inject(ColorStore);
  private readonly el = inject(ElementRef);
  private readonly messageService = inject(MessageService);

  item = input.required<ColorItem>();

  delete = output<string>();
  lock = output<string>();
  allowDrag = output<boolean>();

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
    return getContrastColor(this.color());
  });

  colorDisplay = computed(() => {
    return this.color().replace('#', '');
  });

  rgbDisplay = computed(() => {
    return hexToRgb(this.color());
  });

  hslDisplay = computed(() => {
    return hexToHsl(this.color());
  });

  contrastRatio = computed(() => {
    return getContrastRatio(this.textColor(), this.color());
  });

  wcagLevel = computed(() => {
    return getWCAGLevel(this.contrastRatio());
  });

  shades = computed(() => {
    const color = this.color();
    const l = chroma(color).get('lab.l') / 100;
    const count = 33;
    const colorIndex = Math.round(l * (count - 1));

    const shadesBefore = chroma
      .scale(['black', color])
      .mode('lab')
      .colors(colorIndex + 1);
    const shadesAfter = chroma
      .scale([color, 'white'])
      .mode('lab')
      .colors(count - colorIndex);

    return [...shadesBefore.slice(0, -1), ...shadesAfter];
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
      this.messageService.add({
        severity: 'success',
        summary: `Shade applied and copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyColor() {
    try {
      const color = this.color();
      await navigator.clipboard.writeText(color);
      this.messageService.add({
        severity: 'success',
        summary: `Color copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyShade(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      this.messageService.add({
        severity: 'success',
        summary: `Shade ${hex.toUpperCase()} copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyRgb() {
    try {
      const rgb = hexToRgb(this.color());
      await navigator.clipboard.writeText(rgb);
      this.messageService.add({
        severity: 'success',
        summary: `Color copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async copyHsl() {
    try {
      const hsl = hexToHsl(this.color());
      await navigator.clipboard.writeText(hsl);
      this.messageService.add({
        severity: 'success',
        summary: `Color copied`,
        life: APP_CONFIG.toast.life,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  getDotColor(hex: string): string {
    return chroma(hex).luminance() > 0.5 ? 'black' : 'white';
  }

  getContrastColor(hex: string): 'black' | 'white' {
    return getContrastColor(hex);
  }
}
