import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260831190000_wave14_commercial_packaging.sql'),
  'utf8',
)

describe('Wave 14 database contract', () => {
  it('records honest price-adoption state and forbids adopted public prices', () => {
    expect(sql).toContain('plans_price_adoption_not_public_chk')
    expect(sql).toContain('commercial_package_price_not_adopted_chk')
    expect(sql).toContain("CHECK (price_adoption_status = 'not_adopted')")
    expect(sql).toContain('plan_price_is_adopted')
  })

  it('anchors subscription reads on owned profiles instead of Directory claim ownership', () => {
    expect(sql).toContain('Owner sees own subscription')
    expect(sql).toContain('bp.owner_user_id = auth.uid()')
    expect(sql).toContain('up.owner_user_id = auth.uid()')
    expect(sql).not.toContain('claimed_by')
  })

  it('adds webhook and subscription idempotency indexes', () => {
    expect(sql).toContain('billing_events_provider_event_id_uidx')
    expect(sql).toContain('subscriptions_provider_ref_idx')
  })

  it('seeds the same public package keys as the code contract', () => {
    for (const key of [
      'individual_core',
      'jid_plus',
      'employer_starter',
      'employer_growth',
      'employer_enterprise',
      'university_core',
      'university_readiness',
      'university_outcomes',
      'university_implementation',
      'government_contract',
    ]) {
      expect(sql).toContain(`'${key}'`)
    }
  })
})
