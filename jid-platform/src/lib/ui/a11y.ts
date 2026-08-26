/**
 * Shared accessibility helpers for Wave 1 foundations.
 * Consumers compose these classes; they do not invent domain states.
 */

/** Visible keyboard focus — gold ring on background, never color-only. */
export const focusRingClass =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Minimum comfortable touch target (44px). */
export const touchTargetClass = 'inline-flex min-h-11 min-w-11 items-center justify-center'

/** Disable decorative motion when the user prefers reduced motion. */
export const reducedMotionClass =
  'motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0'

export const visuallyHiddenClass = 'sr-only'

export const iconOnlyControlClass = `${touchTargetClass} ${focusRingClass} ${reducedMotionClass}`
