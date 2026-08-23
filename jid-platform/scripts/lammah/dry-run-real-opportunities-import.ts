/**
 * Dry-run only. Writes local review artifacts. Never connects to Supabase.
 *
 * Usage from jid-platform/:
 *   pnpm exec tsx scripts/lammah/dry-run-real-opportunities-import.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  RESEARCH_INVENTORY,
  RESEARCH_NOW,
  assertZeroSideEffects,
  runRealOpportunityDryRun,
} from '../../src/lib/lammah/real-opportunities'

const generatedAt = '2026-08-23T03:45:00+03:00'
const report = runRealOpportunityDryRun({
  inputs: RESEARCH_INVENTORY,
  now: RESEARCH_NOW,
  generatedAt,
})
assertZeroSideEffects(report)

if (process.env.LAMMAH_EXECUTE_REMOTE_IMPORT === '1') {
  throw new Error('Remote import is not authorized by this script.')
}

const outDir = join(
  process.cwd(),
  'docs/command-center/reports/lammah-real-opportunities-2026-08-23',
)
mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'JID_REAL_OPPORTUNITIES_CURRENT_INVENTORY.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
)

process.stdout.write(
  JSON.stringify(
    {
      remote_write: report.remote_write,
      researched: report.counts.researched,
      publish_review_candidates: report.counts.publish_review_candidates,
      open: report.counts.open,
      closed: report.counts.closed,
      artifact: 'docs/command-center/reports/lammah-real-opportunities-2026-08-23/JID_REAL_OPPORTUNITIES_CURRENT_INVENTORY.json',
    },
    null,
    2,
  ) + '\n',
)
