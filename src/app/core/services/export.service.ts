import { Injectable, inject } from '@angular/core';
import { ColorItem } from '../models/color.models';
import chroma from 'chroma-js';
import { ExportOptions, ExportResult } from '../models/export.models';
import { APP_CONFIG } from '../../config/app.config';
import { ColorService } from './color.service';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly colorService = inject(ColorService);

  /**
   * Exports a color palette as a PNG image
   * @param colors - Array of color items to export
   * @param options - Export configuration options
   * @returns Promise with export result containing blob or error
   */
  async exportAsPng(
    colors: ColorItem[],
    options?: Partial<ExportOptions>,
  ): Promise<ExportResult> {
    const defaultOptions: ExportOptions = {
      width: APP_CONFIG.export.imageWidth,
      height: APP_CONFIG.export.paletteHeight,
      includeFooter: true,
      footerHeight: APP_CONFIG.export.footerHeight,
      footerText: 'Colorama',
    };

    const config = { ...defaultOptions, ...options };

    try {
      const totalHeight = config.includeFooter
        ? config.height + (config.footerHeight || 0)
        : config.height;

      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = totalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return {
          success: false,
          error: 'Failed to get canvas context',
        };
      }

      this.drawPalette(ctx, colors, config);

      if (config.includeFooter && config.footerHeight) {
        this.drawFooter(ctx, config);
      }

      const blob = await this.canvasToBlob(canvas);
      if (!blob) {
        return {
          success: false,
          error: 'Failed to create image blob',
        };
      }

      return {
        success: true,
        blob,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Downloads the exported image
   * @param blob - Image blob to download
   * @param filename - Optional custom filename
   */
  downloadImage(blob: Blob, filename?: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename || `colorama-palette-${Date.now()}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  private drawPalette(
    ctx: CanvasRenderingContext2D,
    colors: ColorItem[],
    config: ExportOptions,
  ): void {
    const panelWidth = config.width / colors.length;

    colors.forEach((colorItem, index) => {
      const x = index * panelWidth;

      ctx.fillStyle = colorItem.hex;
      ctx.fillRect(x, 0, panelWidth, config.height);

      const textColor = this.colorService.getContrastColor(colorItem.hex);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      let colorText = colorItem.hex.replace('#', '').toUpperCase();
      const color = chroma(colorItem.hex);

      if (config.colorSpace === 'RGB') {
        const [r, g, b] = color.rgb();
        colorText = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
      } else if (config.colorSpace === 'HSL') {
        const [h, s, l] = color.hsl();
        colorText = `${Math.round(h || 0)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
      } else if (config.colorSpace === 'LAB') {
        const [l, a, b] = color.lab();
        colorText = `${Math.round(l)}, ${Math.round(a)}, ${Math.round(b)}`;
      }

      // Rotate text 90 degrees (bottom to top)
      ctx.save();
      const centerX = x + panelWidth / 2;
      const bottomY = config.height - 30;

      ctx.translate(centerX, bottomY);
      ctx.rotate(-Math.PI / 2); // 90 degrees counter-clockwise
      ctx.fillText(colorText, 0, 0);
      ctx.restore();
    });
  }

  private drawFooter(
    ctx: CanvasRenderingContext2D,
    config: ExportOptions,
  ): void {
    if (!config.footerHeight) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, config.height, config.width, config.footerHeight);

    ctx.fillStyle = '#4d4d4dff';
    ctx.font = '16px Arial';
    ctx.textBaseline = 'middle';
    const centerY = config.height + config.footerHeight / 2;
    const padding = 40;

    // Palette Title (Left)
    if (config.footerText && config.footerText !== 'Colorama') {
      ctx.textAlign = 'left';
      ctx.fillText(config.footerText, padding, centerY);
    }

    // Brand Label (Right)
    ctx.fillStyle = '#000000ff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Colorama', config.width - padding, centerY);
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob));
    });
  }
}
