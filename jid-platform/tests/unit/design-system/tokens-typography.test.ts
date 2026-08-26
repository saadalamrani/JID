import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SEMANTIC_COLOR_ROLES, colors, semanticColors, typography } from '@/config/design-tokens'
import { typographyScale } from '@/lib/typography'

describe('Wave 1 Front 3 — tokens & typography', () => {
  it('locks Latin product font to Manrope (not Archivo)', () => {
    expect(typography.fontFamily.latin[0]).toBe('"Manrope"')
    const fontsSource = readFileSync(join(process.cwd(), 'src/styles/fonts.ts'), 'utf8')
    expect(fontsSource).toContain('Manrope')
    expect(fontsSource).toMatch(/fontLatin\s*=\s*Manrope\(/)
    expect(fontsSource).not.toMatch(/fontLatin\s*=\s*Archivo\(/)
  })

  it('preserves IBM Plex Sans Arabic', () => {
    expect(typography.fontFamily.arabic[0]).toBe('"IBM Plex Sans Arabic"')
    const fontsSource = readFileSync(join(process.cwd(), 'src/styles/fonts.ts'), 'utf8')
    expect(fontsSource).toContain('IBM_Plex_Sans_Arabic')
  })

  it('resolves the mono token to the loaded JetBrains Mono face', () => {
    expect(typography.fontFamily.mono[0]).toBe('"JetBrains Mono"')
    const fontsSource = readFileSync(join(process.cwd(), 'src/styles/fonts.ts'), 'utf8')
    expect(fontsSource).toContain('JetBrains_Mono')
    expect(fontsSource).not.toContain('IBM_Plex_Mono')
    expect(typography.fontFamily.mono[0]).not.toBe('"IBM Plex Mono"')
  })

  it('includes Secondary Olive and semantic success', () => {
    expect(colors.olive.secondary).toBe('#414D40')
    expect(semanticColors.oliveSecondary).toBe('#414D40')
    expect(semanticColors.success).toEqual({ light: '#2F6B4F', dark: '#7BC49A' })
  })

  it('keeps locked brand core colors', () => {
    expect(colors.olive.DEFAULT).toBe('#2F3A2E')
    expect(colors.gold.DEFAULT).toBe('#E6B43A')
    expect(colors.beige.DEFAULT).toBe('#F7F5EF')
    expect(semanticColors.primary).toBe('#2F3A2E')
    expect(semanticColors.accent).toBe('#E6B43A')
    expect(semanticColors.focus).toBe('#E6B43A')
  })

  it('exposes the frozen semantic role set', () => {
    expect(SEMANTIC_COLOR_ROLES).toEqual([
      'background',
      'surface',
      'card',
      'foreground',
      'textPrimary',
      'textSecondary',
      'border',
      'primary',
      'accent',
      'success',
      'warning',
      'danger',
      'focus',
      'ring',
    ])
    for (const role of SEMANTIC_COLOR_ROLES) {
      expect(semanticColors[role]).toBeDefined()
    }
  })

  it('keeps size tokens at zero letter-spacing so Arabic cannot inherit Latin tracking', () => {
    for (const spec of Object.values(typography.fontSize)) {
      expect(spec[1].letterSpacing).toBe('0')
    }
  })

  it('keeps Arabic typography scale at zero tracking while Latin may keep approved tracking', () => {
    expect(typographyScale.display.classesArabic).toContain('tracking-normal')
    expect(typographyScale.heading.classesArabic).toContain('tracking-normal')
    expect(typographyScale.title.classesArabic).toContain('tracking-normal')
    expect(typographyScale.display.classesArabic).not.toMatch(/tracking-\[-/)
    expect(typographyScale.display.classes).toMatch(/tracking-\[-0\.03em\]/)
  })

  it('forces Arabic letter-spacing to zero in globals (including headings)', () => {
    const globals = readFileSync(join(process.cwd(), 'src/app/[locale]/globals.css'), 'utf8')
    expect(globals).toMatch(/html\[lang='ar'\]\s*\{\s*letter-spacing:\s*0;/)
    expect(globals).toMatch(/html\[lang='ar'\]\s*\*\s*\{\s*letter-spacing:\s*inherit;/)
  })

  it('uses lining Latin digits and respects reduced motion', () => {
    const globals = readFileSync(join(process.cwd(), 'src/app/[locale]/globals.css'), 'utf8')
    expect(globals).toContain('font-variant-numeric: lining-nums')
    expect(globals).toContain('prefers-reduced-motion: reduce')
    expect(globals).toContain('animation-duration: 0.01ms !important')
  })
})
