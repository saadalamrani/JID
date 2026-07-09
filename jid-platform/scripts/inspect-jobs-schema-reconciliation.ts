/**
 * Step 1 — Jobs sprint schema reconciliation (offline inspection).
 * Run: pnpm tsx scripts/inspect-jobs-schema-reconciliation.ts
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const typesPath = join(root, 'src/lib/supabase/types.ts')
const migrationsDir = join(root, 'supabase/migrations')

const typesSource = readFileSync(typesPath, 'utf-8')
const migrationSql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(migrationsDir, f), 'utf-8'))
  .join('\n')

function tableExistsInTypes(name: string): boolean {
  return new RegExp(`\\s+${name}:\\s*\\{`).test(typesSource)
}

function extractCompaniesColumns(): string[] {
  const match = typesSource.match(/companies:\s*\{\s*Row:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s)
  if (!match) return []
  return [...match[1].matchAll(/^\s+(\w+):/gm)].map((m) => m[1]).sort()
}

console.log('=== Step 1 — Schema reconciliation inspection (offline) ===\n')

console.log('(a) Multi-email table (user_verified_emails or similar):')
const emailTables = [
  'user_verified_emails',
  'profile_emails',
  'verified_emails',
  'user_emails',
].filter((t) => tableExistsInTypes(t) || migrationSql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`))
if (emailTables.length === 0) {
  console.log('  NOT FOUND — profiles.email_verified_at only (single primary email, migration 029)')
} else {
  console.log('  FOUND:', emailTables.join(', '))
}

console.log('\n(b) Privacy settings (user_privacy_settings / profiles jsonb):')
if (tableExistsInTypes('user_privacy_settings')) {
  console.log('  FOUND: user_privacy_settings table in types.ts')
} else {
  console.log('  NOT FOUND: user_privacy_settings table')
}
const profilePrivacyCols = [
  'visibility',
  'show_profile_to_companies',
  'show_profile_in_university_stats',
].filter((c) => typesSource.includes(`${c}:`))
console.log('  profiles privacy columns:', profilePrivacyCols.join(', ') || 'none')
const hasPrivacyJsonb = /profiles[\s\S]*privacy/i.test(typesSource)
console.log('  profiles jsonb privacy fields:', hasPrivacyJsonb ? 'possible' : 'none detected')

console.log('\n(c) companies catalog columns:')
const companiesCols = extractCompaniesColumns()
console.log('  entity_state:', companiesCols.includes('entity_state') ? 'YES' : 'NO')
console.log('  commitment_score removed:', !companiesCols.includes('commitment_score') ? 'YES' : 'NO (unexpected)')
console.log('  claim_status on companies:', companiesCols.includes('claim_status') ? 'YES (unexpected)' : 'NO')

console.log('\n(d) Jobs module tables (should not exist yet):')
for (const t of ['jobs', 'applications', 'application_intents']) {
  console.log(`  ${t}:`, tableExistsInTypes(t) ? 'EXISTS' : 'absent')
}
