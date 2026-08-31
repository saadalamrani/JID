import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type {
  UniversityReportHistoryItem,
  UniversityReportPayload,
  UniversityReportType,
} from '@/types/contracts/university-reporting'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

function isMissingRelation(error: { message: string }): boolean {
  return /does not exist|schema cache|could not find/i.test(error.message)
}

const FAIL_CLOSED: UniversityReportPayload = {
  ok: false,
  mapping_present: false,
  fail_closed_reason: 'unmapped',
  report_id: null,
  university_id: null,
  report_type: null,
  population: null,
  time_window: { label_ar: '', label_en: '' },
  generated_at: null,
  generated_by: null,
  data_as_of: null,
  methodology_version: 'wave12.1.0',
  metric_definitions: [],
  coverage: {
    eligible_n: null,
    observed_n: null,
    known_n: null,
    sufficient: false,
    suppressed: false,
    notes_ar: 'لا تتوفر تغطية كافية لإصدار هذا التقرير.',
    notes_en: 'Coverage is not sufficient to issue this report.',
  },
  missingness_notes_ar: 'البيانات الناقصة تبقى مجهولة وليست نتيجة سلبية.',
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
  status: 'insufficient',
  aggregates: [],
  intelligence_source: 'wave10_foundation',
}

export async function previewUniversityReport(input: {
  reportType: UniversityReportType
  cohortId?: string | null
}): Promise<UniversityReportPayload> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_report_preview', {
    p_report_type: input.reportType,
    p_cohort_id: input.cohortId ?? null,
  })
  if (error) {
    if (isMissingRelation(error)) return FAIL_CLOSED
    throw new Error(error.message)
  }
  return data as UniversityReportPayload
}

export async function fetchUniversityReport(reportId: string): Promise<UniversityReportPayload> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_report_get', {
    p_report_id: reportId,
  })
  if (error) {
    if (isMissingRelation(error)) return { ...FAIL_CLOSED, fail_closed_reason: 'not_found' }
    throw new Error(error.message)
  }
  return data as UniversityReportPayload
}

export async function fetchUniversityReportHistory(): Promise<UniversityReportHistoryItem[]> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_report_list')
  if (error) {
    if (isMissingRelation(error)) return []
    throw new Error(error.message)
  }
  return (data as UniversityReportHistoryItem[] | null) ?? []
}

export async function fetchUniversityReportExportPayload(
  reportId: string,
): Promise<UniversityReportPayload> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_report_export_payload', {
    p_report_id: reportId,
  })
  if (error) {
    if (isMissingRelation(error)) return { ...FAIL_CLOSED, fail_closed_reason: 'not_found' }
    throw new Error(error.message)
  }
  return data as UniversityReportPayload
}
