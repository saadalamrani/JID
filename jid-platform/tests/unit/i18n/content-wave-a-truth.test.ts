import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { FLAG_METADATA } from '@/lib/feature-flags/metadata'
import { TERMS } from '@/lib/constants/terminology'

const root = join(process.cwd(), 'messages')

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(root, `${locale}.json`), 'utf8')) as Record<string, unknown>
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value)
    return out
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
    return out
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStrings(child, out)
    }
  }
  return out
}

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectKeys(child, prefix ? `${prefix}.${key}` : key),
    )
  }
  return prefix ? [prefix] : []
}

const WAVE_A_BANNED = [
  /ابحث لي/,
  /Abhathli/i,
  /Claim your profile/i,
  /claim your listing/i,
  /المطالبة بهذه الشركة/,
  /طالب بملفها/,
  /استلام الملف/,
  /Job board/i,
  /لوحة الوظائف/,
  /دليل الجامعات/,
  /University directory/i,
  /منشئ السيرة/,
  /ملف موثّق/,
  /الغالبية العظمى/,
  /شريحة واسعة/,
  /entity_state/,
  /pending_review فقط/,
  /\/staff\/mentor-applications/,
  /http:\/\/127\.0\.0\.1:54324/,
  /Inbucket/,
]

describe('Wave A — content truth and terminology', () => {
  const ar = load('ar')
  const en = load('en')

  it('keeps AR/EN catalog key parity', () => {
    expect(collectKeys(ar).sort()).toEqual(collectKeys(en).sort())
  })

  it('uses locked homepage hero copy', () => {
    const arHero = (ar.landing as { hero: Record<string, string> }).hero
    const enHero = (en.landing as { hero: Record<string, string> }).hero
    expect(arHero.title).toBe('جِد تربط الفرد، جهة التوظيف، والجامعة')
    expect(arHero.subtitle).toBe('بنية مهنية سعودية تجمع الأطراف الأساسية، لكل طرف دوره ومساحته.')
    expect(arHero.secondaryCta).toBe('إنشاء حساب')
    expect(arHero.primaryCtaGuest).toBe('استكشف الفرص')
    expect(enHero.title).toBe('JID connects individuals, employers, and universities.')
    expect(enHero.secondaryCta).toBe('Create an account')
    expect(enHero.primaryCtaGuest).toBe('Explore opportunities')
  })

  it('uses locked verification and directory terminology', () => {
    const arEntity = ar.entity as {
      approvedWithoutProfile: { business: { title: string }; university: { title: string } }
    }
    expect(arEntity.approvedWithoutProfile.business.title).toBe('تم التحقق من صفة التمثيل')
    expect(arEntity.approvedWithoutProfile.university.title).toBe('تم التحقق من صفة التمثيل')
    expect((ar.publicShell as { nav: { catalog: string } }).nav.catalog).toBe('الدليل')
    expect((en.publicShell as { nav: { catalog: string } }).nav.catalog).toBe('Directory')
    expect(TERMS.directory.ar).toBe('الدليل')
    expect(TERMS.universityDirectory.ar).toBe('الدليل')
  })

  it('keeps authored Arabic product copy free of banned Wave A terms', () => {
    const strings = collectStrings(ar)
    for (const pattern of WAVE_A_BANNED) {
      const hit = strings.find((value) => pattern.test(value))
      expect(hit, `banned pattern ${pattern} found: ${hit ?? ''}`).toBeUndefined()
    }
  })

  it('keeps English catalog free of banned Wave A terms', () => {
    const strings = collectStrings(en)
    for (const pattern of WAVE_A_BANNED) {
      const hit = strings.find((value) => pattern.test(value))
      expect(hit, `banned pattern ${pattern} found: ${hit ?? ''}`).toBeUndefined()
    }
  })

  it('uses جارٍ in loading grammar and Latin digits in Arabic copy', () => {
    const strings = collectStrings(ar)
    expect(strings.some((value) => value.includes('جارٍ'))).toBe(true)
    const staleLoading = strings.find((value) => /جاري التحميل/.test(value))
    expect(staleLoading).toBeUndefined()
    const indic = strings.find((value) => /[٠-٩]/.test(value))
    expect(indic, `Arabic-Indic digit found: ${indic ?? ''}`).toBeUndefined()
  })

  it('fail-closes university intelligence and paid visibility copy', () => {
    const university = ar.university as {
      nav: { shellTitle: string; dashboard: string }
      dashboard: { title: string; empty: { title: string; description: string } }
    }
    expect(university.nav.shellTitle).toBe('مساحة الجامعة')
    expect(university.dashboard.empty.title).toBe('البيانات المؤسسية غير متاحة حالياً')
    expect(university.dashboard.empty.description).toContain('لن نعرض مؤشرات')
    const boost = (ar.company as { boost: { teaserTitle: string; teaserBody: string } }).boost
    expect(boost.teaserTitle).toContain('غير متاح')
    expect(boost.teaserBody).toContain('الظهور المدفوع')
  })

  it('renames Sys flag metadata away from banned Job Board / University Directory labels', () => {
    expect(FLAG_METADATA[FLAG_KEYS.JOBS].labelAr).toBe('الفرص')
    expect(FLAG_METADATA[FLAG_KEYS.JOBS].labelEn).toBe('Opportunities')
    expect(FLAG_METADATA[FLAG_KEYS.UNIVERSITIES].labelAr).toBe('الجامعات')
    expect(FLAG_METADATA[FLAG_KEYS.CV_BUILDER].labelAr).toBe('باني السيرة الذاتية')
  })
})
