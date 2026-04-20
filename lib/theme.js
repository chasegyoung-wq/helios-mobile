// ============================================================
// HELIOS MOBILE — THEME
// Consistent colors, typography, and spacing
// ============================================================

export const Colors = {
  // Backgrounds
  bg:           '#0A0F1C',
  bgDeep:       '#060A14',
  card:         '#111827',
  cardMid:      '#161D2F',
  sidebar:      '#0E1322',

  // Borders
  border:       '#1E2536',
  borderMid:    '#2A3446',
  borderSubtle: '#1A2030',

  // Text
  text:         '#E8ECF2',
  textSoft:     '#C9D1DB',
  textMid:      '#8896AA',
  textDim:      '#5A6478',
  textDimmer:   '#3A4558',

  // Brand
  accent:       '#B8944F',
  accentLight:  '#D4AE6B',
  primary:      '#1B3A5C',
  primaryLight: '#2A5280',

  // Status
  success:      '#4ADE80',
  warning:      '#FBBF24',
  error:        '#F87171',
  info:         '#60A5FA',
  orange:       '#F97316',

  // Overlays
  overlay:      'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
};

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 28,

  // Font weights
  regular: '400',
  medium:  '500',
  semibold:'600',
  bold:    '700',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
};
