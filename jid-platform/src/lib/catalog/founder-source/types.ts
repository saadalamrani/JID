/** Founder 1,000-organization source row (governed import input — not Directory truth). */

export type FounderOwnershipClass = 'government' | 'semi_government' | 'private'

export type FounderConfidenceClass = 'high' | 'low' | 'review_required'

export type DryRunActionClass =
  | 'reconcile_existing'
  | 'repeated_domain_manual_review'
  | 'high_confidence_review_candidate'
  | 'low_confidence_review_candidate'
  | 'quarantined'
  | 'region_mapping_review_required'
  | 'sector_mapping_review_required'

export type FounderSourceRow = {
  sourceId: string
  sourceRecordId: string
  nameEn: string
  nameAr: string
  domain: string
  sourceRegion: string
  city: string | null
  sourceSector: string
  sourceSubsector: string | null
  ownershipClass: FounderOwnershipClass | null
  confidenceClass: FounderConfidenceClass | null
  websiteUrl: string | null
  careerPortalUrl: string | null
  entityType: 'business' | 'university'
  manifestAction: string | null
}

export type ExistingDirectoryRecord = {
  id: string
  name: string
  nameAr: string | null
  domains: string[]
  entityType: 'business' | 'university'
  slug: string | null
}

export type CanonicalRegion = {
  id: string
  slug: string
  nameEn: string
  nameAr: string
}

export type CanonicalSector = {
  id: string
  slug: string
  nameEn: string
  nameAr: string
}

export type RegionMappingResult =
  | { status: 'mapped'; canonical: CanonicalRegion }
  | { status: 'region_mapping_review_required'; sourceValue: string; reason: string }

export type SectorMappingResult =
  | { status: 'mapped'; canonical: CanonicalSector; subsectorNote: string | null }
  | { status: 'sector_mapping_review_required'; sourceValue: string; reason: string }
  | { status: 'founder_taxonomy_decision_required'; sourceValue: string; reason: string }

export type NormalizedFounderRow = {
  row: FounderSourceRow
  normalizedDomain: string | null
  normalizedNameEn: string
  normalizedNameAr: string
  domainValid: boolean
  domainInvalidReason: string | null
  region: RegionMappingResult
  sector: SectorMappingResult
}

export type DryRunRowOutcome = {
  sourceRecordId: string
  nameEn: string
  nameAr: string
  domain: string | null
  actionClass: DryRunActionClass
  matchTargetId: string | null
  matchTargetName: string | null
  repeatedDomainGroup: string | null
  regionStatus: RegionMappingResult['status']
  sectorStatus: SectorMappingResult['status']
  quarantineReason: string | null
  provenance: {
    sourceId: string
    sourceRecordId: string
    normalizedDomain: string | null
    normalizedNameEn: string
    normalizedNameAr: string
    manifestAction: string | null
    confidenceClass: FounderConfidenceClass | null
  }
}

export type DryRunSummary = {
  totalSourceRows: number
  normalized: number
  reconcileExisting: number
  repeatedDomainGroups: number
  repeatedDomainRows: number
  highConfidenceReviewCandidates: number
  lowConfidenceReviewCandidates: number
  quarantined: number
  regionMappingReviewRequired: number
  sectorMappingReviewRequired: number
  duplicateRisks: number
  invalidDomains: number
  databaseWrites: 0
  profileWrites: 0
  verificationWrites: 0
  ownershipMutations: 0
}

export type DryRunReport = {
  generatedAt: string
  sourcePath: string | null
  summary: DryRunSummary
  outcomes: DryRunRowOutcome[]
  repeatedDomainGroups: Array<{ domain: string; sourceRecordIds: string[] }>
  unmappedRegions: string[]
  unmappedSectors: string[]
  duplicateRiskPairs: Array<{ a: string; b: string; reason: string }>
}
