import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd())

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

describe('catalog public reference copy', () => {
  it('keeps EN/AR hero and detail reference framing without ownership implication', () => {
    const en = JSON.parse(read('messages/en.json')) as Record<string, unknown>
    const ar = JSON.parse(read('messages/ar.json')) as Record<string, unknown>
    const enCatalog = en.catalogPage as {
      hero: { title: string; subtitle: string }
      detail: { publicReferenceBanner: string }
    }
    const arCatalog = ar.catalogPage as {
      hero: { title: string; subtitle: string }
      detail: { publicReferenceBanner: string }
    }

    expect(enCatalog.hero.title).toMatch(/directory/i)
    expect(enCatalog.hero.subtitle).toMatch(/reference/i)
    expect(enCatalog.hero.subtitle.toLowerCase()).not.toContain('job board')
    expect(enCatalog.detail.publicReferenceBanner).toMatch(/public directory reference/i)
    expect(enCatalog.detail.publicReferenceBanner).toMatch(/not an owned Profile/i)

    expect(arCatalog.hero.title).toContain('دليل')
    expect(arCatalog.detail.publicReferenceBanner).toContain('مرجعي')
    expect(arCatalog.detail.publicReferenceBanner).not.toContain('استلام')
  })

  it('renders the public reference banner in the detail view', () => {
    const detail = read('src/app/[locale]/(public)/catalog/_components/catalog-detail-view.tsx')
    expect(detail).toContain("t('publicReferenceBanner')")
  })

  it('uses next-intl for the catalog hero instead of hardcoded Arabic-only chrome', () => {
    const hero = read('src/app/[locale]/(public)/catalog/_components/catalog-hero.tsx')
    expect(hero).toContain("useTranslations('catalogPage.hero')")
    expect(hero).not.toContain('جهة عمل مسجّلة')
  })
})
