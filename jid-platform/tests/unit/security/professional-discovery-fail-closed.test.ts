import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getShellAccountActions, getSmartHeaderNavItems } from '@/lib/navigation/actor-shell'

describe('Professional Discovery fail-closed migration contract', () => {
  it('ships forward-only after Gate A CONTRACT and removes consent-only Business discovery', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260822120000_professional_discovery_fail_closed.sql',
      ),
      'utf8',
    )

    expect(migration).toContain('CREATE OR REPLACE FUNCTION private.can_read_individual_profile')
    expect(migration).toContain('profiles_select_application_bound_business')
    expect(migration).toContain('false AS allow_contact')
    expect(migration).not.toMatch(
      /show_profile_to_companies\s*=\s*true[\s\S]*viewer_has_active_verified_business_profile/,
    )
  })

  it('ships recursion-safe application-bound profiles SELECT after fail-closed', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260822140000_fix_profiles_rls_recursion.sql',
      ),
      'utf8',
    )

    expect(migration).toContain('SET row_security = off')
    expect(migration).toContain('private.business_can_select_applicant_profile')
    expect(migration).toContain('profiles_select_application_bound_business')
  })
})

describe('Staff public chrome does not leak Individual discovery', () => {
  it('limits Staff header nav and account actions', () => {
    expect(getSmartHeaderNavItems('staff').map((i) => i.href)).toEqual(['/'])
    expect(
      getShellAccountActions({
        actor: 'staff',
        dashboardHref: '/staff',
        hasMentorRole: false,
      }).map((a) => a.href),
    ).toEqual(['/staff'])
  })
})
