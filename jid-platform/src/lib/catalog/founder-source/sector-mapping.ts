import {
  FOUNDER_SOURCE_SECTOR_REASONING,
  FOUNDER_SOURCE_SECTOR_TO_SLUG,
  ORGANIZATION_STRUCTURE_SOURCE_SECTORS,
} from './founder-sector-map'
import { CANONICAL_SECTORS, findCanonicalSectorBySlug } from './canonical-taxonomy'
import type { CanonicalSector, SectorMappingResult } from './types'

/** Subsectors that map to a canonical parent sector. */
const SOURCE_SUBSECTOR_PARENT_SLUG: Readonly<Record<string, string>> = {
  Petrochemicals: 'chemicals',
  البتروكيماويات: 'chemicals',
  'Islamic Banking': 'finance-banking',
  'المصرفية الإسلامية': 'finance-banking',
  'Higher Education': 'education',
  'التعليم العالي': 'education',
  Hospitals: 'healthcare',
  المستشفيات: 'healthcare',
}

export function mapSourceSector(
  sourceSector: string,
  sourceSubsector: string | null,
): SectorMappingResult {
  const sectorTrimmed = sourceSector.trim()
  if (!sectorTrimmed) {
    return {
      status: 'sector_mapping_review_required',
      sourceValue: sourceSector,
      reason: 'empty_source_sector',
    }
  }

  if (ORGANIZATION_STRUCTURE_SOURCE_SECTORS.has(sectorTrimmed)) {
    return {
      status: 'sector_mapping_review_required',
      sourceValue: sectorTrimmed,
      reason: 'organization_structure_not_operating_sector_tax_003',
    }
  }

  const subsectorTrimmed = sourceSubsector?.trim() ?? ''
  if (subsectorTrimmed && SOURCE_SUBSECTOR_PARENT_SLUG[subsectorTrimmed]) {
    const parentSlug = SOURCE_SUBSECTOR_PARENT_SLUG[subsectorTrimmed]
    const canonical = findCanonicalSectorBySlug(parentSlug)
    if (canonical) {
      return {
        status: 'mapped',
        canonical,
        subsectorNote: `source_subsector:${subsectorTrimmed}`,
      }
    }
  }

  const slug = FOUNDER_SOURCE_SECTOR_TO_SLUG[sectorTrimmed]
  if (!slug) {
    return {
      status: 'sector_mapping_review_required',
      sourceValue: sectorTrimmed,
      reason: 'no_deterministic_mapping',
    }
  }

  const canonical = findCanonicalSectorBySlug(slug)
  if (!canonical) {
    return {
      status: 'sector_mapping_review_required',
      sourceValue: sectorTrimmed,
      reason: 'canonical_slug_missing',
    }
  }

  return {
    status: 'mapped',
    canonical,
    subsectorNote: subsectorTrimmed ? `source_subsector:${subsectorTrimmed}` : null,
  }
}

export function listCanonicalSectors(): readonly CanonicalSector[] {
  return CANONICAL_SECTORS
}

export function listSourceSectorMappings(): Array<{
  sourceSector: string
  canonicalSlug: string
  canonicalNameEn: string
  reasoning: string
}> {
  return Object.entries(FOUNDER_SOURCE_SECTOR_TO_SLUG).map(([sourceSector, canonicalSlug]) => {
    const canonical = findCanonicalSectorBySlug(canonicalSlug)
    return {
      sourceSector,
      canonicalSlug,
      canonicalNameEn: canonical?.nameEn ?? canonicalSlug,
      reasoning: FOUNDER_SOURCE_SECTOR_REASONING[sourceSector] ?? 'Deterministic synonym mapping.',
    }
  })
}

export function getSectorMappingReasoning(sourceSector: string): string {
  return FOUNDER_SOURCE_SECTOR_REASONING[sourceSector.trim()] ?? 'No documented reasoning.'
}
