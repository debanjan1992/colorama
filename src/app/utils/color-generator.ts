import chroma from 'chroma-js';

export interface ColorInput {
  hex: string;
  locked: boolean;
}

export function generatePalette(current: ColorInput[]): string[] {
  let seedHex: string;
  const lockedColors = current.filter((c) => c.locked);

  // 1. Pick a seed color (use locked color if available, else random)
  if (lockedColors.length > 0) {
    seedHex = lockedColors[Math.floor(Math.random() * lockedColors.length)].hex;
  } else {
    seedHex = chroma.random().hex();
  }

  // 2. Define strategies for harmony
  const strategies = [
    // Analogous (Nearby Hues)
    (base: string) =>
      chroma.scale([base, chroma(base).set('hsl.h', '+40')]).mode('lch'),
    (base: string) =>
      chroma.scale([chroma(base).set('hsl.h', '-40'), base]).mode('lch'),

    // Monochromatic (Lightness variations)
    (base: string) =>
      chroma
        .scale([chroma(base).darken(2), chroma(base).brighten(2)])
        .mode('lch'),

    // Complementary (Opposite)
    (base: string) =>
      chroma.scale([base, chroma(base).set('hsl.h', '+180')]).mode('lch'),

    // Split Complements / Triadic feel
    (base: string) =>
      chroma.scale([base, chroma(base).set('hsl.h', '+150')]).mode('lch'),
  ];

  // 3. Pick a random strategy
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const scale = strategy(seedHex);

  // 4. Generate colors based on the total count needed (default 5 if empty)
  const count = current.length || 5;
  const palette = scale.colors(count);

  // 5. Inject Accent Colors (1 or 2)
  const unlockedIndices: number[] = [];
  if (current.length === 0) {
    // All indices 0 to count-1 are available
    for (let i = 0; i < count; i++) unlockedIndices.push(i);
  } else {
    current.forEach((c, i) => {
      if (!c.locked) unlockedIndices.push(i);
    });
  }

  if (unlockedIndices.length > 0) {
    const numAccents = Math.random() > 0.5 ? 2 : 1;
    const accentBase = chroma(seedHex).set('hsl.s', 1).set('hsl.l', 0.5); // Ensure vibrant

    for (let k = 0; k < numAccents; k++) {
      if (unlockedIndices.length === 0) break;

      // Pick a random slot
      const randomIndex = Math.floor(Math.random() * unlockedIndices.length);
      const slot = unlockedIndices[randomIndex];

      // Remove this slot from available
      unlockedIndices.splice(randomIndex, 1);

      // Generate accent (Complementary or Triadic shift)
      // Shift by 120 (triad) + jitter
      const shift = 120 + k * 60 + Math.random() * 60;
      palette[slot] = accentBase.set('hsl.h', `+${shift}`).hex();
    }
  }

  return palette;
}
