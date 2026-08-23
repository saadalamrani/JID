import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CANONICAL_REGIONS,
  CANONICAL_SECTORS,
  findProbableNameGeographyDuplicates,
  findRepeatedDomainGroups,
  mapSourceRegion,
  mapSourceSector,
  matchExistingByDomain,
  normalizeCatalogDomain,
  normalizeMatchingName,
  parseFounderSourceCsv,
  REFERENCE_EXISTING_DIRECTORY,
  runFounderSourceDryRun,
} from '@/lib/catalog/founder-source'

const fixturePath = join(process.cwd(), 'tests/fixtures/catalog/founder-source-sample.csv')

describe('founder-source normalization', () => {
  it('normalizes domains deterministically', () => {
    expect(normalizeCatalogDomain('HTTPS://WWW.Aramco.COM/path')).toBe('aramco.com')
    expect(normalizeCatalogDomain('@sabic.com')).toBe('sabic.com')
    expect(normalizeCatalogDomain('not a domain')).toBeNull()
  })

  it('normalizes matching names without altering display forms', () => {
    expect(normalizeMatchingName('  Saudi   Aramco  ')).toBe('saudi aramco')
  })
})

describe('founder-source taxonomy', () => {
  it('contains all 13 canonical Saudi regions', () => {
    expect(CANONICAL_REGIONS).toHaveLength(13)
  })

  it('contains 45 canonical Vision 2030 sectors', () => {
    expect(CANONICAL_SECTORS).toHaveLength(45)
  })

  it('maps known source regions deterministically', () => {
    const result = mapSourceRegion('Eastern Province')
    expect(result.status).toBe('mapped')
    if (result.status === 'mapped') {
      expect(result.canonical.slug).toBe('eastern-province')
    }
  })

  it('flags unknown source regions for review', () => {
    const result = mapSourceRegion('Unknown Region X')
    expect(result.status).toBe('region_mapping_review_required')
  })

  it('maps source sectors without creating 36 verbatim sectors', () => {
    const result = mapSourceSector('النفط والغاز والبتروكيماويات', null)
    expect(result.status).toBe('mapped')
    if (result.status === 'mapped') {
      expect(result.canonical.slug).toBe('energy-oil')
    }
  })

  it('routes holding/conglomerate labels to sector review per TAX_003', () => {
    const result = mapSourceSector('Conglomerate', null)
    expect(result.status).toBe('sector_mapping_review_required')
    if (result.status === 'sector_mapping_review_required') {
      expect(result.reason).toContain('organization_structure')
    }
  })

  it('maps Arabic founder source sectors deterministically', () => {
    const result = mapSourceSector('الخدمات المالية', null)
    expect(result.status).toBe('mapped')
    if (result.status === 'mapped') {
      expect(result.canonical.slug).toBe('finance-banking')
    }
  })
})

describe('founder-source deduplication', () => {
  it('matches Saudi Aramco and SABIC by domain without creating duplicates', () => {
    const aramco = matchExistingByDomain('aramco.com', REFERENCE_EXISTING_DIRECTORY)
    expect(aramco.kind).toBe('deterministic_existing')
    if (aramco.kind === 'deterministic_existing') {
      expect(aramco.record.name).toBe('Saudi Aramco')
    }

    const sabic = matchExistingByDomain('sabic.com', REFERENCE_EXISTING_DIRECTORY)
    expect(sabic.kind).toBe('deterministic_existing')
  })

  it('preserves King Saud and KAU as existing records not in founder source', () => {
    const ksu = REFERENCE_EXISTING_DIRECTORY.find((r) => r.name === 'King Saud University')
    const kau = REFERENCE_EXISTING_DIRECTORY.find((r) => r.name === 'King Abdulaziz University')
    expect(ksu).toBeDefined()
    expect(kau).toBeDefined()
  })
})

describe('founder-source dry-run', () => {
  const rows = parseFounderSourceCsv(readFileSync(fixturePath, 'utf8'))

  it('parses fixture CSV rows', () => {
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.nameEn).toBe('Saudi Aramco')
  })

  it('runs zero-write dry-run with governed action classes', () => {
    const report = runFounderSourceDryRun({
      rows,
      existingDirectory: REFERENCE_EXISTING_DIRECTORY,
      sourcePath: fixturePath,
    })

    expect(report.summary.databaseWrites).toBe(0)
    expect(report.summary.profileWrites).toBe(0)
    expect(report.summary.verificationWrites).toBe(0)
    expect(report.summary.ownershipMutations).toBe(0)
    expect(report.summary.reconcileExisting).toBe(2)
    expect(report.summary.repeatedDomainGroups).toBeGreaterThanOrEqual(2)
    expect(report.summary.quarantined).toBeGreaterThanOrEqual(1)
    expect(report.summary.regionMappingReviewRequired).toBeGreaterThanOrEqual(1)
    expect(report.summary.sectorMappingReviewRequired).toBeGreaterThanOrEqual(1)
  })

  it('detects repeated-domain groups', () => {
    const groups = findRepeatedDomainGroups(rows)
    expect(groups.get('alfanar.com')?.length).toBe(2)
    expect(groups.get('neom.com')?.length).toBe(2)
  })

  it('does not auto-merge on name similarity alone', () => {
    const risks = findProbableNameGeographyDuplicates(rows)
    expect(risks.every((r) => r.reason.includes('normalized_name'))).toBe(true)
  })

  it('is idempotent for identical input', () => {
    const first = runFounderSourceDryRun({ rows, existingDirectory: REFERENCE_EXISTING_DIRECTORY })
    const second = runFounderSourceDryRun({ rows, existingDirectory: REFERENCE_EXISTING_DIRECTORY })
    expect(first.summary).toEqual(second.summary)
  })
})

describe('founder 1000-row manifest dry-run', () => {
  const manifestPath = join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv')

  it('processes the real founder manifest with governed counts', () => {
    const rows = parseFounderSourceCsv(readFileSync(manifestPath, 'utf8'))
    const report = runFounderSourceDryRun({
      rows,
      existingDirectory: REFERENCE_EXISTING_DIRECTORY,
      sourcePath: manifestPath,
    })

    expect(rows).toHaveLength(1000)
    expect(report.summary.totalSourceRows).toBe(1000)
    expect(report.summary.reconcileExisting).toBe(2)
    expect(report.summary.repeatedDomainRows).toBe(14)
    expect(report.summary.repeatedDomainGroups).toBe(7)
    expect(report.summary.highConfidenceReviewCandidates).toBe(106)
    expect(report.summary.databaseWrites).toBe(0)
    expect(report.summary.profileWrites).toBe(0)
    expect(report.summary.verificationWrites).toBe(0)
    expect(report.summary.ownershipMutations).toBe(0)
  })
})
