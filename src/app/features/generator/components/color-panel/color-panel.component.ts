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
import { ColorStore } from '../../../../store/color.store';
import { ColorItem } from '../../../../core/models/color.models';
import { Tooltip } from 'primeng/tooltip';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { ColorService } from '../../../../core/services/color.service';

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
  private readonly clipboardService = inject(ClipboardService);
  private readonly colorService = inject(ColorService);

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
    return this.colorService.getContrastColor(this.color());
  });

  colorDisplay = computed(() => {
    return this.color().replace('#', '');
  });

  rgbDisplay = computed(() => {
    return this.colorService.hexToRgb(this.color());
  });

  hslDisplay = computed(() => {
    return this.colorService.hexToHsl(this.color());
  });

  contrastRatio = computed(() => {
    return this.colorService.getContrastRatio(this.textColor(), this.color());
  });

  wcagLevel = computed(() => {
    return this.colorService.getWCAGLevel(this.contrastRatio());
  });

  shades = computed(() => {
    return this.colorService.generateShades(this.color());
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

    await this.clipboardService.copyText(hex, `Shade applied and copied`);
  }

  async copyColor() {
    const color = this.color();
    await this.clipboardService.copyText(color, `Color copied`);
  }

  async copyShade(hex: string) {
    await this.clipboardService.copyText(
      hex,
      `Shade ${hex.toUpperCase()} copied`,
    );
  }

  async copyRgb() {
    const rgb = this.colorService.hexToRgb(this.color());
    await this.clipboardService.copyText(rgb, `Color copied`);
  }

  async copyHsl() {
    const hsl = this.colorService.hexToHsl(this.color());
    await this.clipboardService.copyText(hsl, `Color copied`);
  }

  getDotColor(hex: string): string {
    return this.colorService.getContrastColor(hex);
  }

  getContrastColor(hex: string): 'black' | 'white' {
    return this.colorService.getContrastColor(hex);
  }
}
