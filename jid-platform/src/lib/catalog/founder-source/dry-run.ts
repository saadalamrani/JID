import { findProbableNameGeographyDuplicates, findRepeatedDomainGroups, matchExistingByDomain } from './dedup'
import { isPlaceholderDomain, normalizeCatalogDomain, normalizeMatchingName } from './normalize'
import { mapSourceRegion } from './region-mapping'
import { mapSourceSector } from './sector-mapping'
import type {
  DryRunActionClass,
  DryRunReport,
  DryRunRowOutcome,
  DryRunSummary,
  ExistingDirectoryRecord,
  FounderSourceRow,
  NormalizedFounderRow,
} from './types'

export function normalizeFounderRow(row: FounderSourceRow): NormalizedFounderRow {
  const normalizedDomain = normalizeCatalogDomain(row.domain)
  const domainValid = Boolean(normalizedDomain) && !isPlaceholderDomain(normalizedDomain)

  return {
    row,
    normalizedDomain,
    normalizedNameEn: normalizeMatchingName(row.nameEn),
    normalizedNameAr: normalizeMatchingName(row.nameAr),
    domainValid,
    domainInvalidReason: !normalizedDomain
      ? 'missing_or_unparseable_domain'
      : isPlaceholderDomain(normalizedDomain)
        ? 'placeholder_or_seed_domain'
        : null,
    region: mapSourceRegion(row.sourceRegion),
    sector: mapSourceSector(row.sourceSector, row.sourceSubsector),
  }
}

function classifyConfidence(row: FounderSourceRow): 'high' | 'low' {
  if (row.confidenceClass === 'high') return 'high'
  if (row.confidenceClass === 'low') return 'low'
  if (row.ownershipClass === 'government' || row.ownershipClass === 'semi_government') return 'high'
  return 'low'
}

function resolveActionClass(
  normalized: NormalizedFounderRow,
  existingMatch: ReturnType<typeof matchExistingByDomain>,
  repeatedDomain: string | null,
): DryRunActionClass {
  if (!normalized.domainValid || !normalized.row.nameEn || !normalized.row.nameAr) {
    return 'quarantined'
  }
  if (existingMatch.kind === 'deterministic_existing') {
    return 'reconcile_existing'
  }
  if (repeatedDomain) {
    return 'repeated_domain_manual_review'
  }
  if (normalized.region.status === 'region_mapping_review_required') {
    return 'region_mapping_review_required'
  }
  if (
    normalized.sector.status === 'sector_mapping_review_required' ||
    normalized.sector.status === 'founder_taxonomy_decision_required'
  ) {
    return 'sector_mapping_review_required'
  }
  if (classifyConfidence(normalized.row) === 'high') {
    return 'high_confidence_review_candidate'
  }
  return 'low_confidence_review_candidate'
}

