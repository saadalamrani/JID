/**
 * Founder 1,000-organization governed dry-run (zero database writes).
 *
 * Usage:
 *   pnpm exec tsx scripts/catalog/founder-source-dry-run.ts --source=path/to/manifest.csv
 *   pnpm exec tsx scripts/catalog/founder-source-dry-run.ts --report-only
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  REFERENCE_EXISTING_DIRECTORY,
  parseFounderSourceCsv,
  runFounderSourceDryRun,
} from '../../src/lib/catalog/founder-source'

const REPORT_DIR = join(process.cwd(), 'docs/command-center/reports')

function parseArgs(argv: string[]) {
  const source = argv.find((a) => a.startsWith('--source='))?.slice('--source='.length) ?? null
  const reportOnly = argv.includes('--report-only')
  return { source, reportOnly }
}

function defaultManifestPaths(): string[] {
  return [
    join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv'),
    join(process.cwd(), 'docs/command-center/data/JID_Catalog_Import_Manifest_2026-08-05.csv'),
  ]
}

function resolveSourcePath(explicit: string | null): string | null {
  if (explicit) return explicit
  for (const candidate of defaultManifestPaths()) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

function formatDryRunMarkdown(report: ReturnType<typeof runFounderSourceDryRun>, sourceStatus: string): string {
  const s = report.summary
  return `# JID 1,000-Organization Dry Run Report

**Generated:** ${report.generatedAt}  
**Source path:** ${report.sourcePath ?? 'N/A'}  
**Source status:** ${sourceStatus}

## Zero-write confirmation

| Boundary | Writes |
| --- | --- |
| \`companies\` / catalog pipeline | ${s.databaseWrites} |
| \`business_profiles\` | ${s.profileWrites} |
| \`university_profiles\` | ${s.profileWrites} |
| \`verification_requests\` | ${s.verificationWrites} |
| Ownership / \`claimed_by\` | ${s.ownershipMutations} |

## Summary counts

| Metric | Count |
| --- | --- |
| Total source rows | ${s.totalSourceRows} |
| Normalized | ${s.normalized} |
| Reconcile existing | ${s.reconcileExisting} |
| Repeated-domain groups | ${s.repeatedDomainGroups} |
| Repeated-domain rows | ${s.repeatedDomainRows} |
| High-confidence review candidates | ${s.highConfidenceReviewCandidates} |
| Low-confidence review candidates | ${s.lowConfidenceReviewCandidates} |
| Quarantined | ${s.quarantined} |
| Region mapping review required | ${s.regionMappingReviewRequired} |
| Sector mapping review required | ${s.sectorMappingReviewRequired} |
| Duplicate risks (name+region) | ${s.duplicateRisks} |
| Invalid domains | ${s.invalidDomains} |

## Historical reconciliation reference (2026-08-05)

| Class | Historical | This run |
| --- | ---: | ---: |
| Reconcile/update existing | 2 | ${s.reconcileExisting} |
| Repeated-domain manual review rows | 14 | ${s.repeatedDomainRows} |
| High-confidence review candidates | 106 | ${s.highConfidenceReviewCandidates} |
| Low-confidence review candidates | 878 | ${s.lowConfidenceReviewCandidates} |

${s.totalSourceRows === 0 ? '## BLOCKER\n\n`REQUIRED_CATALOG_SOURCE_MISSING JID_Catalog_Import_Manifest_2026-08-05.csv` — attach the founder manifest to run row-level dry-run validation.\n' : ''}

## Repeated-domain groups

${report.repeatedDomainGroups.length === 0 ? '_None in this run._' : report.repeatedDomainGroups.map((g) => `- \`${g.domain}\`: ${g.sourceRecordIds.join(', ')}`).join('\n')}

## Unmapped regions

${report.unmappedRegions.length === 0 ? '_None._' : report.unmappedRegions.map((r) => `- ${r}`).join('\n')}

## Unmapped sectors

${report.unmappedSectors.length === 0 ? '_None._' : report.unmappedSectors.map((r) => `- ${r}`).join('\n')}
`
}

function formatManifestMarkdown(report: ReturnType<typeof runFounderSourceDryRun>): string {
  const lines = [
    '# JID Nonprod Import Manifest (DRY — NOT EXECUTED)',
    '',
    `**Generated:** ${report.generatedAt}`,
    '',
    'This manifest records actions that **would** occur after Founder approval. No remote database mutation was performed.',
    '',
    '| source_record_id | action_class | domain | match_target | name_en |',
    '| --- | --- | --- | --- | --- |',
  ]

  for (const outcome of report.outcomes) {
    lines.push(
      `| ${outcome.sourceRecordId} | ${outcome.actionClass} | ${outcome.domain ?? ''} | ${outcome.matchTargetName ?? ''} | ${outcome.nameEn} |`,
    )
  }

  return lines.join('\n')
}

function main() {
  const { source, reportOnly } = parseArgs(process.argv.slice(2))
  const sourcePath = resolveSourcePath(source)

  let rows = [] as ReturnType<typeof parseFounderSourceCsv>
  let sourceStatus = 'missing'

  if (sourcePath && existsSync(sourcePath)) {
    const content = readFileSync(sourcePath, 'utf8')
    rows = parseFounderSourceCsv(content)
    sourceStatus = `loaded (${rows.length} rows)`
  } else if (reportOnly) {
    sourceStatus = 'report-only mode — manifest not loaded'
  } else {
    sourceStatus = 'BLOCKED: REQUIRED_CATALOG_SOURCE_MISSING JID_Catalog_Import_Manifest_2026-08-05.csv'
  }

  const report = runFounderSourceDryRun({
    rows,
    existingDirectory: REFERENCE_EXISTING_DIRECTORY,
    sourcePath,
  })

  writeFileSync(join(REPORT_DIR, 'JID_1000_ORG_DRY_RUN_REPORT.md'), formatDryRunMarkdown(report, sourceStatus), 'utf8')
  writeFileSync(join(REPORT_DIR, 'JID_NONPROD_IMPORT_MANIFEST.md'), formatManifestMarkdown(report), 'utf8')
  writeFileSync(
    join(REPORT_DIR, 'founder-source-dry-run-summary.json'),
    JSON.stringify({ sourceStatus, summary: report.summary }, null, 2),
    'utf8',
  )

  console.log(JSON.stringify({ sourceStatus, summary: report.summary }, null, 2))
}

main()
