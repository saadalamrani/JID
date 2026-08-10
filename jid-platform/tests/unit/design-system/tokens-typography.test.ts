import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { colors, semanticColors, typography } from '@/config/design-tokens'

describe('Design System Foundations Wave A — tokens & typography', () => {
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

  it('includes Secondary Olive and semantic success', () => {
    expect(colors.olive.secondary).toBe('#414D40')
    expect(semanticColors.oliveSecondary).toBe('#414D40')
    expect(semanticColors.success).toEqual({ light: '#2F6B4F', dark: '#7BC49A' })
  })

  it('keeps locked brand core colors', () => {
    expect(colors.olive.DEFAULT).toBe('#2F3A2E')
    expect(colors.gold.DEFAULT).toBe('#E6B43A')
    expect(colors.beige.DEFAULT).toBe('#F7F5EF')
  })

  it('forces Arabic letter-spacing to zero in globals (including headings)', () => {
    const globals = readFileSync(join(process.cwd(), 'src/app/[locale]/globals.css'), 'utf8')
    expect(globals).toMatch(/html\[lang='ar'\]\s*\{\s*letter-spacing:\s*0;/)
    expect(globals).toMatch(/html\[lang='ar'\]\s*\*\s*\{\s*letter-spacing:\s*inherit;/)
  })
})
