import { IBM_Plex_Sans_Arabic, JetBrains_Mono, Manrope } from 'next/font/google'

export const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  preload: true,
  display: 'swap',
  adjustFontFallback: true,
})

/** Locked Brand Identity Latin face (replaces prior Archivo UI lock for product shells). */
export const fontLatin = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  preload: true,
  display: 'swap',
  adjustFontFallback: true,
})

/** Canonical mono face — keep in sync with typography.fontFamily.mono in design-tokens.ts. */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  preload: false,
  display: 'swap',
  adjustFontFallback: true,
})

export const fontVariables = [fontArabic.variable, fontLatin.variable, fontMono.variable].join(' ')
