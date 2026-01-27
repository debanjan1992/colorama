import { ColorItem } from '../../store/color.store';

export interface ExportOptions {
  width: number;
  height: number;
  includeFooter: boolean;
  footerHeight?: number;
  footerText?: string;
  colorSpace?: 'HEX' | 'RGB' | 'HSL' | 'LAB';
}

export interface ExportResult {
  success: boolean;
  error?: string;
  blob?: Blob;
}

export interface PaletteExportData {
  colors: ColorItem[];
  timestamp: number;
  format: 'png' | 'svg';
}
