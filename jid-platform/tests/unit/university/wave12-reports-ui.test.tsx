import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import en from '../../../messages/en.json'
import { UniversityReportMethodology } from '@/app/[locale]/(university)/university/reports/_components/university-report-methodology'
import { UniversityReportResults } from '@/app/[locale]/(university)/university/reports/_components/university-report-results'
import { UNIVERSITY_REPORT_METHODOLOGY_VERSION, type UniversityReportPayload } from '@/types/contracts/university-reporting'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const parts = `${namespace}.${key}`.split('.')
    let cursor: unknown = en
    for (const part of parts) {
      cursor = (cursor as Record<string, unknown> | undefined)?.[part]
    }
    return typeof cursor === 'string' ? cursor : key
  },
}))

const payload: UniversityReportPayload = {
  ok: true,
  mapping_present: true,
  fail_closed_reason: null,
  report_id: 'rep-ui',
  university_id: 'uni-1',
  report_type: 'data_coverage_methodology',
  population: {
    kind: 'institution',
    cohort_id: null,
    graduation_year: null,
    program_text: null,
    major_id: null,
    degree_level: null,
    label_ar: 'جميع الانتماءات الموثّقة',
    label_en: 'All verified affiliations of the mapped university',
  },
  time_window: {
    label_ar: 'الصفوف النشطة',
    label_en: 'Active rows as of the data-as-of timestamp',
  },
  generated_at: '2026-08-31T12:00:00.000Z',
  generated_by: 'owner-1',
  data_as_of: '2026-08-31T12:00:00.000Z',
  methodology_version: UNIVERSITY_REPORT_METHODOLOGY_VERSION,
  metric_definitions: [
    {
      metric_key: 'verified_affiliation_count',
      name_ar: 'عدد الانتماءات الموثّقة',
      name_en: 'Verified affiliation count',
      source_definition: 'university_affiliations',
      population_definition: 'verified affiliations',
      window_definition: 'active',
      coverage_rule: 'VERIFIED only',
      missingness_rule: 'unknown stays unknown',
      privacy_rule: 'aggregate only',
      computability: 'COMPUTABLE',
    },
  ],
  coverage: {
    eligible_n: 0,
    observed_n: 0,
    known_n: 0,
    sufficient: false,
    suppressed: false,
    notes_ar: 'لا تتوفر تغطية كافية لإصدار هذا التقرير.',
    notes_en: 'Coverage is not sufficient to issue this report.',
  },
  missingness_notes_ar: 'البيانات الناقصة تبقى مجهولة.',
  missingness_notes_en: 'Missing data remains unknown and is not a negative outcome.',
  privacy_rules: {
    aggregate_only: true,
    named_graduate_fields: [],
    suppression_min_n: 5,
    suppression_preserved_in_export: true,
  },
  accreditation_boundary: {
    role: 'supporting_evidence',
    certifies_compliance: false,
    label_ar: 'أدلة مساندة',
    label_en: 'Supporting evidence',
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
  status: 'insufficient',
  aggregates: [
    {
      key: 'employment_rate',
      label_ar: 'معدل التوظيف',
      label_en: 'Employment rate',
      value: null,
      suppressed: false,
      status: 'contract_only',
    },
  ],
  intelligence_source: 'wave10_foundation',
}

describe('Wave 12 report methodology rendering', () => {
  it('makes methodology, data-as-of, coverage, and missingness visible', () => {
    render(<UniversityReportMethodology payload={payload} />)
    expect(screen.getByTestId('university-report-methodology')).toHaveTextContent(
      'How was this data calculated?',
    )
    expect(screen.getByTestId('university-report-data-as-of')).toBeTruthy()
    expect(screen.getByTestId('university-report-coverage')).toHaveTextContent(
      'Coverage is not sufficient to issue this report.',
    )
    expect(screen.getByTestId('university-report-missingness')).toHaveTextContent(
      'Missing data remains unknown',
    )
    expect(screen.getByText(UNIVERSITY_REPORT_METHODOLOGY_VERSION)).toBeTruthy()
  })

  it('does not render zeros or fake benchmarks as meaningful outcomes', () => {
    render(<UniversityReportResults payload={payload} />)
    expect(screen.getByTestId('university-report-insufficient')).toHaveTextContent(
      'Coverage is not sufficient to issue this report.',
    )
    expect(screen.getByTestId('aggregate-employment_rate')).toHaveTextContent('Not computable yet')
    expect(screen.getByText(/reliable comparison is not available/i)).toBeTruthy()
    expect(screen.queryByText('Accreditation compliant')).toBeNull()
  })
})
