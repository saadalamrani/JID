/**
 * Generate all Directory Data Reality reports from the real founder manifest.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CANONICAL_REGIONS,
  computeAbsentCanonicalRegions,
  listSourceRegionMappings,
  listSourceSectorMappings,
  parseFounderSourceCsv,
  REFERENCE_EXISTING_DIRECTORY,
  runFounderSourceDryRun,
} from '../../src/lib/catalog/founder-source'
import { ORGANIZATION_STRUCTURE_SOURCE_SECTORS } from '../../src/lib/catalog/founder-source/founder-sector-map'

const REPORT_DIR = join(process.cwd(), 'docs/command-center/reports')
const SPEC_SRC =
  'C:\\Users\\saada\\.cursor\\projects\\c-Users-saada-Downloads-Desktop-JID-1\\attachments\\edf11430-3d36-4310-ade8-db97e579e61c\\JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3__1_.md'
const SPEC_DEST = join(process.cwd(), 'docs/command-center/specifications/JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3.md')
const MANIFEST = join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv')

function isValidHttpUrl(value: string | null): boolean {
  if (!value?.trim()) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function historicalDrift(summary: ReturnType<typeof runFounderSourceDryRun>['summary']): string {
  const historical = { reconcile: 2, repeated: 14, high: 106, low: 878 }
  const drift =
    summary.reconcileExisting !== historical.reconcile ||
    summary.repeatedDomainRows !== historical.repeated ||
    summary.highConfidenceReviewCandidates !== historical.high ||
    summary.lowConfidenceReviewCandidates !== historical.low

  if (!drift) {
    return 'No REALITY_DRIFT — action-class counts match historical 2026-08-05 reconciliation.'
  }

  const reasons: string[] = ['## REALITY_DRIFT', '']
  if (summary.reconcileExisting !== historical.reconcile) {
    reasons.push(
      `- Reconcile existing: historical ${historical.reconcile}, this run ${summary.reconcileExisting} — domain-derived matching against reference seed records.`,
    )
  }
  if (summary.repeatedDomainRows !== historical.repeated) {
    reasons.push(
      `- Repeated-domain rows: historical ${historical.repeated}, this run ${summary.repeatedDomainRows}.`,
    )
  }
  if (summary.highConfidenceReviewCandidates !== historical.high) {
    reasons.push(
      `- High-confidence candidates: historical ${historical.high}, this run ${summary.highConfidenceReviewCandidates} — uses source \`confidence\` field + ownership class.`,
    )
  }
  if (summary.lowConfidenceReviewCandidates !== historical.low) {
    reasons.push(
      `- Low-confidence candidates: historical ${historical.low}, this run ${summary.lowConfidenceReviewCandidates} — ${summary.sectorMappingReviewRequired} holding-company rows routed to sector review per FOUNDER_DECISION_TAX_003_RESOLVED (not counted as low-confidence).`,
    )
  }
  return reasons.join('\n')
}

function main() {
  if (!existsSync(MANIFEST)) {
    throw new Error(`Manifest missing: ${MANIFEST}`)
  }

  if (existsSync(SPEC_SRC) && !existsSync(SPEC_DEST)) {
    mkdirSync(join(process.cwd(), 'docs/command-center/specifications'), { recursive: true })
    copyFileSync(SPEC_SRC, SPEC_DEST)
  }

  const rows = parseFounderSourceCsv(readFileSync(MANIFEST, 'utf8'))
  const report = runFounderSourceDryRun({
    rows,
    existingDirectory: REFERENCE_EXISTING_DIRECTORY,
    sourcePath: MANIFEST,
  })

  const sourceRegions = [...new Set(rows.map((r) => r.sourceRegion.trim()).filter(Boolean))]
  const sourceSectors = [...new Set(rows.map((r) => r.sourceSector.trim()).filter(Boolean))]
  const absentRegions = computeAbsentCanonicalRegions(sourceRegions)
  const invalidUrls = rows.filter((r) => r.websiteUrl && !isValidHttpUrl(r.websiteUrl)).length
  const sectorMappings = listSourceSectorMappings()
  const s = report.summary

  writeFileSync(
    join(REPORT_DIR, 'JID_1000_ORG_DRY_RUN_REPORT.md'),
    `# JID 1,000-Organization Dry Run Report

**Generated:** ${report.generatedAt}  
**Source:** \`data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv\` (1000 rows)  
**Mode:** DRY RUN — zero database writes

## Zero-write confirmation

| Boundary | Writes |
| --- | --- |
| companies / catalog pipeline | ${s.databaseWrites} |
| business_profiles | ${s.profileWrites} |
| university_profiles | ${s.profileWrites} |
| verification_requests | ${s.verificationWrites} |
| Ownership / claimed_by | ${s.ownershipMutations} |

## Summary

| Metric | Count |
| --- | ---: |
| Total source rows | ${s.totalSourceRows} |
| Normalized | ${s.normalized} |
| Deterministic existing matches | ${s.reconcileExisting} |
| Repeated-domain groups | ${s.repeatedDomainGroups} |
| Repeated-domain rows | ${s.repeatedDomainRows} |
| High-confidence review candidates | ${s.highConfidenceReviewCandidates} |
| Low-confidence / private-unverified candidates | ${s.lowConfidenceReviewCandidates} |
| Quarantined | ${s.quarantined} |
| Region mapping review required | ${s.regionMappingReviewRequired} |
| Sector mapping review required | ${s.sectorMappingReviewRequired} |
| Duplicate risks (name+region) | ${s.duplicateRisks} |
| Invalid domains | ${s.invalidDomains} |
| Invalid URLs | ${invalidUrls} |

${historicalDrift(s)}

## Repeated-domain groups (${s.repeatedDomainGroups})

${report.repeatedDomainGroups.map((g) => `- \`${g.domain}\`: ${g.sourceRecordIds.join(', ')}`).join('\n')}

## Existing Directory reconciliations

${report.outcomes
  .filter((o) => o.actionClass === 'reconcile_existing')
  .map((o) => `- ${o.nameEn} (\`${o.domain}\`) → ${o.matchTargetName}`)
  .join('\n')}

## Unmapped source regions

${report.unmappedRegions.length ? report.unmappedRegions.map((r) => `- ${r}`).join('\n') : '_None._'}

## Unmapped source sectors

${report.unmappedSectors.length ? report.unmappedSectors.map((r) => `- ${r}`).join('\n') : '_None._'}

## Canonical regions absent from source (${absentRegions.length})

${absentRegions.map((r) => `- **${r.nameEn}** (\`${r.slug}\`) — ${r.nameAr}`).join('\n')}
`,
    'utf8',
  )

  writeFileSync(
    join(REPORT_DIR, 'JID_DIRECTORY_TAXONOMY_MAPPING.md'),
    `# JID Directory Taxonomy Mapping

**Generated:** ${report.generatedAt}  
**FOUNDER_DECISION_TAX_003_RESOLVED:** Holding/conglomerate labels are organization structure, not operating-sector taxonomy.

## Canonical regions (13)

${CANONICAL_REGIONS.map((r, i) => `${i + 1}. \`${r.slug}\` — ${r.nameEn} / ${r.nameAr}`).join('\n')}

## Source regions in manifest (${sourceRegions.length})

${sourceRegions.map((r) => `- ${r}`).join('\n')}

## Absent from source (13 canonical − ${sourceRegions.length} represented = ${absentRegions.length})

${absentRegions.map((r) => `- **${r.nameEn}** (\`${r.slug}\`)`).join('\n')}

## Source sector → canonical mapping (${sectorMappings.length} mapped labels)

| Source sector | Canonical slug | Reasoning |
| --- | --- | --- |
${sectorMappings.map((m) => `| ${m.sourceSector} | ${m.canonicalSlug} | ${m.reasoning} |`).join('\n')}

## Organization-structure sectors (TAX_003 → review, not mapped)

${[...ORGANIZATION_STRUCTURE_SOURCE_SECTORS].map((s) => `- ${s}`).join('\n')}

## Unmapped source sectors

${report.unmappedSectors.map((s) => `- ${s}`).join('\n') || '_None beyond TAX_003 holding labels._'}

Total distinct source main sectors: ${sourceSectors.length}
`,
    'utf8',
  )

  writeFileSync(
    join(REPORT_DIR, 'JID_DIRECTORY_DATA_REALITY_REPORT.md'),
    `# JID Directory Data Reality Report

**Generated:** ${report.generatedAt}  
**Branch:** cursor/jid-directory-data-reality-v2  
**Base:** cursor/jid-interview-final-integration-v1 @ 7d78fbb

## Source resolution

| File | Status |
| --- | --- |
| JID_Catalog_Import_Manifest_2026-08-05.csv | Present (1000 rows) |
| JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3.md | ${existsSync(SPEC_DEST) ? 'Copied to docs/command-center/specifications/' : 'Available in Cursor attachments'} |

## Manifest dry-run totals

- Total: ${s.totalSourceRows}
- Reconcile existing: ${s.reconcileExisting}
- Repeated-domain rows: ${s.repeatedDomainRows}
- High-confidence candidates: ${s.highConfidenceReviewCandidates}
- Low-confidence candidates: ${s.lowConfidenceReviewCandidates}
- Sector review (incl. TAX_003 holding): ${s.sectorMappingReviewRequired}

## Taxonomy

- Canonical regions in seed: 13
- Source regions represented: ${sourceRegions.length}
- Absent from source: ${absentRegions.map((r) => r.nameEn).join(', ')}
- Canonical sectors in seed: 45
- Source main sectors: ${sourceSectors.length}

## Safety

- Production: untouched
- Remote nonprod bulk import: not performed
- Profiles / Verification / ownership: zero side effects
`,
    'utf8',
  )

  writeFileSync(
    join(REPORT_DIR, 'JID_NONPROD_IMPORT_MANIFEST.md'),
    `# JID Nonprod Import Manifest (DRY — NOT EXECUTED)

**Generated:** ${report.generatedAt}  
**Rows:** ${report.outcomes.length}

| source_record_id | action_class | domain | match_target | name_en | confidence |
| --- | --- | --- | --- | --- | --- |
${report.outcomes
  .map(
    (o) =>
      `| ${o.sourceRecordId} | ${o.actionClass} | ${o.domain ?? ''} | ${o.matchTargetName ?? ''} | ${o.nameEn} | ${o.provenance.confidenceClass ?? ''} |`,
  )
  .join('\n')}
`,
    'utf8',
  )

  writeFileSync(
    join(REPORT_DIR, 'founder-source-dry-run-summary.json'),
    JSON.stringify(
      {
        summary: s,
        sourceRegionCount: sourceRegions.length,
        sourceSectorCount: sourceSectors.length,
        absentCanonicalRegions: absentRegions,
        invalidUrls,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(JSON.stringify({ summary: s, absentRegions: absentRegions.map((r) => r.slug) }, null, 2))
}

main()
