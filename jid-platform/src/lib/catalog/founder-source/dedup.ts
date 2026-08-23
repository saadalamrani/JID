import type { ExistingDirectoryRecord, FounderSourceRow } from './types'
import { normalizeCatalogDomain, normalizeMatchingName } from './normalize'

export type DomainMatchResult =
  | { kind: 'no_match' }
  | { kind: 'deterministic_existing'; record: ExistingDirectoryRecord; matchedDomain: string }

export function matchExistingByDomain(
  domain: string | null,
  existing: readonly ExistingDirectoryRecord[],
): DomainMatchResult {
  if (!domain) return { kind: 'no_match' }

  for (const record of existing) {
    for (const existingDomain of record.domains) {
      const normalizedExisting = normalizeCatalogDomain(existingDomain)
      if (normalizedExisting === domain) {
        return { kind: 'deterministic_existing', record, matchedDomain: normalizedExisting }
      }
    }
  }

  return { kind: 'no_match' }
}

export function findRepeatedDomainGroups(
  rows: readonly FounderSourceRow[],
): Map<string, string[]> {
  const byDomain = new Map<string, string[]>()

  for (const row of rows) {
    const domain = normalizeCatalogDomain(row.domain)
    if (!domain) continue
    const list = byDomain.get(domain) ?? []
    list.push(row.sourceRecordId)
    byDomain.set(domain, list)
  }

  const repeated = new Map<string, string[]>()
  for (const [domain, ids] of Array.from(byDomain.entries())) {
    if (ids.length > 1) repeated.set(domain, ids)
  }
  return repeated
}

export type NameGeographyDuplicateRisk = {
  a: string
  b: string
  reason: string
}

export function findProbableNameGeographyDuplicates(
  rows: readonly FounderSourceRow[],
): NameGeographyDuplicateRisk[] {
  const risks: NameGeographyDuplicateRisk[] = []
  const index = new Map<string, string[]>()

  for (const row of rows) {
    const key = `${normalizeMatchingName(row.nameEn)}|${normalizeMatchingName(row.nameAr)}|${row.sourceRegion.trim().toLowerCase()}`
    const ids = index.get(key) ?? []
    ids.push(row.sourceRecordId)
    index.set(key, ids)
  }

  for (const ids of Array.from(index.values())) {
    if (ids.length < 2) continue
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        risks.push({
          a: ids[i]!,
          b: ids[j]!,
          reason: 'normalized_name_and_source_region_agreement',
        })
      }
    }
  }

  return risks
}
