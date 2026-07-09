/**
 * JID Platform — canonical design tokens.
 * Single source of truth for colors, spacing, typography, and motion.
 */

export const colors = {
  olive: {
    DEFAULT: '#2F3A2E',
    light: '#A8B39A',
    50: '#F4F5F3',
    100: '#E8EBE6',
    200: '#D1D7CD',
    300: '#A8B39A',
    400: '#7E8F6E',
    500: '#2F3A2E',
    600: '#283127',
    700: '#252E28',
    800: '#1E2620',
    900: '#1E2620',
  },
  gold: {
    DEFAULT: '#E6B43A',
    50: '#FDF8EB',
    100: '#FAEFD0',
    200: '#F5DFA1',
    300: '#EFCF72',
    400: '#E6B43A',
    500: '#D4A02E',
    600: '#B88724',
    700: '#946D1D',
    800: '#705316',
    900: '#4C380F',
  },
  beige: {
    DEFAULT: '#F7F5EF',
    warm: '#FAF6EE',
    50: '#FDFCFA',
    100: '#F7F5EF',
    200: '#EDE9DF',
    300: '#E0DACC',
    400: '#D3CBB9',
    500: '#C5BCA6',
    600: '#A89E88',
    700: '#8A806A',
    800: '#6C6352',
    900: '#4E473B',
  },
  ink: {
    DEFAULT: '#1A1F18',
    soft: '#6B7568',
    50: '#F5F6F5',
    100: '#E8EAE7',
    200: '#C9CEC8',
    300: '#A9B1A8',
    400: '#6B7568',
    500: '#4A5248',
    600: '#3A4138',
    700: '#2F352D',
    800: '#1A1F18',
    900: '#0F120F',
  },
  line: {
    DEFAULT: '#8A9486',
    50: '#F3F4F2',
    100: '#E4E7E2',
    200: '#C9CFC5',
    300: '#ADB7A8',
    400: '#8A9486',
    500: '#6E7769',
    600: '#575F52',
    700: '#40473C',
    800: '#2A2F27',
    900: '#151813',
  },
} as const

/**
 * Semantic color tokens — theme-aware roles layered on the raw jid-* palette.
 * Consumed by semantic-theme-plugin.ts → CSS custom properties (--color-*).
 */
export const semanticColors = {
  background: { light: colors.beige.DEFAULT, dark: '#1E2620' },
  surface: { light: colors.beige.warm, dark: colors.olive.DEFAULT },
  card: { light: '#FFFFFF', dark: colors.olive.DEFAULT },
  border: { light: colors.line.DEFAULT, dark: 'rgba(247,245,239,0.12)' },
  textPrimary: { light: '#111111', dark: colors.beige.DEFAULT },
  textSecondary: { light: colors.ink.soft, dark: 'rgba(247,245,239,0.65)' },
  gold: colors.gold.DEFAULT,
  olive: colors.olive.DEFAULT,
  danger: { light: '#DC2626', dark: '#F87171' },
  warning: { light: '#D97706', dark: '#FBBF24' },
} as const

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const

export const typography = {
  fontFamily: {
    arabic: ['"IBM Plex Sans Arabic"', 'sans-serif'],
    latin: ['"Archivo"', 'sans-serif'],
    mono: ['"IBM Plex Mono"', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],
    sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
    base: ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
    xl: ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
    '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
    '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
    '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
    '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const motion = {
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  keyframes: {
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'fade-out': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    'slide-up': {
      '0%': { opacity: '0', transform: 'translateY(8px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'slide-down': {
      '0%': { opacity: '0', transform: 'translateY(-8px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.6' },
    },
  },
  animation: {
    'fade-in': 'fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'fade-out': 'fade-out 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'slide-up': 'slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'slide-down': 'slide-down 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    shimmer: 'shimmer 2s linear infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
} as const

export const radii = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.5rem',
  md: '0.625rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(26 31 24 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(26 31 24 / 0.08), 0 1px 2px -1px rgb(26 31 24 / 0.08)',
  md: '0 4px 6px -1px rgb(26 31 24 / 0.08), 0 2px 4px -2px rgb(26 31 24 / 0.06)',
  lg: '0 10px 15px -3px rgb(26 31 24 / 0.08), 0 4px 6px -4px rgb(26 31 24 / 0.06)',
  xl: '0 20px 25px -5px rgb(26 31 24 / 0.08), 0 8px 10px -6px rgb(26 31 24 / 0.06)',
} as const

export const designTokens = {
  colors,
  semanticColors,
  spacing,
  typography,
  motion,
  radii,
  shadows,
} as const

export type DesignTokens = typeof designTokens
