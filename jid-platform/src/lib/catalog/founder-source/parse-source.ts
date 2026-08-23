import type { FounderConfidenceClass, FounderOwnershipClass, FounderSourceRow } from './types'
import { normalizeCatalogDomain } from './normalize'

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }
  fields.push(current)
  return fields
}

function headerIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

function cell(row: string[], index: number): string {
  if (index < 0) return ''
  return row[index]?.trim() ?? ''
}

function parseOwnership(value: string): FounderOwnershipClass | null {
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (v === 'government') return 'government'
  if (v === 'semi_government' || v === 'semi-government' || v === 'semigovernment') return 'semi_government'
  if (v === 'private') return 'private'
  return null
}

function parseConfidence(value: string): FounderConfidenceClass | null {
  const v = value.trim().toLowerCase()
  if (v === 'high' || v === 'high_confidence') return 'high'
  if (v === 'low' || v === 'low_confidence') return 'low'
  if (v === 'review' || v === 'review_required') return 'review_required'
  return null
}

function parseEntityType(value: string, sector: string): 'business' | 'university' {
  const v = value.trim().toLowerCase()
  if (v === 'university' || v === 'higher_education') return 'university'
  if (sector.toLowerCase().includes('university') || sector.includes('جامعة')) return 'university'
  return 'business'
}

export function parseFounderSourceCsv(content: string, sourceId = 'founder-1000-org'): FounderSourceRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]!)
  const idx = {
    sourceRecordId: headerIndex(headers, ['source_record_id', 'id', 'record_id', 'row_id']),
    nameEn: headerIndex(headers, ['name_en', 'name', 'english_name', 'organization_name_en']),
    nameAr: headerIndex(headers, ['name_ar', 'arabic_name', 'organization_name_ar']),
    domain: headerIndex(headers, ['domain', 'official_domain', 'primary_domain']),
    sourceRegion: headerIndex(headers, ['region', 'source_region', 'administrative_region']),
    city: headerIndex(headers, ['city', 'source_city']),
    sourceSector: headerIndex(headers, ['sector', 'source_sector', 'main_sector']),
    sourceSubsector: headerIndex(headers, ['subsector', 'source_subsector', 'sub_sector']),
    ownershipClass: headerIndex(headers, [
      'ownership',
      'ownership_type',
      'ownership_class',
      'classification',
    ]),
    confidenceClass: headerIndex(headers, ['confidence', 'confidence_class']),
    matchedPattern: headerIndex(headers, ['matched_pattern', 'match_pattern']),
    websiteUrl: headerIndex(headers, ['website_url', 'website']),
    careerPortalUrl: headerIndex(headers, ['career_portal_url', 'careers_url', 'career_portal']),
    entityType: headerIndex(headers, ['entity_type', 'organization_type']),
    manifestAction: headerIndex(headers, ['action', 'manifest_action', 'import_action']),
  }

  const rows: FounderSourceRow[] = []

  for (let lineNo = 1; lineNo < lines.length; lineNo++) {
    const fields = parseCsvLine(lines[lineNo]!)
    const sourceSector = cell(fields, idx.sourceSector)
    const sourceRecordId = cell(fields, idx.sourceRecordId) || `row-${lineNo}`
    const websiteUrl = cell(fields, idx.websiteUrl) || null
    const explicitDomain = cell(fields, idx.domain)
    const derivedDomain = explicitDomain || normalizeCatalogDomain(websiteUrl ?? '') || ''

    rows.push({
      sourceId,
      sourceRecordId,
      nameEn: cell(fields, idx.nameEn),
      nameAr: cell(fields, idx.nameAr),
      domain: derivedDomain,
      sourceRegion: cell(fields, idx.sourceRegion),
      city: cell(fields, idx.city) || null,
      sourceSector,
      sourceSubsector: cell(fields, idx.sourceSubsector) || null,
      ownershipClass: parseOwnership(cell(fields, idx.ownershipClass)),
      confidenceClass: parseConfidence(cell(fields, idx.confidenceClass)),
      websiteUrl,
      careerPortalUrl: cell(fields, idx.careerPortalUrl) || null,
      entityType: parseEntityType(cell(fields, idx.entityType), sourceSector),
      manifestAction:
        cell(fields, idx.manifestAction) ||
        cell(fields, idx.matchedPattern) ||
        null,
    })
  }

  return rows
}
