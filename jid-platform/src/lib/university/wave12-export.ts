import {
  UNIVERSITY_REPORT_FORBIDDEN_CLAIMS,
  UNIVERSITY_REPORT_FORBIDDEN_PAYLOAD_KEYS,
  type UniversityReportPayload,
} from '@/types/contracts/university-reporting'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function assertUniversityReportPayloadPrivacy(payload: UniversityReportPayload): void {
  const blob = JSON.stringify(payload)
  for (const key of UNIVERSITY_REPORT_FORBIDDEN_PAYLOAD_KEYS) {
    if (new RegExp(`"${key}"\\s*:`, 'i').test(blob)) {
      throw new Error(`named or private field leaked in report payload: ${key}`)
    }
  }
  for (const claim of UNIVERSITY_REPORT_FORBIDDEN_CLAIMS) {
    if (blob.includes(claim)) {
      throw new Error(`forbidden accreditation claim in report payload: ${claim}`)
    }
  }
  if (payload.privacy_rules.named_graduate_fields.length !== 0) {
    throw new Error('named graduate fields must remain empty')
  }
  if (payload.benchmark.live || payload.benchmark.status === 'AVAILABLE') {
    throw new Error('live benchmark must not appear without governed comparable data')
  }
  if (payload.benchmark.ranking !== null || payload.benchmark.percentile !== null) {
    throw new Error('unsupported ranking leaked')
  }
  if (payload.accreditation_boundary.certifies_compliance) {
    throw new Error('accreditation certification is forbidden')
  }
}

export function buildUniversityReportCsv(payload: UniversityReportPayload): string {
  assertUniversityReportPayloadPrivacy(payload)
  const lines: string[] = []
  const meta: Array<[string, string]> = [
    ['report_id', payload.report_id ?? ''],
    ['university_id', payload.university_id ?? ''],
    ['report_type', payload.report_type ?? ''],
    ['report_title', payload.population?.label_en ?? ''],
    ['population_ar', payload.population?.label_ar ?? ''],
    ['population_en', payload.population?.label_en ?? ''],
    ['time_window_ar', payload.time_window.label_ar],
    ['time_window_en', payload.time_window.label_en],
    ['generated_at', payload.generated_at ?? ''],
    ['data_as_of', payload.data_as_of ?? ''],
    ['methodology_version', payload.methodology_version],
    ['coverage_notes_ar', payload.coverage.notes_ar],
    ['coverage_notes_en', payload.coverage.notes_en],
    ['missingness_ar', payload.missingness_notes_ar],
    ['missingness_en', payload.missingness_notes_en],
    ['accreditation_boundary_ar', payload.accreditation_boundary.label_ar],
    ['accreditation_boundary_en', payload.accreditation_boundary.label_en],
    ['benchmark_status', payload.benchmark.status],
    ['benchmark_reason_en', payload.benchmark.reason_en],
    ['status', payload.status],
  ]
  lines.push('field,value')
  for (const [field, value] of meta) {
    lines.push(`${csvEscape(field)},${csvEscape(value)}`)
  }
  lines.push('')
  lines.push('aggregate_key,label_en,label_ar,status,suppressed,value')
  for (const row of payload.aggregates) {
    const value = row.suppressed || row.status === 'suppressed' || row.status === 'insufficient' || row.status === 'contract_only'
      ? ''
      : row.value === null
        ? ''
        : String(row.value)
    lines.push(
      [
        csvEscape(row.key),
        csvEscape(row.label_en),
        csvEscape(row.label_ar),
        csvEscape(row.status),
        csvEscape(row.suppressed ? 'true' : 'false'),
        csvEscape(value),
      ].join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

export function csvLeaksNumericValue(csv: string, value: number): boolean {
  return new RegExp(`(^|,)${value}(,|$)`, 'm').test(csv)
}