export function runFounderSourceDryRun(options: {
  rows: readonly FounderSourceRow[]
  existingDirectory: readonly ExistingDirectoryRecord[]
  sourcePath?: string | null
}): DryRunReport {
  const repeatedGroups = findRepeatedDomainGroups(options.rows)
  const duplicateRiskPairs = findProbableNameGeographyDuplicates(options.rows)
  const outcomes: DryRunRowOutcome[] = []

  const unmappedRegions = new Set<string>()
  const unmappedSectors = new Set<string>()

  for (const row of options.rows) {
    const normalized = normalizeFounderRow(row)
    const domain = normalized.normalizedDomain
    const repeatedDomain = domain && repeatedGroups.has(domain) ? domain : null
    const existingMatch = matchExistingByDomain(domain, options.existingDirectory)
    const actionClass = resolveActionClass(normalized, existingMatch, repeatedDomain)

    if (normalized.region.status === 'region_mapping_review_required') {
      unmappedRegions.add(normalized.region.sourceValue)
    }
    if (
      normalized.sector.status === 'sector_mapping_review_required' ||
      normalized.sector.status === 'founder_taxonomy_decision_required'
    ) {
      unmappedSectors.add(normalized.sector.sourceValue)
    }

    outcomes.push({
      sourceRecordId: row.sourceRecordId,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      domain,
      actionClass,
      matchTargetId: existingMatch.kind === 'deterministic_existing' ? existingMatch.record.id : null,
      matchTargetName: existingMatch.kind === 'deterministic_existing' ? existingMatch.record.name : null,
      repeatedDomainGroup: repeatedDomain,
      regionStatus: normalized.region.status,
      sectorStatus: normalized.sector.status,
      quarantineReason:
        actionClass === 'quarantined'
          ? normalized.domainInvalidReason ?? 'missing_required_identity_fields'
          : null,
      provenance: {
        sourceId: row.sourceId,
        sourceRecordId: row.sourceRecordId,
        normalizedDomain: domain,
        normalizedNameEn: normalized.normalizedNameEn,
        normalizedNameAr: normalized.normalizedNameAr,
        manifestAction: row.manifestAction,
        confidenceClass: row.confidenceClass,
      },
    })
  }

  const summary: DryRunSummary = {
    totalSourceRows: options.rows.length,
    normalized: outcomes.filter((o) => o.domain !== null && o.nameEn && o.nameAr).length,
    reconcileExisting: outcomes.filter((o) => o.actionClass === 'reconcile_existing').length,
    repeatedDomainGroups: repeatedGroups.size,
    repeatedDomainRows: Array.from(repeatedGroups.values()).reduce((sum, ids) => sum + ids.length, 0),
    highConfidenceReviewCandidates: outcomes.filter(
      (o) => o.actionClass === 'high_confidence_review_candidate',
    ).length,
    lowConfidenceReviewCandidates: outcomes.filter(
      (o) => o.actionClass === 'low_confidence_review_candidate',
    ).length,
    quarantined: outcomes.filter((o) => o.actionClass === 'quarantined').length,
    regionMappingReviewRequired: outcomes.filter(
      (o) => o.actionClass === 'region_mapping_review_required',
    ).length,
    sectorMappingReviewRequired: outcomes.filter(
      (o) => o.actionClass === 'sector_mapping_review_required',
    ).length,
    duplicateRisks: duplicateRiskPairs.length,
    invalidDomains: outcomes.filter((o) => o.domain === null).length,
    databaseWrites: 0,
    profileWrites: 0,
    verificationWrites: 0,
    ownershipMutations: 0,
  }

  return {
    generatedAt: new Date().toISOString(),
    sourcePath: options.sourcePath ?? null,
    summary,
    outcomes,
    repeatedDomainGroups: Array.from(repeatedGroups.entries()).map(([domain, sourceRecordIds]) => ({
      domain,
      sourceRecordIds,
    })),
    unmappedRegions: Array.from(unmappedRegions).sort(),
    unmappedSectors: Array.from(unmappedSectors).sort(),
    duplicateRiskPairs,
  }
}

/** Protected Directory records from migrations — used for deterministic domain reconciliation. */
export const REFERENCE_EXISTING_DIRECTORY: readonly ExistingDirectoryRecord[] = [
  {
    id: 'reference-aramco',
    name: 'Saudi Aramco',
    nameAr: 'أرامكو السعودية',
    domains: ['aramco.com', 'aramco.sa'],
    entityType: 'business',
    slug: null,
  },
  {
    id: 'reference-sabic',
    name: 'SABIC',
    nameAr: 'سابك',
    domains: ['sabic.com', 'sabic.sa'],
    entityType: 'business',
    slug: null,
  },
  {
    id: 'reference-ksu',
    name: 'King Saud University',
    nameAr: 'جامعة الملك سعود',
    domains: ['ksu.edu.sa'],
    entityType: 'university',
    slug: null,
  },
  {
    id: 'reference-kau',
    name: 'King Abdulaziz University',
    nameAr: 'جامعة الملك عبدالعزيز',
    domains: ['kau.edu.sa'],
    entityType: 'university',
    slug: null,
  },
]
