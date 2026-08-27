import {
  CAREER_EVIDENCE_CATEGORIES,
  type CareerEvidence,
  type CareerEvidenceCategory,
} from '@/types/contracts'
import { formatDate } from '@/lib/utils/format'
import type { Locale } from '@/lib/i18n/config'

export type CareerEvidenceDisplayField = {
  key: string
  value: string
}

export type CareerEvidenceDisplay = {
  title: string | null
  subtitle: string | null
  fields: readonly CareerEvidenceDisplayField[]
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => asNonEmptyString(item)).filter((item): item is string => item !== null)
}

function asYear(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  return asNonEmptyString(value)
}

function readPayload(evidence: CareerEvidence, key: string): unknown {
  return evidence.fact_payload[key]
}

function firstPresent(evidence: CareerEvidence, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = asNonEmptyString(readPayload(evidence, key))
    if (value) return value
  }
  return null
}

function dateRangeLabel(evidence: CareerEvidence, locale: Locale): string | null {
  const startYear = asYear(readPayload(evidence, 'start_year'))
  const endYear = asYear(readPayload(evidence, 'end_year'))
  const isCurrent = readPayload(evidence, 'is_current') === true
  const effectiveFrom = asNonEmptyString(evidence.effective_from)
  const effectiveTo = asNonEmptyString(evidence.effective_to)

  if (startYear || endYear || isCurrent) {
    if (startYear && isCurrent) return `${startYear} –`
    if (startYear && endYear) return `${startYear} – ${endYear}`
    if (startYear) return startYear
    if (endYear) return endYear
  }

  if (effectiveFrom && effectiveTo) {
    return `${formatDate(effectiveFrom, locale, { year: 'numeric', month: 'short' })} – ${formatDate(effectiveTo, locale, { year: 'numeric', month: 'short' })}`
  }
  if (effectiveFrom) {
    return formatDate(effectiveFrom, locale, { year: 'numeric', month: 'short' })
  }
  return null
}

function pushField(fields: CareerEvidenceDisplayField[], key: string, value: string | null): void {
  if (value) fields.push({ key, value })
}

export function careerEvidenceDisplay(
  evidence: CareerEvidence,
  locale: Locale,
): CareerEvidenceDisplay {
  const fields: CareerEvidenceDisplayField[] = []
  const title = firstPresent(evidence, [
    'title',
    'job_title',
    'institution_name',
    'company_name',
    'name',
    'skill_name',
    'credential_name',
  ])
  const subtitle = firstPresent(evidence, [
    'degree',
    'field_of_study',
    'issuer',
    'organization',
    'role',
    'employment_type',
  ])

  pushField(fields, 'institution_name', asNonEmptyString(readPayload(evidence, 'institution_name')))
  pushField(fields, 'company_name', asNonEmptyString(readPayload(evidence, 'company_name')))
  pushField(fields, 'job_title', asNonEmptyString(readPayload(evidence, 'job_title')))
  pushField(fields, 'degree', asNonEmptyString(readPayload(evidence, 'degree')))
  pushField(fields, 'field_of_study', asNonEmptyString(readPayload(evidence, 'field_of_study')))
  pushField(fields, 'issuer', asNonEmptyString(readPayload(evidence, 'issuer')))
  pushField(fields, 'organization', asNonEmptyString(readPayload(evidence, 'organization')))
  pushField(fields, 'role', asNonEmptyString(readPayload(evidence, 'role')))
  pushField(
    fields,
    'location',
    firstPresent(evidence, ['location', 'institution_city', 'company_city']),
  )
  pushField(fields, 'dates', dateRangeLabel(evidence, locale))
  pushField(fields, 'url', asNonEmptyString(readPayload(evidence, 'url')))
  pushField(fields, 'description', asNonEmptyString(readPayload(evidence, 'description')))

  const bullets = asStringList(readPayload(evidence, 'bullets'))
  for (let index = 0; index < bullets.length; index += 1) {
    const bullet = bullets[index]
    if (bullet) pushField(fields, `bullet_${index + 1}`, bullet)
  }

  const uniqueFields = fields.filter((field, index) => {
    if (field.value === title || field.value === subtitle) {
      return (
        ['dates', 'location', 'url', 'description'].includes(field.key) ||
        field.key.startsWith('bullet_')
      )
    }
    return fields.findIndex((candidate) => candidate.key === field.key) === index
  })

  return {
    title,
    subtitle: subtitle === title ? null : subtitle,
    fields: uniqueFields,
  }
}

export function groupCareerEvidenceByCategory(
  items: readonly CareerEvidence[],
): Record<CareerEvidenceCategory, CareerEvidence[]> {
  const grouped = Object.fromEntries(
    CAREER_EVIDENCE_CATEGORIES.map((category) => [category, [] as CareerEvidence[]]),
  ) as Record<CareerEvidenceCategory, CareerEvidence[]>

  for (const item of items) {
    grouped[item.category].push(item)
  }
  return grouped
}

export const ADD_EVIDENCE_FIELD_KEYS: Record<CareerEvidenceCategory, readonly string[]> = {
  EDUCATION: ['institution_name', 'degree', 'field_of_study', 'start_year', 'end_year'],
  EXPERIENCE: ['company_name', 'job_title', 'location', 'start_year', 'end_year'],
  SKILL: ['name'],
  PROJECT: ['title', 'url', 'description'],
  CREDENTIAL: ['title', 'issuer'],
  AWARD: ['title', 'issuer'],
  LANGUAGE: ['name'],
  VOLUNTEERING: ['organization', 'role'],
  PUBLICATION: ['title', 'url'],
  OTHER: ['title'],
}

export function buildDeclaredFactPayload(
  values: Readonly<Record<string, string>>,
): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const [key, raw] of Object.entries(values)) {
    const value = asNonEmptyString(raw)
    if (value) payload[key] = value
  }
  return payload
}
