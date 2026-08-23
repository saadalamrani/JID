import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../..')

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

describe('Interview closeout — demo-critical content patches', () => {
  it('hides the public Pulse footer link unless the Pulse flag is checked', () => {
    const footer = readSrc('src/app/[locale]/(public)/_components/public-footer.tsx')
    expect(footer).toMatch(/isFeatureEnabled\(FLAG_KEYS\.PULSE_PUBLIC\)/)
    expect(footer).toMatch(/pulsePublic \? \[\{ href: '\/pulse'/)
  })

  it('excludes seed Directory slugs from public catalog browsing', () => {
    const catalog = readSrc('src/lib/queries/catalog.ts')
    expect(catalog).toMatch(/PUBLIC_CATALOG_SEED_SLUG_PREFIX/)
    expect(catalog).toMatch(/excludeSeedDirectoryRows/)
  })

  it('does not expose Professional Discovery controls on the Individual privacy form', () => {
    const form = readSrc('src/components/profile/forms/individual-privacy-form.tsx')
    expect(form).not.toMatch(/visibilityDiscoverable/)
    expect(form).not.toMatch(/showToCompanies/)
    expect(form).toMatch(/show_profile_in_university_stats/)
    expect(form).toMatch(/type="hidden"/)
  })

  it('does not force Arabic font onto the root body', () => {
    const layout = readSrc('src/app/layout.tsx')
    expect(layout).not.toMatch(/font-arabic antialiased/)
    expect(layout).toMatch(/fontVariables/)
  })

  it('keeps print CV terminology on باني السيرة الذاتية', () => {
    const print = readSrc(
      'src/app/[locale]/(individual)/profile/cv/print-cv-ar/print-cv-ar-view.tsx',
    )
    expect(print).toMatch(/باني السيرة الذاتية/)
    expect(print).not.toMatch(/منشئ السيرة/)
  })
})
