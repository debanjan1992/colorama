import { Injectable } from '@angular/core';
import { ColorItem } from '../../store/color.store';
import { ExportOptions, ExportResult } from '../models/export.models';
import { getContrastColor } from '../../utils/color-utils';
import { APP_CONFIG } from '../../config/app.config';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
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

      const textColor = getContrastColor(colorItem.hex);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const hexText = colorItem.hex.replace('#', '').toUpperCase();
      ctx.fillText(hexText, x + panelWidth / 2, config.height / 2);
    });
  }

  private drawFooter(
    ctx: CanvasRenderingContext2D,
    config: ExportOptions,
  ): void {
    if (!config.footerHeight) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, config.height, config.width, config.footerHeight);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      config.footerText || 'Colorama',
      config.width / 2,
      config.height + config.footerHeight / 2,
    );
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob));
    });
  }
}
