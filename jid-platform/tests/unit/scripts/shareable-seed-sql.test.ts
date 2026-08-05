import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SEED_PREMIUM_SQL_RELATIVE,
  SEED_SQL_RELATIVE,
  SHAREABLE_SEED_MARKER,
} from '../../../scripts/lib/seed-safety'

const root = process.cwd()

function readSql(relative: string): string {
  return readFileSync(join(root, relative), 'utf8')
}

describe('shareable seed SQL contracts', () => {
  const accountSql = readSql(SEED_SQL_RELATIVE)
  const premiumSql = readSql(SEED_PREMIUM_SQL_RELATIVE)

  it('keeps Directory/Profile separation and approved Verification + deliberate Profile', () => {
    expect(accountSql).toMatch(/INSERT INTO public\.companies/i)
    expect(accountSql).toMatch(/INSERT INTO public\.business_profiles/i)
    expect(accountSql).toMatch(/INSERT INTO public\.university_profiles/i)
    expect(accountSql).toMatch(/verification_requests/i)
    expect(accountSql).toMatch(/'approved'/)
    expect(accountSql).toMatch(/pending_review/)
    expect(accountSql.toLowerCase()).not.toContain('claim_existing')
    expect(accountSql).not.toMatch(/Claim Existing Profile/i)
    expect(accountSql).not.toMatch(/claim_requests/i)
  })

  it('pending Verification has no resulting owned profile assignment', () => {
    expect(accountSql).toMatch(
      /b3000004-0000-4000-8000-000000000004[\s\S]*?pending_review[\s\S]*?NULL,\s*NULL/i,
    )
  })

  it('resets password and confirms emails via auth helper', () => {
    expect(accountSql).toContain('_seed_local_auth_user')
    expect(accountSql).toContain('encrypted_password')
    expect(accountSql).toContain('email_confirmed_at')
    expect(accountSql).toContain('JidSeed123!')
  })

  it('assigns Plus and employer_premium with honest nonprod seed marker', () => {
    expect(premiumSql).toContain(SHAREABLE_SEED_MARKER)
    expect(premiumSql).toContain('payment_provider')
    expect(premiumSql).toContain('nonprod_seed')
    expect(premiumSql).toContain('jid_plus')
    expect(premiumSql).toContain('employer_premium')
    expect(premiumSql).toContain('b1000001-0000-4000-8000-000000000001')
    expect(premiumSql).toContain('b1000002-0000-4000-8000-000000000002')
    expect(premiumSql).toContain('b1000003-0000-4000-8000-000000000003')
    expect(premiumSql).toContain('b2000001-0000-4000-8000-000000000001')
    expect(premiumSql.toLowerCase()).not.toContain('stripe')
    expect(premiumSql).not.toMatch(/payment_succeeded/)
    expect(premiumSql).not.toContain('SUPABASE_SERVICE_ROLE')
  })

  it('does not invent a university paid plan', () => {
    expect(premiumSql).not.toMatch(/university_premium|university_plus/i)
  })

  it('repairs mentor capability readiness on upsert (phone + active profile_state)', () => {
    expect(accountSql).toMatch(/mentor-approved@jidseed\.test/)
    expect(accountSql).toMatch(/b1000003-0000-4000-8000-000000000003[\s\S]*?phone_verified_at/i)
    expect(accountSql).toMatch(
      /b1000003-0000-4000-8000-000000000003[\s\S]*?profile_state = EXCLUDED\.profile_state/i,
    )
    expect(accountSql).toMatch(/INSERT INTO public\.mentor_profiles/i)
    expect(accountSql).toMatch(/'approved'/)
  })

  it('does not assign consumer subscriptions to staff/super_admin', () => {
    expect(premiumSql).not.toContain('b1000009-0000-4000-8000-000000000009')
    // admin id may appear as activated_by only — never as a user_id subscriber value
    expect(premiumSql).not.toMatch(/'user',\s*'b100000a-0000-4000-8000-00000000000a'/i)
    expect(premiumSql).not.toMatch(/\('user',\s*'b100000a-0000-4000-8000-00000000000a'/i)
  })

  it('scopes cancel/update to seed test subjects only', () => {
    expect(premiumSql).toMatch(/b1000001-0000-4000-8000-000000000001/)
    expect(premiumSql).toMatch(/WHERE s\.status IN \('active', 'trialing', 'past_due'\)/)
  })
})
