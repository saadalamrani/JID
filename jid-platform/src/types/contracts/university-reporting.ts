import type { UniversityOutcomePresence, UniversityOutcomeSource } from './university'

export const UNIVERSITY_REPORT_TYPES = [
  'cohort_outcome_summary',
  'program_employability_evidence',
  'employer_alignment_summary',
  'career_readiness_activity',
  'data_coverage_methodology',
] as const
export type UniversityReportType = (typeof UNIVERSITY_REPORT_TYPES)[number]

export const UNIVERSITY_REPORT_STATUSES = ['preview', 'generated', 'insufficient', 'suppressed'] as const
export type UniversityReportStatus = (typeof UNIVERSITY_REPORT_STATUSES)[number]

export const UNIVERSITY_BENCHMARK_STATUSES = ['UNAVAILABLE', 'AVAILABLE'] as const
export type UniversityBenchmarkStatus = (typeof UNIVERSITY_BENCHMARK_STATUSES)[number]

export const UNIVERSITY_REPORT_METHODOLOGY_VERSION = 'wave12.1.0'

export const UNIVERSITY_REPORT_FORBIDDEN_PAYLOAD_KEYS = [
  'email',
  'phone',
  'full_name',
  'name',
  'cv',
  'career_record',
  'application',
  'hiring_note',
  'sourcing_state',
  'individual_id',
  'affiliation_id',
] as const

export const UNIVERSITY_REPORT_FORBIDDEN_CLAIMS = [
  'Accreditation compliant',
  'accreditation compliant',
  'معتمد من هيئة',
  'متوافق مع الاعتماد',
  'يحقق معيار الاعتماد',
] as const

export type UniversityReportPopulation = {
  kind: 'institution' | 'cohort' | 'program'
  cohort_id: string | null
  graduation_year: number | null
  program_text: string | null
  major_id: string | null
  degree_level: string | null
  label_ar: string
  label_en: string
}

export type UniversityReportCoverage = {
  eligible_n: number | null
  observed_n: number | null
  known_n: number | null
  sufficient: boolean
  suppressed: boolean
  notes_ar: string
  notes_en: string
}

export type UniversityReportAggregate = {
  key: string
  label_ar: string
  label_en: string
  value: number | null
  suppressed: boolean
  status: 'available' | 'suppressed' | 'insufficient' | 'contract_only' | 'unknown'
  source?: UniversityOutcomeSource
  presence?: UniversityOutcomePresence
  category?: 'EMPLOYED' | 'FURTHER_STUDY' | 'OTHER' | 'UNKNOWN'
}

export type UniversityReportMetricDefinition = {
  metric_key: string
  name_ar: string
  name_en: string
  source_definition: string
  population_definition: string
  window_definition: string
  coverage_rule: string
  missingness_rule: string
  privacy_rule: string
  computability: 'CONTRACT_ONLY' | 'COMPUTABLE'
}

export type UniversityReportBenchmark = {
  status: UniversityBenchmarkStatus
  live: boolean
  ranking: null
  percentile: null
  national_average: null
  reason_ar: string
  reason_en: string
}

export type UniversityReportPayload = {
  ok: boolean
  mapping_present: boolean
  fail_closed_reason:
    | 'unauthenticated'
    | 'no_owned_profile'
    | 'unmapped'
    | 'cohort_not_found'
    | 'unauthorized'
    | 'not_found'
    | null
  report_id: string | null
  university_id: string | null
  report_type: UniversityReportType | null
  population: UniversityReportPopulation | null
  time_window: { label_ar: string; label_en: string }
  generated_at: string | null
  generated_by: string | null
  data_as_of: string | null
  methodology_version: string
  metric_definitions: UniversityReportMetricDefinition[]
  coverage: UniversityReportCoverage
  missingness_notes_ar: string
  missingness_notes_en: string
  privacy_rules: {
    aggregate_only: boolean
    named_graduate_fields: []
    suppression_min_n: number
    suppression_preserved_in_export: true
  }
  accreditation_boundary: {
    role: 'supporting_evidence'
    certifies_compliance: false
    label_ar: string
    label_en: string
  }
  benchmark: UniversityReportBenchmark
  status: UniversityReportStatus
  aggregates: UniversityReportAggregate[]
  intelligence_source: 'wave10_foundation' | 'wave11_overlay'
}

export type UniversityReportHistoryItem = {
  report_id: string
  report_type: UniversityReportType
  status: UniversityReportStatus
  generated_at: string
  data_as_of: string
  population_label_ar: string
  population_label_en: string
  methodology_version: string
}
