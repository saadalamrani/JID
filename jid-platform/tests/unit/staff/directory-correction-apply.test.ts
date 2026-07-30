/**
 * Spec 06-B — Directory correction apply-path structural guards.
 * Source-tree assertions (no live Supabase). Proves we extend the existing
 * approve/reject RPCs rather than inventing apply_directory_correction, and
 * that claim.* / email edge contracts remain untouched.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(process.cwd())
const SRC = join(ROOT, 'src')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')

function readSrc(relativePath: string): string {
  return readFileSync(join(SRC, relativePath), 'utf-8')
}

function readMigration(name: string): string {
  return readFileSync(join(MIGRATIONS, name), 'utf-8')
}

describe('Spec 06-B — correction apply path extends existing RPCs', () => {
  const hardening = readMigration(
    '20260730190001_directory_correction_apply_hardening.sql',
  )
  const categories = readMigration(
    '20260730190000_directory_correction_notification_categories.sql',
  )
  const baseline = readMigration('112_directory_correction_suggestions.sql')

  it('does not introduce a duplicate apply_directory_correction RPC', () => {
    expect(hardening).not.toMatch(
      /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+public\.apply_directory_correction/i,
    )
    expect(categories).not.toMatch(
      /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+public\.apply_directory_correction/i,
    )
  })

  it('replaces approve_correction_suggestion and reject_correction_suggestion', () => {
    expect(hardening).toMatch(
      /CREATE OR REPLACE FUNCTION public\.approve_correction_suggestion/,
    )
    expect(hardening).toMatch(
      /CREATE OR REPLACE FUNCTION public\.reject_correction_suggestion/,
    )
    expect(baseline).toMatch(/CREATE OR REPLACE FUNCTION public\.approve_correction_suggestion/)
  })

  it('enforces staff|super_admin, pending gate, whitelist, audit, and directory_missing', () => {
    expect(hardening).toMatch(/v_caller_role NOT IN \('staff', 'super_admin'\)/)
    expect(hardening).toMatch(/v_sug\.status <> 'pending'/)
    expect(hardening).toMatch(/RAISE EXCEPTION 'invalid_or_reviewed'/)
    expect(hardening).toMatch(/RAISE EXCEPTION 'field_not_allowed'/)
    expect(hardening).toMatch(/RAISE EXCEPTION 'directory_missing'/)
    expect(hardening).toMatch(/PERFORM public\._write_audit_log/)
    expect(hardening).toMatch(/'city'/)
    expect(hardening).toMatch(/'sector_id'/)
    expect(hardening).not.toMatch(/'claimed_by'/)
    expect(hardening).not.toMatch(/\bv_allowed_fields text\[] := ARRAY\[[^\]]*'\s*status\s*'/)
    expect(hardening).not.toMatch(/owner_user_id/)
  })

  it('dispatches suggester notification via suggested_by when identity is supported', () => {
    expect(hardening).toMatch(/p_recipient_id := v_sug\.suggested_by/)
    expect(hardening).toMatch(/directory\.correction_approved/)
    expect(hardening).toMatch(/directory\.correction_rejected/)
    expect(hardening).toMatch(/directory\.correction:%s:approved/)
    expect(hardening).toMatch(/directory\.correction:%s:rejected/)
    expect(categories).toMatch(/directory\.correction_approved/)
    expect(categories).toMatch(/directory\.correction_rejected/)
  })

  it('reject path does not UPDATE companies', () => {
    const rejectFn = hardening.slice(
      hardening.indexOf('CREATE OR REPLACE FUNCTION public.reject_correction_suggestion'),
    )
    expect(rejectFn).not.toMatch(/UPDATE public\.companies/)
  })
})

describe('Spec 06-B — staff action and UI wiring', () => {
  it('reviewCorrectionSuggestion is staff-guarded and maps honest errors', () => {
    const actions = readSrc('app/[locale]/(staff)/staff/directory/actions.ts')
    expect(actions).toMatch(/await requireStaffShellAccess\(\)/)
    expect(actions).toMatch(/approveCorrectionSuggestion/)
    expect(actions).toMatch(/rejectCorrectionSuggestion/)
    expect(actions).toMatch(/already_decided/)
    expect(actions).toMatch(/directory_missing/)
    expect(actions).toMatch(/mapCorrectionReviewError/)
  })

  it('suggestions review list has empty, read-only, and stacked mobile controls', () => {
    const ui = readSrc(
      'app/[locale]/(staff)/staff/directory/suggestions/_components/suggestions-review-list.tsx',
    )
    expect(ui).toMatch(/t\('empty'\)/)
    expect(ui).toMatch(/alreadyDecided/)
    expect(ui).toMatch(/isReadOnly/)
    expect(ui).toMatch(/flex-col/)
    expect(ui).toMatch(/w-full sm:w-auto/)
    expect(ui).not.toMatch(/toast\.success[\s\S]*result\.ok === false/)
  })

  it('moderation helpers still call the existing RPCs only', () => {
    const moderation = readSrc('lib/staff/moderation.ts')
    expect(moderation).toMatch(/approve_correction_suggestion/)
    expect(moderation).toMatch(/reject_correction_suggestion/)
    expect(moderation).not.toMatch(/apply_directory_correction/)
  })
})

describe('Spec 06-B — preserved claim/email contracts untouched', () => {
  it('correction decision dispatch does not use claim.* categories or claim edge functions', () => {
    const hardening = readMigration(
      '20260730190001_directory_correction_apply_hardening.sql',
    )
    const approveFn = hardening.slice(
      hardening.indexOf('CREATE OR REPLACE FUNCTION public.approve_correction_suggestion'),
      hardening.indexOf('CREATE OR REPLACE FUNCTION public.reject_correction_suggestion'),
    )
    const rejectFn = hardening.slice(
      hardening.indexOf('CREATE OR REPLACE FUNCTION public.reject_correction_suggestion'),
    )
    expect(approveFn).not.toMatch(/p_category := 'claim\./)
    expect(rejectFn).not.toMatch(/p_category := 'claim\./)
    expect(hardening).not.toMatch(/send-claim-approval/)
    expect(hardening).not.toMatch(/send-claim-rejection/)
  })
})
