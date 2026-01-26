import chroma from 'chroma-js';
import { APP_CONFIG } from '../config/app.config';
import { COLOR_GENERATION_CONFIG } from '../config/color-generation.config';

export interface ColorInput {
  hex: string;
  locked: boolean;
}

/**
 * Generates a color palette based on current colors and locked states
 * @param current - Array of current color items with lock status
 * @returns Array of hex color strings for the palette
 */
export function generatePalette(current: ColorInput[]): string[] {
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

  // 4. Populate unlocked slots with diversity check
  for (let i = 0; i < count; i++) {
    if (palette[i]) continue; // Skip locked

    let candidate = basePalette[i];
    let attempts = 0;

    // Try to find a distinct color by jittering or randomizing
    while (
      !isDistinct(candidate, palette) &&
      attempts < COLOR_GENERATION_CONFIG.maxJitterAttempts
    ) {
      if (attempts < COLOR_GENERATION_CONFIG.jitterThreshold) {
        // Jitter hue slightly
        candidate = chroma(candidate)
          .set('hsl.h', `+${attempts * COLOR_GENERATION_CONFIG.jitterHueStep}`)
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
