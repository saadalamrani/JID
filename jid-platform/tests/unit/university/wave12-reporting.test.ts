import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  UNIVERSITY_REPORT_FORBIDDEN_CLAIMS,
  UNIVERSITY_REPORT_METHODOLOGY_VERSION,
  UNIVERSITY_REPORT_TYPES,
} from '@/types/contracts/university-reporting'
import { buildUniversityReportCsv, csvLeaksNumericValue } from '@/lib/university/wave12-export'
import type { UniversityReportPayload } from '@/types/contracts/university-reporting'

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as {
    university: { reports: Record<string, unknown>; nav: Record<string, unknown> }
  }
}

function keys(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

const suppressedPayload: UniversityReportPayload = {
  ok: true,
  mapping_present: true,
  fail_closed_reason: null,
  report_id: 'rep-1',
  university_id: 'uni-1',
  report_type: 'cohort_outcome_summary',
  population: {
    kind: 'cohort',
    cohort_id: 'c-1',
    graduation_year: 2024,
    program_text: 'Computer Science',
    major_id: null,
    degree_level: 'bachelor',
    label_ar: '2024 · علوم الحاسب',
    label_en: '2024 · Computer Science',
  },
  time_window: {
    label_ar: 'الصفوف النشطة حتى تاريخ البيانات',
    label_en: 'Active rows as of the data-as-of timestamp',
  },
  generated_at: '2026-08-31T12:00:00.000Z',
  generated_by: 'owner-1',
  data_as_of: '2026-08-31T12:00:00.000Z',
  methodology_version: UNIVERSITY_REPORT_METHODOLOGY_VERSION,
  metric_definitions: [],
  coverage: {
    eligible_n: null,
    observed_n: null,
    known_n: null,
    sufficient: false,
    suppressed: true,
    notes_ar: 'المجموعة أصغر من عتبة الإخفاء؛ لا تُعرض قيم خام.',
    notes_en: 'The group is below the suppression threshold; raw values are not shown.',
  },
  missingness_notes_ar: 'البيانات الناقصة تبقى مجهولة.',
  missingness_notes_en: 'Missing data remains unknown.',
  privacy_rules: {
    aggregate_only: true,
    named_graduate_fields: [],
    suppression_min_n: 5,
    suppression_preserved_in_export: true,
  },
  accreditation_boundary: {
    role: 'supporting_evidence',
    certifies_compliance: false,
    label_ar: 'أدلة مساندة للمراجعة المؤسسية. جِد لا تعتمد الامتثال للاعتماد.',
    label_en: 'Supporting evidence for institutional review. JID does not certify accreditation compliance.',
  },
  benchmark: {
    status: 'UNAVAILABLE',
    live: false,
    ranking: null,
    percentile: null,
    national_average: null,
    reason_ar: 'لا يمكن إجراء مقارنة موثوقة لهذه المجموعة حالياً.',
    reason_en: 'A reliable comparison is not available for this group yet.',
  },
  status: 'suppressed',
  aggregates: [
    {
      key: 'known_outcomes',
      label_ar: 'مخرجات معروفة',
      label_en: 'Known outcomes',
      value: null,
      suppressed: true,
      status: 'suppressed',
    },
  ],
  intelligence_source: 'wave10_foundation',
}

describe('Wave 12 University reporting contracts', () => {
  it('keeps a small composable report catalog', () => {
    expect(UNIVERSITY_REPORT_TYPES).toEqual([
      'cohort_outcome_summary',
      'program_employability_evidence',
      'employer_alignment_summary',
      'career_readiness_activity',
      'data_coverage_methodology',
    ])
  })

  it('keeps AR/EN parity for reporting surfaces', () => {
    const en = load('en')
    const ar = load('ar')
    expect(keys(en.university.reports)).toEqual(keys(ar.university.reports))
    expect(keys(en.university.reports.types as Record<string, unknown>)).toEqual(
      keys(ar.university.reports.types as Record<string, unknown>),
    )
    expect(en.university.nav.reports).toBeTruthy()
    expect(ar.university.nav.reports).toBeTruthy()
    expect(ar.university.reports.howComputed).toBe('كيف احتُسبت هذه البيانات؟')
  })

  it('forbids accreditation certification language', () => {
    const en = JSON.stringify(load('en'))
    const ar = JSON.stringify(load('ar'))
    for (const claim of UNIVERSITY_REPORT_FORBIDDEN_CLAIMS) {
      expect(en).not.toContain(claim)
      expect(ar).not.toContain(claim)
    }
    expect(en).toMatch(/supporting evidence/i)
    expect(ar).toContain('أدلة مساندة')
  })

  it('does not advertise rankings or national benchmarks', () => {
    const en = JSON.stringify(load('en').university.reports)
    const ar = JSON.stringify(load('ar').university.reports)
    expect(en).not.toMatch(/Accreditation compliant/i)
    expect(ar).not.toMatch(/متوسط وطني منشور|ترتيب الجامعات المعتمد|معتمد من هيئة/)
    expect(en).toMatch(/not available for this group yet/i)
    expect(ar).toContain('لا يمكن إجراء مقارنة موثوقة')
  })

  it('ships snapshot SQL without named graduate fields or live benchmarks', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260831160000_wave12_university_reporting.sql'),
      'utf8',
    )
    expect(sql).toContain('university_report_snapshots')
    expect(sql).toContain('university_report_generate')
    expect(sql).toContain('university_report_export_payload')
    expect(sql).toContain('university_benchmark_reference_sets')
    expect(sql).toContain("status = 'UNAVAILABLE'")
    expect(sql).toContain('university_suppression_min_n')
    expect(sql).toContain('أدلة مساندة')
    expect(sql).not.toMatch(/Accreditation compliant/i)
    expect(sql).not.toMatch(/معتمد من هيئة/)
    expect(sql).toContain("NOT (payload ? 'email')")
    expect(sql).toContain("NOT (payload ? 'individual_id')")
    expect(sql).toContain("NOT (payload ? 'cv')")
  })

  it('preserves suppression in CSV and never leaks hidden values', () => {
    const csv = buildUniversityReportCsv(suppressedPayload)
    expect(csv).toContain('report_title')
    expect(csv).toContain('methodology_version')
    expect(csv).toContain('coverage_notes_en')
    expect(csv).toContain('missingness_en')
    expect(csv).toContain('generated_at')
    expect(csv).toContain('known_outcomes')
    expect(csv).toContain('suppressed,true')
    expect(csvLeaksNumericValue(csv, 1)).toBe(false)
    expect(csv).not.toMatch(/email|phone|career_record/i)
  })
})
