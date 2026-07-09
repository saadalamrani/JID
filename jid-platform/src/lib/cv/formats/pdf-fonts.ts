/**
 * Local Archivo registration for @react-pdf/renderer (Prompt 1).
 * Fonts are bundled in /public/fonts — zero network fetch at render time.
 */

import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

function fontBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  return siteUrl ?? ''
}

/** Register Archivo once per runtime — required before Harvard / Global ATS render. */
export function registerCvPdfFonts(): void {
  if (fontsRegistered) return

  const base = fontBaseUrl()
  if (!base) {
    throw new Error('Cannot register CV PDF fonts without a base URL')
  }

  Font.register({
    family: 'Archivo',
    fonts: [
      { src: `${base}/fonts/Archivo-Regular.woff`, fontWeight: 400 },
      { src: `${base}/fonts/Archivo-Bold.woff`, fontWeight: 700 },
      { src: `${base}/fonts/Archivo-Italic.woff`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${base}/fonts/Archivo-BoldItalic.woff`, fontWeight: 700, fontStyle: 'italic' },
    ],
  })

  fontsRegistered = true
}
