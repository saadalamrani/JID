import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOGO_SIZE_CONFIG, logoDisplayWidth } from '@/components/brand/logo-assets'

describe('Wave 1 — official Logo aspect contract', () => {
  it('uses locale-specific intrinsic ratios (never a guessed 2.2 multiplier)', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/brand/logo.tsx'), 'utf8')
    const assets = readFileSync(join(process.cwd(), 'src/components/brand/logo-assets.ts'), 'utf8')
    expect(src).not.toMatch(/height\s*\*\s*2\.2/)
    expect(assets).not.toMatch(/height\s*\*\s*2\.2/)
    expect(assets).toMatch(/intrinsic:\s*\{\s*width:\s*142,\s*height:\s*64/)
    expect(assets).toMatch(/intrinsic:\s*\{\s*width:\s*134,\s*height:\s*64/)
  })

  it('preserves AR and EN aspect ratios across size tokens', () => {
    for (const size of Object.keys(LOGO_SIZE_CONFIG) as Array<keyof typeof LOGO_SIZE_CONFIG>) {
      const { height } = LOGO_SIZE_CONFIG[size]
      expect(logoDisplayWidth('ar', height)).toBe(Math.round((height * 142) / 64))
      expect(logoDisplayWidth('en', height)).toBe(Math.round((height * 134) / 64))
      // EN ratio (~2.09) diverges from the retired guessed 2.2 multiplier at all sizes.
      expect(logoDisplayWidth('en', height)).not.toBe(Math.round(height * 2.2))
    }
    // md height makes the AR intrinsic width diverge from height*2.2 as well.
    expect(logoDisplayWidth('ar', 32)).toBe(71)
    expect(Math.round(32 * 2.2)).toBe(70)
  })

  it('points AR/EN to approved official public brand assets', () => {
    const assets = readFileSync(join(process.cwd(), 'src/components/brand/logo-assets.ts'), 'utf8')
    expect(assets).toContain('/brand/logo_ar_transparent.png')
    expect(assets).toContain('/brand/logo_ar_white.png')
    expect(assets).toContain('/brand/logo_full_transparent.png')
    expect(assets).toContain('/brand/logo_full_white.png')
  })
})
