import { CANONICAL_REGIONS, findCanonicalRegionBySlug } from './canonical-taxonomy'
import type { CanonicalRegion, RegionMappingResult } from './types'

/** Deterministic SOURCE REGION → CANONICAL JID REGION. No fuzzy matching. */
const SOURCE_REGION_TO_SLUG: Readonly<Record<string, string>> = {
  // English variants observed in Saudi org datasets
  Riyadh: 'riyadh',
  'Riyadh Region': 'riyadh',
  'Riyadh Province': 'riyadh',
  Makkah: 'makkah',
  'Makkah Region': 'makkah',
  'Mecca': 'makkah',
  'Makkah Province': 'makkah',
  Madinah: 'madinah',
  'Madinah Region': 'madinah',
  'Medina': 'madinah',
  Qassim: 'qassim',
  'Al Qassim': 'qassim',
  'Eastern Province': 'eastern-province',
  'Eastern Region': 'eastern-province',
  'Ash Sharqiyah': 'eastern-province',
  Asir: 'asir',
  'Aseer': 'asir',
  Tabuk: 'tabuk',
  Hail: 'hail',
  "Ha'il": 'hail',
  'Northern Borders': 'northern-borders',
  Jazan: 'jazan',
  Jizan: 'jazan',
  Najran: 'najran',
  'Al Bahah': 'al-bahah',
  Bahah: 'al-bahah',
  'Al Jawf': 'al-jawf',
  Jawf: 'al-jawf',
  // Arabic canonical labels (common in founder datasets)
  الرياض: 'riyadh',
  'منطقة الرياض': 'riyadh',
  'مكة المكرمة': 'makkah',
  'منطقة مكة المكرمة': 'makkah',
  'المدينة المنورة': 'madinah',
  'منطقة المدينة المنورة': 'madinah',
  القصيم: 'qassim',
  'منطقة القصيم': 'qassim',
  'المنطقة الشرقية': 'eastern-province',
  الشرقية: 'eastern-province',
  عسير: 'asir',
  'منطقة عسير': 'asir',
  تبوك: 'tabuk',
  'منطقة تبوك': 'tabuk',
  حائل: 'hail',
  'منطقة حائل': 'hail',
  'الحدود الشمالية': 'northern-borders',
  جازان: 'jazan',
  'منطقة جازان': 'jazan',
  نجران: 'najran',
  'منطقة نجران': 'najran',
  الباحة: 'al-bahah',
  'منطقة الباحة': 'al-bahah',
  الجوف: 'al-jawf',
  'منطقة الجوف': 'al-jawf',
  'منطقة الحدود الشمالية': 'northern-borders',
}

export function mapSourceRegion(sourceRegion: string): RegionMappingResult {
  const trimmed = sourceRegion.trim()
  if (!trimmed) {
    return {
      status: 'region_mapping_review_required',
      sourceValue: sourceRegion,
      reason: 'empty_source_region',
    }
  }

  const slug = SOURCE_REGION_TO_SLUG[trimmed]
  if (!slug) {
    return {
      status: 'region_mapping_review_required',
      sourceValue: trimmed,
      reason: 'no_deterministic_mapping',
    }
  }

  const canonical = findCanonicalRegionBySlug(slug)
  if (!canonical) {
    return {
      status: 'region_mapping_review_required',
      sourceValue: trimmed,
      reason: 'canonical_slug_missing',
    }
  }

  return { status: 'mapped', canonical }
}

export function listCanonicalRegions(): readonly CanonicalRegion[] {
  return CANONICAL_REGIONS
}

export function listSourceRegionMappings(): Array<{
  sourceRegion: string
  canonicalSlug: string
  canonicalNameEn: string
}> {
  return Object.entries(SOURCE_REGION_TO_SLUG).map(([sourceRegion, canonicalSlug]) => {
    const canonical = findCanonicalRegionBySlug(canonicalSlug)
    return {
      sourceRegion,
      canonicalSlug,
      canonicalNameEn: canonical?.nameEn ?? canonicalSlug,
    }
  })
}

export function computeAbsentCanonicalRegions(sourceRegionsSeen: string[]): CanonicalRegion[] {
  const mappedSlugs = new Set(
    sourceRegionsSeen
      .map((value) => mapSourceRegion(value))
      .filter((result): result is { status: 'mapped'; canonical: CanonicalRegion } => result.status === 'mapped')
      .map((result) => result.canonical.slug),
  )
  return CANONICAL_REGIONS.filter((region) => !mappedSlugs.has(region.slug))
}

/** @deprecated Use computeAbsentCanonicalRegions */
export function listUnmappedCanonicalRegions(sourceRegionsSeen: string[]): CanonicalRegion[] {
  return computeAbsentCanonicalRegions(sourceRegionsSeen)
}
