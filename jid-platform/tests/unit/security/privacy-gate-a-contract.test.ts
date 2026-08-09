import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const expandMigration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260809065512_security_privacy_gate_a_expand.sql'),
  'utf8',
)
const contractMigration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260809065513_security_privacy_gate_a_contract.sql'),
  'utf8',
)
const migration = `${expandMigration}\n${contractMigration}`
const mentorQueries = fs.readFileSync(path.join(root, 'src/lib/queries/mentors.ts'), 'utf8')
const profileQueries = fs.readFileSync(path.join(root, 'src/lib/profile/queries.ts'), 'utf8')

describe('Security & Privacy Gate A contracts', () => {
  it('keeps EXPAND additive and leaves base-table public policy drops to CONTRACT', () => {
    expect(expandMigration).toContain('CREATE SCHEMA IF NOT EXISTS private')
    expect(expandMigration).toContain('individual_profile_public_projection')
    expect(expandMigration).toContain('individual_profile_public_skills')
    expect(expandMigration).toContain('mentor_public_projection')
    expect(expandMigration).toContain('mentor_review_public_projection')
    expect(expandMigration).toContain('CREATE POLICY profile_skills_audience_read')
    expect(expandMigration).not.toContain(
      'DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills',
    )
    expect(expandMigration).not.toContain(
      'DROP POLICY IF EXISTS profiles_select_public ON public.profiles',
    )
    expect(expandMigration).not.toContain(
      'REVOKE ALL ON TABLE public.profiles FROM anon, authenticated',
    )
    expect(expandMigration).not.toContain(
      'REVOKE ALL ON TABLE public.applications FROM anon, authenticated',
    )
  })

  it('removes unconditional skill and university individual-row policies in CONTRACT', () => {
    expect(contractMigration).toContain(
      'DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills',
    )
    expect(migration).toContain('private.can_read_individual_profile(profile_id)')
    expect(contractMigration).toContain(
      'DROP POLICY IF EXISTS profiles_select_university_stats ON public.profiles',
    )
    expect(migration).not.toMatch(
      /CREATE POLICY profile_skills_audience_read[\s\S]*?USING\s*\(true\)/,
    )
  })

  it('qualifies all mentor-review meeting relationships', () => {
    expect(expandMigration).toContain('mm.id = mentor_reviews.meeting_id')
    expect(expandMigration).toContain('mm.mentee_id = (SELECT auth.uid())')
    expect(expandMigration).toContain('mm.mentor_id = mentor_reviews.mentor_id')
    expect(expandMigration).toContain("mm.status = 'completed'")
    expect(expandMigration).not.toContain('mm.mentor_id = mm.mentor_id')
  })

  it('calculates dashboard domains in independent aggregate CTEs', () => {
    for (const cte of [
      'eligible_profiles AS',
      'profile_aggregates AS',
      'cv_aggregates AS',
      'application_aggregates AS',
      'meeting_aggregates AS',
    ]) {
      expect(expandMigration).toContain(cte)
    }
    expect(expandMigration).toContain('count(DISTINCT ep.id)')
    expect(expandMigration).toContain('p.show_profile_in_university_stats = true')
    expect(expandMigration).toContain("p.profile_state = 'active'")
    expect(expandMigration).toContain('p.deleted_at IS NULL')
  })

  it('routes public mentor and Individual reads through safe projections', () => {
    expect(mentorQueries).toContain(".from('mentor_public_projection')")
    expect(mentorQueries).not.toContain(".from('mentor_profiles')")
    expect(profileQueries).toContain(".from('individual_profile_public_projection')")
    expect(profileQueries).toContain(".from('mentor_review_public_projection')")
  })

  it('requires an active verified owned Profile for Business audience access', () => {
    expect(expandMigration).toContain('private.viewer_has_active_verified_business_profile')
    expect(expandMigration).toContain('REVOKE ALL ON SCHEMA private FROM PUBLIC')
    expect(expandMigration).toContain("vr.verification_type = 'business'")
    expect(expandMigration).toContain("vr.status = 'approved'")
    expect(expandMigration).toContain("bp.status IN ('draft', 'published')")
  })

  it('fails University owner aggregates closed without a Directory-to-catalog identity FK', () => {
    expect(expandMigration).toMatch(
      /CREATE VIEW public\.university_dashboard_view[\s\S]*?FROM public\.university_dashboard_snapshot uds\s+WHERE false;/,
    )
    expect(expandMigration).not.toContain('upper(c.university_short_code)')
    expect(expandMigration).toContain('legacy universities_catalog id')
  })

  it('revokes base-table access in CONTRACT before granting the required operations', () => {
    expect(contractMigration).toContain(
      'REVOKE ALL ON TABLE public.profiles FROM anon, authenticated',
    )
    expect(contractMigration).toContain(
      'GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated',
    )
    expect(contractMigration).toContain(
      'REVOKE ALL ON TABLE public.mentor_profiles FROM anon, authenticated',
    )
    expect(contractMigration).toContain(
      'REVOKE ALL ON TABLE public.mentor_reviews FROM anon, authenticated',
    )
    expect(contractMigration).toContain(
      'REVOKE ALL ON TABLE public.applications FROM anon, authenticated',
    )
    expect(contractMigration).toContain(
      'GRANT SELECT, INSERT, UPDATE ON TABLE public.applications TO authenticated',
    )
  })
})
