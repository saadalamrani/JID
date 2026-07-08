/**
 * Typography scale — Tailwind utility class bundles for consistent text hierarchy.
 *
 * Font tokens (Sprint 0, do not replace):
 * - `font-arabic` — IBM Plex Sans Arabic (body + Arabic UI)
 * - `font-display` / `font-latin` — Archivo (Latin display + headings)
 * - `font-mono` — IBM Plex Mono (code, numerals)
 *
 * CRITICAL: All Arabic-rendering levels use `tracking-normal` (letter-spacing: 0).
 * Negative tracking is Latin/display-only and must never apply to Arabic text.
 */

export type TypographyLevel =
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'caption'
  | 'label'
  | 'button'
  | 'mono'

export type TypographySpec = {
  /** Latin/display class bundle */
  classes: string
  /** Arabic-safe bundle — letter-spacing locked to 0 */
  classesArabic: string
  fontFamily: 'display' | 'arabic' | 'mono'
  fontSize: string
  lineHeight: string
  letterSpacing: string
  fontWeight: string
}

export const typographyScale = {
  display: {
    classes: 'font-display text-5xl font-bold leading-[1.1] tracking-[-0.03em]',
    classesArabic: 'font-arabic text-5xl font-bold leading-[1.1] tracking-normal',
    fontFamily: 'display',
    fontSize: '3rem',
    lineHeight: '1.1',
    letterSpacing: '-0.03em (Latin) / 0 (Arabic)',
    fontWeight: '700',
  },
  heading: {
    classes: 'font-display text-3xl font-semibold leading-[1.3] tracking-[-0.02em]',
    classesArabic: 'font-arabic text-3xl font-semibold leading-[1.3] tracking-normal',
    fontFamily: 'display',
    fontSize: '1.875rem',
    lineHeight: '1.3',
    letterSpacing: '-0.02em (Latin) / 0 (Arabic)',
    fontWeight: '600',
  },
  title: {
    classes: 'font-display text-xl font-semibold leading-[1.5] tracking-[-0.01em]',
    classesArabic: 'font-arabic text-xl font-semibold leading-[1.5] tracking-normal',
    fontFamily: 'display',
    fontSize: '1.25rem',
    lineHeight: '1.5',
    letterSpacing: '-0.01em (Latin) / 0 (Arabic)',
    fontWeight: '600',
  },
  body: {
    classes: 'font-arabic text-base font-normal leading-[1.6] tracking-normal',
    classesArabic: 'font-arabic text-base font-normal leading-[1.6] tracking-normal',
    fontFamily: 'arabic',
    fontSize: '1rem',
    lineHeight: '1.6',
    letterSpacing: '0',
    fontWeight: '400',
  },
  caption: {
    classes: 'font-arabic text-sm font-normal leading-[1.5] tracking-normal',
    classesArabic: 'font-arabic text-sm font-normal leading-[1.5] tracking-normal',
    fontFamily: 'arabic',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontWeight: '400',
  },
  label: {
    classes: 'font-arabic text-sm font-medium leading-[1.5] tracking-normal',
    classesArabic: 'font-arabic text-sm font-medium leading-[1.5] tracking-normal',
    fontFamily: 'arabic',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontWeight: '500',
  },
  button: {
    classes: 'font-arabic text-sm font-semibold leading-[1.5] tracking-normal',
    classesArabic: 'font-arabic text-sm font-semibold leading-[1.5] tracking-normal',
    fontFamily: 'arabic',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontWeight: '600',
  },
  mono: {
    classes: 'font-mono text-sm font-normal leading-[1.5] tracking-normal',
    classesArabic: 'font-mono text-sm font-normal leading-[1.5] tracking-normal',
    fontFamily: 'mono',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontWeight: '400',
  },
} as const satisfies Record<TypographyLevel, TypographySpec>

/** Pick the correct class bundle for the active locale direction. */
export function typographyClasses(level: TypographyLevel, locale: 'ar' | 'en' = 'en'): string {
  const spec = typographyScale[level]
  return locale === 'ar' ? spec.classesArabic : spec.classes
}
