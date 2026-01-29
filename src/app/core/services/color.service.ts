import { Injectable } from '@angular/core';
import chroma from 'chroma-js';
import { APP_CONFIG } from '../../config/app.config';
import { COLOR_GENERATION_CONFIG } from '../../config/color-generation.config';

export type WCAGLevel = 'Fail' | 'AA' | 'AAA';

export interface GenerationOptions {
  enforceAccessibility?: boolean;
}

export interface ColorInput {
  hex: string;
  locked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  // --- Conversion & Accessibility Utils ---

  getContrastColor(hex: string): 'black' | 'white' {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  }

  hexToRgb(hex: string): string {
    const [r, g, b] = chroma(hex).rgb();
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  hexToHsl(hex: string): string {
    const [h, s, l] = chroma(hex).hsl();
    return `hsl(${Math.round(h || 0)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  getContrastRatio(fg: string, bg: string): number {
    return chroma.contrast(fg, bg);
  }

  getWCAGLevel(ratio: number): WCAGLevel {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
  }

  // --- Shade Generation ---

  generateShades(hex: string): string[] {
    const l = chroma(hex).get('lab.l') / 100;
    const count = 33;
    const colorIndex = Math.round(l * (count - 1));

    const shadesBefore = chroma
      .scale(['black', hex])
      .mode('lab')
      .colors(colorIndex + 1);
    const shadesAfter = chroma
      .scale([hex, 'white'])
      .mode('lab')
      .colors(count - colorIndex);

    // Remove duplicates (the pivot color is in both arrays) and merge
    return [...shadesBefore.slice(0, -1), ...shadesAfter];
  }

  // --- Palette Generation ---

  generatePalette(
    current: ColorInput[],
    options: GenerationOptions = {},
  ): string[] {
    const lockedColors = current.filter((c) => c.locked).map((c) => c.hex);
    const count = current.length || APP_CONFIG.colors.defaultCount;
    const palette: string[] = new Array(count).fill('');

    // 1. Preserve locked colors
    current.forEach((c, i) => {
      if (c.locked) palette[i] = c.hex;
    });

    // 2. Pick a seed
    let seedHex: string;
    if (lockedColors.length > 0) {
      seedHex = lockedColors[Math.floor(Math.random() * lockedColors.length)];
    } else {
      // Chance of a neutral seed (black/grey/white)
      if (Math.random() < COLOR_GENERATION_CONFIG.neutralSeedChance) {
        const g = Math.floor(Math.random() * 255);
        seedHex = chroma.rgb(g, g, g).hex();
      } else {
        seedHex = chroma.random().hex();
      }
    }

    const strategies = [
      // Analogous
      (base: string) =>
        chroma.scale([base, chroma(base).set('hsl.h', '+40')]).mode('lch'),
      (base: string) =>
        chroma.scale([chroma(base).set('hsl.h', '-40'), base]).mode('lch'),
      // Monochromatic (Larger range for deeper blacks/brighter whites)
      (base: string) =>
        chroma
          .scale([
            chroma(base).set('hsl.l', 0.05),
            base,
            chroma(base).set('hsl.l', 0.95),
          ])
          .mode('lch'),
      // Complementary
      (base: string) =>
        chroma.scale([base, chroma(base).set('hsl.h', '+180')]).mode('lch'),
      // Neutral / Grayscaled Accent
      (base: string) =>
        chroma
          .scale([
            chroma(base).desaturate(3).darken(2),
            chroma(base).desaturate(3).brighten(2),
          ])
          .mode('lch'),
    ];

    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const scale = strategy(seedHex);
    const basePalette = scale.colors(count);

    // Delta-E Threshold for visually distinct colors
    const THRESHOLD = COLOR_GENERATION_CONFIG.deltaEThreshold;

    const isDistinct = (hex: string, existing: string[]) => {
      return existing.every((other) => {
        if (!other) return true;
        return chroma.deltaE(hex, other) > THRESHOLD;
      });
    };

    const isValid = (hex: string) => {
      if (!isDistinct(hex, palette)) return false;

      if (options.enforceAccessibility) {
        const contrastRatio = this.getContrastRatio(
          this.getContrastColor(hex),
          hex,
        );
        return contrastRatio >= 4.5;
      }

      return true;
    };

    // 4. Populate unlocked slots with diversity and accessibility checks
    for (let i = 0; i < count; i++) {
      if (palette[i]) continue; // Skip locked

      let candidate = basePalette[i];
      let attempts = 0;

      // Try to find a valid color by jittering or randomizing
      while (
        !isValid(candidate) &&
        attempts < COLOR_GENERATION_CONFIG.maxJitterAttempts
      ) {
        if (attempts < COLOR_GENERATION_CONFIG.jitterThreshold) {
          // Jitter hue slightly
          candidate = chroma(candidate)
            .set(
              'hsl.h',
              `+${attempts * COLOR_GENERATION_CONFIG.jitterHueStep}`,
            )
            .hex();
        } else {
          // Pure random replacement if jittering fails
          candidate = chroma.random().hex();
        }
        attempts++;
      }
      palette[i] = candidate;
    }

    // 5. Occasionally force a high-contrast accent if space allows
    const unlockedIndices = palette
      .map((_, i) => i)
      .filter((i) => !current[i]?.locked);

    if (
      unlockedIndices.length > 0 &&
      Math.random() > COLOR_GENERATION_CONFIG.accentChance
    ) {
      const slot =
        unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
      const accent = chroma(seedHex).set('hsl.h', '+120').saturate(2).hex();
      if (isDistinct(accent, palette)) {
        palette[slot] = accent;
      }
    }

    return palette;
  }

  // --- Mixing ---

  mixColors(c1: string, c2: string): string {
    return chroma.mix(c1, c2, 0.5, 'lab').hex();
  }
}
