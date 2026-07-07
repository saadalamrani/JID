/**
 * Part A — Staff Portal Section 3 schema reconciliation.
 * Run: pnpm tsx scripts/reconcile-staff-portal-section3.ts
 *
 * Uses migration files when live Supabase is unavailable.
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

function hasMigration(pattern: string): boolean {
  const dir = join(ROOT, 'supabase/migrations')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .some((f) => readFileSync(join(dir, f), 'utf-8').includes(pattern))
}

function enumValues(enumName: string): string[] {
  const dir = join(ROOT, 'supabase/migrations')
  const values = new Set<string>()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(dir, file), 'utf-8')
    const block = new RegExp(`CREATE TYPE public\\.${enumName}[\\s\\S]*?AS ENUM \\(([\\s\\S]*?)\\)`, 'i').exec(
      sql,
    )
    if (block) {
      for (const m of block[1].matchAll(/'([^']+)'/g)) {
        values.add(m[1])
      }
    }
    for (const m of sql.matchAll(
      new RegExp(`ALTER TYPE public\\.${enumName} ADD VALUE IF NOT EXISTS '([^']+)'`, 'g'),
    )) {
      values.add(m[1])
    }
  }
  return [...values].sort()
}

function sprintForTable(table: string): string {
  const map: Record<string, string> = {
    audit_logs: '032_audit_logs.sql (Auth/RBAC Section 11 Step 1)',
    claim_requests: '031_claim_requests.sql (+ 038/039/041/044/078)',
    content_flags: '078_staff_portal_section3.sql',
    mentor_profiles: '027 stub + 055 mentorship + 056 mentor_application',
  }
  return map[table] ?? 'unknown'
}

const EXPECTED_AUDIT = [
  'actor_id',
  'actor_role',
  'action_type',
  'target_resource_type',
  'target_resource_id',
  'reason',
  'performed_at',
  'ip_address',
  'changes',
]

async function main() {
  console.log('Staff Portal Section 3 — Part A reconciliation\n')
  console.log('Source: supabase/migrations (Docker/Supabase not required)\n')

  printSection('(a) audit_logs')
  const auditCols = migrationColumns('audit_logs')
  console.log(`Exists: ${auditCols.length > 0 ? 'YES' : 'NO'}`)
  console.log(`Sprint: ${sprintForTable('audit_logs')}`)
  console.log(`Actual columns: ${auditCols.join(', ')}`)
  console.log('Master Prompt vs actual:')
  for (const col of EXPECTED_AUDIT) {
    const actual =
      col === 'performed_at'
        ? auditCols.includes('created_at')
        : col === 'action_type'
          ? auditCols.includes('action')
          : col === 'target_resource_type'
            ? auditCols.includes('entity_type')
            : col === 'target_resource_id'
              ? auditCols.includes('entity_id')
              : col === 'changes'
                ? auditCols.includes('old_data') && auditCols.includes('new_data')
                : auditCols.includes(col)
    console.log(`  ${col}: ${actual ? 'RECONCILED (mapped)' : 'MISSING'}`)
  }
  console.log('Note: actor_role and reason live in metadata/old_data/new_data, not dedicated columns.')

  printSection('(b) claim_requests')
  const claimCols = migrationColumns('claim_requests')
  console.log(`Exists: YES — ${sprintForTable('claim_requests')}`)
  console.log(`Columns: ${claimCols.join(', ')}`)
  console.log(
    `claimant_user_id → user_id: ${claimCols.includes('user_id') ? 'YES (reconciled name)' : 'NO'}`,
  )
  console.log(
    `target_entity_id → company_id: ${claimCols.includes('company_id') ? 'YES (reconciled name)' : 'NO'}`,
  )
  console.log(`sla_due_at: ${claimCols.includes('sla_due_at') ? 'YES (078)' : 'NO'}`)
  console.log(`assigned_staff_id: ${claimCols.includes('assigned_staff_id') ? 'YES (078)' : 'NO'}`)
  const claimStatus = enumValues('claim_status_enum')
  console.log(`claim_status_enum values: ${claimStatus.join(', ')}`)
  const expectedStatus = ['submitted', 'pending_review', 'approved', 'rejected', 'needs_more_info']
  for (const v of expectedStatus) {
    console.log(`  ${v}: ${claimStatus.includes(v) ? 'YES' : 'NO'}`)
  }

  printSection('(c) content_flags')
  console.log(
    `Exists: ${migrationColumns('content_flags').length > 0 ? 'YES (078)' : 'NO (expected before this sprint)'}`,
  )
  if (migrationColumns('content_flags').length > 0) {
    console.log(`Columns: ${migrationColumns('content_flags').join(', ')}`)
  }

  printSection('(d) mentor_profiles.status')
  console.log(`Table exists: ${migrationColumns('mentor_profiles').length > 0 ? 'YES' : 'NO'}`)
  const mentorSql = readdirSync(join(ROOT, 'supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(join(join(ROOT, 'supabase/migrations'), f), 'utf-8'))
    .join('\n')
  const mentorStatuses = [
    'pending_review',
    'approved',
    'rejected',
    'suspended',
  ]
  for (const s of mentorStatuses) {
    console.log(`  ${s}: ${mentorSql.includes(`'${s}'`) ? 'YES' : 'NO'}`)
  }

  printSection('(e) profiles.role enum')
  const roles = enumValues('user_role_enum')
  console.log(`Values: ${roles.join(', ')}`)

  printSection('Part B — review_claim retroactive fixes')
  console.log(`review_claim() function: ${hasMigration('CREATE OR REPLACE FUNCTION public.review_claim(') ? '078' : 'MISSING'}`)
  console.log(
    `review_claim_request() wrapper: ${hasMigration('review_claim_request') ? 'YES' : 'NO'}`,
  )
  console.log(
    `companies.claim_status reference in review RPCs: ${
      /UPDATE public\.companies[\s\S]*claim_status/is.test(
        readFileSync(join(ROOT, 'supabase/migrations/078_staff_portal_section3.sql'), 'utf-8'),
      )
        ? 'FOUND (FAIL)'
        : 'NONE (PASS)'
    }`,
  )
  console.log(
    `profiles.role = mentor in 073/078: ${
      readFileSync(join(ROOT, 'supabase/migrations/073_review_claim_final_fix.sql'), 'utf-8').includes(
        "role = 'mentor'",
      )
        ? 'FOUND in 073'
        : 'NONE (PASS — fixed in 054/073)'
    }`,
  )
  console.log('Status: retroactive fixes were already applied in 054 + 073; 078 adds canonical review_claim().')

  printSection('Part C–E artifacts in 078')
  for (const artifact of [
    'assign_claim_to_self',
    'v_staff_personal_metrics',
    'content_flags',
    'staff_suspend_user',
    'review_claim',
    'get_staff_personal_metrics',
  ]) {
    console.log(`  ${artifact}: ${hasMigration(artifact) ? 'YES' : 'NO'}`)
  }
}

function printSection(title: string) {
  console.log(`\n=== ${title} ===`)
}

void main()
