import { Archivo, IBM_Plex_Sans_Arabic, JetBrains_Mono } from 'next/font/google'

export const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  preload: true,
  display: 'swap',
  adjustFontFallback: true,
})

export const fontLatin = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  preload: true,
  display: 'swap',
  adjustFontFallback: true,
})

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  preload: false,
  display: 'swap',
  adjustFontFallback: true,
})

export const fontVariables = [fontArabic.variable, fontLatin.variable, fontMono.variable].join(' ')
