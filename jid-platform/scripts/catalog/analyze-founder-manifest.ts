/**
 * One-off analysis helper for founder manifest — stdout JSON only.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  mapSourceRegion,
  mapSourceSector,
  normalizeCatalogDomain,
  parseFounderSourceCsv,
  runFounderSourceDryRun,
  REFERENCE_EXISTING_DIRECTORY,
} from '../../src/lib/catalog/founder-source'
import { CANONICAL_REGIONS } from '../../src/lib/catalog/founder-source/canonical-taxonomy'

const path = join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv')
const content = readFileSync(path, 'utf8')
const rows = parseFounderSourceCsv(content)
const report = runFounderSourceDryRun({ rows, existingDirectory: REFERENCE_EXISTING_DIRECTORY, sourcePath: path })

const sourceRegions = new Set(rows.map((r) => r.sourceRegion.trim()).filter(Boolean))
const sourceSectors = new Set(rows.map((r) => r.sourceSector.trim()).filter(Boolean))

const mappedRegionSlugs = new Set<string>()
const unmappedRegions: string[] = []
for (const region of sourceRegions) {
  const result = mapSourceRegion(region)
  if (result.status === 'mapped') mappedRegionSlugs.add(result.canonical.slug)
  else unmappedRegions.push(region)
}

const absentCanonicalRegions = CANONICAL_REGIONS.filter((r) => !mappedRegionSlugs.has(r.slug))

const sectorInventory: Record<string, { count: number; mapping: string }> = {}
for (const sector of sourceSectors) {
  const count = rows.filter((r) => r.sourceSector.trim() === sector).length
  const mapped = mapSourceSector(sector, null)
  sectorInventory[sector] = {
    count,
    mapping:
      mapped.status === 'mapped'
        ? mapped.canonical.slug
        : mapped.status === 'founder_taxonomy_decision_required'
          ? 'FOUNDER_TAXONOMY_DECISION'
          : 'REVIEW_REQUIRED',
  }
}

console.log(
  JSON.stringify(
    {
      summary: report.summary,
      sourceRegionCount: sourceRegions.size,
      sourceSectorCount: sourceSectors.size,
      unmappedRegions,
      absentCanonicalRegions: absentCanonicalRegions.map((r) => ({ slug: r.slug, nameEn: r.nameEn, nameAr: r.nameAr })),
      repeatedDomainGroups: report.repeatedDomainGroups,
      sectorInventory,
      aramco: rows.filter((r) => normalizeCatalogDomain(r.domain ?? '')?.includes('aramco')),
      sabic: rows.filter((r) => r.nameEn.toLowerCase().includes('sabic') || r.domain?.includes('sabic')),
    },
    null,
    2,
  ),
)
