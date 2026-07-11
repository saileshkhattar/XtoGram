// constants/theme.js

export const Colors = {
  BG_BASE: '#000000',        // pure black now, not near-black
  SURFACE: '#0F0F0F',
  SURFACE_RAISED: '#1A1A1A',
  BORDER: 'rgba(255,255,255,0.12)',
  BORDER_SOFT: 'rgba(255,255,255,0.06)',

  PRIMARY: '#FFFFFF',        // primary text/fill on dark
  PRIMARY_DIM: '#4A4A4E',    // inactive dots, subtle fills

  // Glow gradient accent (used for hero image + button border only)
  GLOW_VIOLET: '#8B5CF6',
  GLOW_MAGENTA: '#B54AF0',
  GLOW_ORANGE: '#FF6B4A',

  TEXT_HIGH: '#FFFFFF',
  TEXT_MED: '#9A9A9E',
  TEXT_DIM: '#8A8A8E',
  TEXT_LOW: '#6E6D6B',

  SUCCESS: '#8FBF9F',
  ERROR: '#C77B7B',
  WARNING: '#D4B27A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20,
};

export const Radius = {
  xs: 4,
  sm: 10,
  md: 16,
  lg: 24,
  full: 9999,
};

export const FontSize = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 15,
  bodySmall: 13,
  caption: 12,
  label: 13,
};