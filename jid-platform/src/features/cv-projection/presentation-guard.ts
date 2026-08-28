import type { CvPresentationPayload } from './operations'

export const FORBIDDEN_CV_PRESENTATION_FACT_KEYS = [
  'institution_name',
  'company_name',
  'degree',
  'job_title',
  'start_year',
  'end_year',
  'start_month',
  'end_month',
  'issuer',
  'skill_name',
  'name',
  'proficiency',
  'verification_state',
  'source_class',
  'fact_payload',
] as const

const ALLOWED_KEYS = new Set([
  'display_title',
  'summary',
  'selected_bullets',
  'section_label',
  'locale_variant',
  'notes',
])

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Presentation wording for a CV. Rejects canonical fact keys so formatting never
 * mutates Career Record truth in frontend state.
 */
export function sanitizePresentationPayload(
  input: Readonly<Record<string, unknown>>,
): CvPresentationPayload {
  const payload: CvPresentationPayload = {}

  if (ALLOWED_KEYS.has('display_title')) {
    const displayTitle = asNonEmptyString(input.display_title)
    if (displayTitle) payload.display_title = displayTitle
  }
  const summary = asNonEmptyString(input.summary)
  if (summary) payload.summary = summary
  const sectionLabel = asNonEmptyString(input.section_label)
  if (sectionLabel) payload.section_label = sectionLabel
  const localeVariant = asNonEmptyString(input.locale_variant)
  if (localeVariant) payload.locale_variant = localeVariant
  const notes = asNonEmptyString(input.notes)
  if (notes) payload.notes = notes

  if (Array.isArray(input.selected_bullets)) {
    const bullets = input.selected_bullets
      .map((item) => asNonEmptyString(item))
      .filter((item): item is string => Boolean(item))
    if (bullets.length > 0) payload.selected_bullets = bullets
  }

  return payload
}

export function presentationPayloadHasForbiddenFactKeys(
  input: Readonly<Record<string, unknown>>,
): boolean {
  return FORBIDDEN_CV_PRESENTATION_FACT_KEYS.some((key) => key in input && input[key] !== undefined)
}

export function cloneEvidenceFacts<T extends { fact_payload: Readonly<Record<string, unknown>> }>(
  evidence: readonly T[],
): readonly T[] {
  return evidence.map((item) => ({
    ...item,
    fact_payload: { ...item.fact_payload },
  }))
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [removed] = next.splice(from, 1)
  if (removed === undefined) return [...items]
  next.splice(to, 0, removed)
  return next
}
