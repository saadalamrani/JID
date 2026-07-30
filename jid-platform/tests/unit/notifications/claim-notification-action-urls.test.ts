/**
 * Spec 06-D — decision action URLs + contract preservation for notify_claim_decision.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  orgOutcomeRoutes,
  verificationDecisionActionUrl,
} from '@/lib/entity/verification-outcome'

const ROOT = join(process.cwd())
const MIGRATIONS = join(ROOT, 'supabase/migrations')

function readMigration(name: string): string {
  return readFileSync(join(MIGRATIONS, name), 'utf8')
}

describe('verificationDecisionActionUrl (Spec 03 outcome surfaces)', () => {
  it('Business approval → create-profile', () => {
    expect(verificationDecisionActionUrl('business', 'approved')).toBe(
      '/company/create-profile',
    )
    expect(verificationDecisionActionUrl('business', 'approve')).toBe(
      orgOutcomeRoutes('business').createProfile,
    )
  })

  it('Business rejection → verification-rejected', () => {
    expect(verificationDecisionActionUrl('business', 'rejected')).toBe(
      '/company/verification-rejected',
    )
  })

  it('University approval → create-profile', () => {
    expect(verificationDecisionActionUrl('university', 'approved')).toBe(
      '/university/create-profile',
    )
  })

  it('University rejection → rejected', () => {
    expect(verificationDecisionActionUrl('university', 'rejected')).toBe(
      '/university/rejected',
    )
  })

  it('does not invent /sys/claims or /settings destinations', () => {
    const urls = [
      verificationDecisionActionUrl('business', 'approved'),
      verificationDecisionActionUrl('business', 'rejected'),
      verificationDecisionActionUrl('university', 'approved'),
      verificationDecisionActionUrl('university', 'rejected'),
    ]
    for (const url of urls) {
      expect(url).not.toMatch(/\/sys\/claims/)
      expect(url).not.toBe('/settings')
    }
  })
})

describe('notify_claim_decision outcome-url migration', () => {
  const migrationName = '20260730190002_notify_claim_decision_outcome_urls.sql'

  it('exists as the next chronological migration and REPLACE-only', () => {
    const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()
    expect(files).toContain(migrationName)
    const sql = readMigration(migrationName)
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.notify_claim_decision\(/)
    expect(sql).toMatch(/p_claim_id uuid/)
    expect(sql).toMatch(/p_decision text/)
    expect(sql).toMatch(/p_reason text DEFAULT NULL/)
    expect(sql).toMatch(
      /v_idempotency_key := format\('verification\.decision:%s:%s', p_claim_id, p_decision\)/,
    )
    expect(sql).toMatch(/p_action_url := v_action_url/)
    expect(sql).not.toMatch(/p_action_url := '\/settings'/)
  })

  it('maps Business and University approval/rejection to Spec 03 routes', () => {
    const sql = readMigration(migrationName)
    expect(sql).toMatch(/\/company\/create-profile/)
    expect(sql).toMatch(/\/company\/verification-rejected/)
    expect(sql).toMatch(/\/university\/create-profile/)
    expect(sql).toMatch(/\/university\/rejected/)
    expect(sql).not.toMatch(/\/sys\/claims/)
  })

  it('preserves contract category strings and create-Profile continuation copy', () => {
    const sql = readMigration(migrationName)
    expect(sql).toContain("'claim.approved'")
    expect(sql).toContain("'claim.rejected'")
    expect(sql).toContain("'claim.needs_more_info'")
    expect(sql).toMatch(/You can now create your owned profile/)
    expect(sql).toMatch(/يمكنك الآن إنشاء ملفك التعريفي/)
    expect(sql.toLowerCase()).not.toMatch(/automatically created/)
    expect(sql).toMatch(/السبب: %s/)
    expect(sql).toMatch(/Reason: %s/)
  })

  it('preserves app email/edge contracts byte-for-byte in notifier', () => {
    const notifier = readFileSync(
      join(ROOT, 'src/lib/staff/notify-verification-decision.ts'),
      'utf8',
    )
    expect(notifier).toContain("'claim.approved'")
    expect(notifier).toContain("'claim.rejected'")
    expect(notifier).toContain("'claim.needs_more_info'")
    expect(notifier).toContain('claim_id')
    expect(notifier).toContain('claimId')
    expect(notifier).toContain('send-claim-approval')
    expect(notifier).toContain('send-claim-rejection')
  })
})
