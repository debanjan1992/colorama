export const APP_CONFIG = {
  colors: {
    defaultCount: 6,
    minCount: 2,
    maxCount: 8,
  },
  history: {
    maxSize: 5,
  },
  export: {
    imageWidth: 1200,
    paletteHeight: 800,
    footerHeight: 80,
  },
  animations: {
    colorTransitionDuration: 600, // milliseconds
    colorTransitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
