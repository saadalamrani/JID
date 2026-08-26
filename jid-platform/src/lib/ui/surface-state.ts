/**
 * Shared data-surface presentation states.
 * These are UI states, not domain/backend enums. Do not treat them as C1–C10 values.
 */

export const SURFACE_STATES = [
  'loading',
  'ready',
  'empty',
  'error',
  'forbidden',
  'unavailable',
  'stale',
] as const

export type SurfaceState = (typeof SURFACE_STATES)[number]

/** Missing measured values must not be coerced to zero. */
export function missingNumberDisplay(value: number | null | undefined): number | null {
  return typeof value === 'number' ? value : null
}
