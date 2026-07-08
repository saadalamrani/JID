import { motion, radii, shadows } from '@/config/design-tokens'

/**
 * Part 7 — platform-wide visual consistency tokens.
 * Re-exports Sprint 0 design-token scales; use these class names in components.
 */

/** Border radius scale from design-tokens.ts radii (globals --radius = radii.DEFAULT). */
export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

/** Elevation levels mapped to design-tokens.ts boxShadow scale. */
export const elevation = {
  /** Buttons, subtle chips */
  subtle: 'shadow-sm',
  /** Cards, popovers */
  card: 'shadow',
  /** Dropdowns, tooltips */
  dropdown: 'shadow-md',
  /** Modals, bottom sheets */
  modal: 'shadow-lg',
} as const

/** Transition duration scale from motion.duration (150ms / 250ms / 400ms). */
export const transition = {
  colors: 'transition-colors duration-fast ease-jid',
  opacity: 'transition-opacity duration-fast ease-jid',
  transform: 'transition-transform duration-normal ease-jid',
  all: 'transition-all duration-normal ease-jid',
} as const

/** Shared shimmer surface for loading placeholders. */
export const shimmerSurface =
  'animate-shimmer bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%]'

/** Card-shaped skeleton shell used by module card skeletons. */
export const cardSkeletonShell = `${radius.xl} border border-border/40 bg-card ${elevation.subtle}`

export const designRadii = radii
export const designShadows = shadows
export const designMotion = motion
