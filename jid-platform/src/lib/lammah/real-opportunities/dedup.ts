import { createHash } from 'node:crypto'
import type { DuplicateMatch, DuplicateSignal, ValidatedOpportunity } from './types'

export function duplicateKey(candidate: {
  source_stable_id: string
  normalized_apply_url: string | null
  normalized_organization_name: string
  normalized_title: string
  location_city: string | null
  opens_at: string | null
  deadline_at: string | null
}): string {
  return [
    candidate.source_stable_id.trim().toLowerCase(),
    candidate.normalized_apply_url ?? '',
    candidate.normalized_organization_name,
    candidate.normalized_title,
    (candidate.location_city ?? '').toLowerCase(),
    candidate.opens_at ?? '',
    candidate.deadline_at ?? '',
  ].join('|')
}

export function evidenceChecksum(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function dateWindowOverlaps(left: ValidatedOpportunity, right: ValidatedOpportunity): boolean {
  const leftStart = left.opens_at ?? left.source_published_at
  const rightStart = right.opens_at ?? right.source_published_at
  const leftEnd = left.deadline_at
  const rightEnd = right.deadline_at
  if (!leftStart || !rightStart || !leftEnd || !rightEnd) return false
  return leftStart <= rightEnd && rightStart <= leftEnd
}

export function findDuplicates(candidates: readonly ValidatedOpportunity[]): DuplicateMatch[] {
  const matches: DuplicateMatch[] = []
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const left = candidates[i]
      const right = candidates[j]
      if (!left || !right) continue
      const signals: DuplicateSignal[] = []
      if (left.source_stable_id === right.source_stable_id) signals.push('source_stable_id')
      if (left.normalized_apply_url && left.normalized_apply_url === right.normalized_apply_url) {
        signals.push('normalized_apply_url')
      }
      if (left.normalized_source_url && left.normalized_source_url === right.normalized_source_url) {
        signals.push('normalized_source_url')
      }
      if (
        left.normalized_organization_name === right.normalized_organization_name
        && left.normalized_title === right.normalized_title
        && (left.location_city ?? '') === (right.location_city ?? '')
        && dateWindowOverlaps(left, right)
      ) {
        signals.push('org_title_location_window')
      }
      if (signals.length === 0) continue
      matches.push({
        other_source_record_key: `${left.source_record_key}::${right.source_record_key}`,
        signals,
        merge: signals.includes('source_stable_id') || signals.includes('normalized_apply_url'),
      })
    }
  }
  return matches
}
