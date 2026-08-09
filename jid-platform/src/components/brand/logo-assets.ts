/**
 * Official Brand Identity lockups (from `scripts/brand-sources` via `pnpm brand:import`).
 * AR → Arabic جد wordmark; EN → Latin JID wordmark.
 * Intrinsic pixel sizes match trimmed public PNGs (height 64 masters).
 */
export const LOGO_ASSETS = {
  ar: {
    light: '/brand/logo_ar_transparent.png',
    dark: '/brand/logo_ar_white.png',
    /** Intrinsic px of processed public assets (preserve true aspect — never guess). */
    intrinsic: { width: 142, height: 64 },
  },
  en: {
    light: '/brand/logo_full_transparent.png',
    dark: '/brand/logo_full_white.png',
    intrinsic: { width: 134, height: 64 },
  },
} as const

export type LogoLocaleKey = keyof typeof LOGO_ASSETS
export type LogoSize = 'sm' | 'md' | 'lg'

/** Height-locked — width follows each locale asset's true aspect ratio. */
export const LOGO_SIZE_CONFIG: Record<LogoSize, { className: string; height: number }> = {
  sm: { className: 'h-6 w-auto max-h-6', height: 24 },
  md: { className: 'h-8 w-auto max-h-8', height: 32 },
  lg: { className: 'h-12 w-auto max-h-12', height: 48 },
}

/** Display width for a locked height using the asset's true intrinsic ratio. */
export function logoDisplayWidth(localeKey: LogoLocaleKey, height: number): number {
  const { width: iw, height: ih } = LOGO_ASSETS[localeKey].intrinsic
  return Math.round((height * iw) / ih)
}
