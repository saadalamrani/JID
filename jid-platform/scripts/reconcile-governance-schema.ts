/**
 * Part A — governance schema reconciliation (migrations + types.ts).
 * Run: pnpm tsx scripts/reconcile-governance-schema.ts
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())

function migrationColumns(table: string): string[] {
  const dir = join(ROOT, 'supabase/migrations')
  const cols = new Set<string>()

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(dir, file), 'utf-8')
    const createMatch = new RegExp(
      `CREATE TABLE(?: IF NOT EXISTS)? public\\.${table}\\s*\\(([\\s\\S]*?)\\);`,
      'i',
    ).exec(sql)
    if (createMatch) {
      for (const line of createMatch[1].split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('--')) continue
        const m = /^([a-z_][a-z0-9_]*)\s+/i.exec(trimmed)
        if (
          m &&
          !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'CHECK', 'FOREIGN'].includes(m[1].toUpperCase())
        ) {
          cols.add(m[1])
        }
      }
    }

    const alterRegex = new RegExp(
      `ALTER TABLE public\\.${table}[\\s\\S]*?ADD COLUMN IF NOT EXISTS ([a-z_][a-z0-9_]*)`,
      'gi',
    )
    let alterMatch: RegExpExecArray | null
    while ((alterMatch = alterRegex.exec(sql))) {
      cols.add(alterMatch[1])
    }
  }

  return [...cols].sort()
}

function typesColumns(table: string): string[] {
  const typesPath = join(ROOT, 'src/lib/supabase/types.ts')
  if (!existsSync(typesPath)) return []
  const src = readFileSync(typesPath, 'utf-8')
  const block = new RegExp(`${table}:\\s*\\{\\s*Row:\\s*\\{([^}]+)\\}`, 's').exec(src)
  if (!block) return []
  return [...block[1].matchAll(/^\s+([a-z_][a-z0-9_]*):/gm)].map((m) => m[1]).sort()
}

function printSection(title: string) {
  console.log(`\n=== ${title} ===`)
}

async function main() {
  console.log('Source: migrations + types.ts (offline reconciliation)\n')

  const col = (table: string) => {
    const merged = new Set([...migrationColumns(table), ...typesColumns(table)])
    return [...merged].sort()
  }

  const hasTable = (table: string) => migrationColumns(table).length > 0 || typesColumns(table).length > 0

  printSection('(a) audit_logs — Auth/RBAC sprint migration 032_audit_logs.sql')
  if (hasTable('audit_logs')) {
    console.log('Columns:', col('audit_logs').join(', '))
    console.log('Note: timestamp column is created_at (NOT performed_at)')
  } else {
    console.log('NOT FOUND')
  }

  printSection('(b) feature_flags, platform_config, emergency_actions')
  for (const t of ['feature_flags', 'platform_config', 'emergency_actions'] as const) {
    console.log(`${t}: ${hasTable(t) ? 'EXISTS' : 'MISSING (pending migration 074)'}`)
    if (hasTable(t)) console.log('  Columns:', col(t).join(', '))
  }

  printSection('(c) claim_requests — Auth/RBAC + Catalog reconciliations')
  if (hasTable('claim_requests')) {
    const columns = col('claim_requests')
    console.log('Columns:', columns.join(', '))
    console.log('Reconciliation: user_id (not claimant_user_id); company_id (not target_entity_id)')
    console.log(`sla_due_at: ${columns.includes('sla_due_at') ? 'EXISTS' : 'MISSING — use created_at proxy for overdue SLA'}`)
  }

  printSection('(d) mentor_profiles — Profile stub 027, Mentorship sprint 055+')
  console.log(`mentor_profiles: ${hasTable('mentor_profiles') ? 'EXISTS' : 'MISSING'}`)
  if (hasTable('mentor_profiles')) console.log('Columns (sample):', col('mentor_profiles').slice(0, 12).join(', '), '...')

  printSection('(e) content_flags — Staff Portal')
  console.log(`content_flags: ${hasTable('content_flags') ? 'EXISTS' : 'NOT FOUND in repo migrations'}`)

  printSection('active_sessions — Auth/RBAC migration 034')
  console.log(`active_sessions: ${hasTable('active_sessions') ? 'EXISTS' : 'MISSING'}`)
  if (hasTable('active_sessions')) console.log('Columns:', col('active_sessions').join(', '))

  printSection('profiles.suspended_at')
  const profileCols = col('profiles')
  console.log(`suspended_at: ${profileCols.includes('suspended_at') ? 'EXISTS (024 / 041)' : 'MISSING'}`)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
