import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const expand = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260809065512_security_privacy_gate_a_expand.sql'),
  'utf8',
)
const contract = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260809065513_security_privacy_gate_a_contract.sql'),
  'utf8',
)
const universityDashboard = fs.readFileSync(
  path.join(root, 'src/app/[locale]/(company)/_components/university-dashboard.tsx'),
  'utf8',
)

describe('Gate A four rollout-state contracts', () => {
  it('STATE B: EXPAND keeps base-table public policies required by the canonical app', () => {
    expect(expand).not.toContain('DROP POLICY IF EXISTS profiles_select_public')
    expect(expand).not.toContain('DROP POLICY IF EXISTS mentor_profiles_select_public')
    expect(expand).not.toContain('DROP POLICY IF EXISTS profile_skills_public_read')
    expect(expand).toContain('mentor_public_projection')
    expect(expand).toContain('individual_profile_public_projection')
  })

  it('STATE C/D: new app depends on projections created in EXPAND', () => {
    const files = [
      'src/lib/queries/mentors.ts',
      'src/lib/mentorship/submit-mentorship-request.ts',
      'src/lib/queries/timeline.ts',
      'src/lib/timeline/client.ts',
      'src/lib/profile/individual-profile-projection.ts',
      'src/lib/seo/sitemap-data.ts',
    ]
    for (const rel of files) {
      const source = fs.readFileSync(path.join(root, rel), 'utf8')
      expect(source).toContain('mentor_public_projection')
    }
    const profileQueries = fs.readFileSync(path.join(root, 'src/lib/profile/queries.ts'), 'utf8')
    expect(profileQueries).toContain('individual_profile_public_projection')
    expect(profileQueries).toContain('mentor_review_public_projection')
  })

  it('STATE D: CONTRACT removes obsolete public base policies while university stays fail-closed', () => {
    expect(contract).toContain('DROP POLICY IF EXISTS profiles_select_public')
    expect(contract).toContain('DROP POLICY IF EXISTS mentor_profiles_select_public')
    expect(contract).toContain('DROP POLICY IF EXISTS mentor_reviews_select_public')
    expect(expand).toMatch(/CREATE VIEW public\.university_dashboard_view[\s\S]*?WHERE false;/)
    expect(universityDashboard).toContain('EmptyUniversityState')
    expect(universityDashboard).toContain('!snapshot')
  })
})
