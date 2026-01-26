import chroma from 'chroma-js';

export function getContrastColor(hex: string): 'black' | 'white' {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

export function hexToRgb(hex: string): string {
  const [r, g, b] = chroma(hex).rgb();
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function hexToHsl(hex: string): string {
  const [h, s, l] = chroma(hex).hsl();
  return `hsl(${Math.round(h || 0)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function getContrastRatio(fg: string, bg: string): number {
  return chroma.contrast(fg, bg);
}

export type WCAGLevel = 'Fail' | 'AA' | 'AAA';

export function getWCAGLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}
