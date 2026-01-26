import chroma from 'chroma-js';

export interface ColorInput {
  hex: string;
  locked: boolean;
}

export function generatePalette(current: ColorInput[]): string[] {
  const lockedColors = current.filter((c) => c.locked).map((c) => c.hex);
  const count = current.length || 5;
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
    // 20% chance of a neutral seed (black/grey/white)
    if (Math.random() < 0.2) {
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

  // 3. Delta-E Threshold (15-20 is usually enough for "visually distinct")
  const THRESHOLD = 18;

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
    while (!isDistinct(candidate, palette) && attempts < 10) {
      if (attempts < 5) {
        // Jitter hue Slightly
        candidate = chroma(candidate)
          .set('hsl.h', `+${attempts * 10}`)
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

  if (unlockedIndices.length > 0 && Math.random() > 0.7) {
    const slot =
      unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
    const accent = chroma(seedHex).set('hsl.h', '+120').saturate(2).hex();
    if (isDistinct(accent, palette)) {
      palette[slot] = accent;
    }
  }

  return palette;
}
