import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260809065512_security_privacy_gate_a.sql'),
  'utf8',
)
const mentorQueries = fs.readFileSync(path.join(root, 'src/lib/queries/mentors.ts'), 'utf8')
const profileQueries = fs.readFileSync(path.join(root, 'src/lib/profile/queries.ts'), 'utf8')

describe('Security & Privacy Gate A contracts', () => {
  it('removes unconditional skill and university individual-row policies', () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills',
    )
    expect(migration).toContain('public.can_read_individual_profile(profile_id)')
    expect(migration).toContain(
      'DROP POLICY IF EXISTS profiles_select_university_stats ON public.profiles',
    )
    expect(migration).not.toMatch(
      /CREATE POLICY profile_skills_audience_read[\s\S]*?USING\s*\(true\)/,
    )
  })

  it('qualifies all mentor-review meeting relationships', () => {
    expect(migration).toContain('mm.id = mentor_reviews.meeting_id')
    expect(migration).toContain('mm.mentee_id = (SELECT auth.uid())')
    expect(migration).toContain('mm.mentor_id = mentor_reviews.mentor_id')
    expect(migration).toContain("mm.status = 'completed'")
    expect(migration).not.toContain('mm.mentor_id = mm.mentor_id')
  })

  it('calculates dashboard domains in independent aggregate CTEs', () => {
    for (const cte of [
      'eligible_profiles AS',
      'profile_aggregates AS',
      'cv_aggregates AS',
      'application_aggregates AS',
      'meeting_aggregates AS',
    ]) {
      expect(migration).toContain(cte)
    }
    expect(migration).toContain('count(DISTINCT ep.id)')
    expect(migration).toContain('p.show_profile_in_university_stats = true')
    expect(migration).toContain("p.profile_state = 'active'")
    expect(migration).toContain('p.deleted_at IS NULL')
  })

  it('routes public mentor and Individual reads through safe projections', () => {
    expect(mentorQueries).toContain(".from('mentor_public_projection')")
    expect(mentorQueries).not.toContain(".from('mentor_profiles')")
    expect(profileQueries).toContain(".from('individual_profile_public_projection')")
    expect(profileQueries).toContain(".from('mentor_review_public_projection')")
  })

  it('revokes base-table access before granting the required operations', () => {
    expect(migration).toContain('REVOKE ALL ON TABLE public.profiles FROM anon, authenticated')
    expect(migration).toContain(
      'GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated',
    )
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.mentor_profiles FROM anon, authenticated',
    )
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.mentor_reviews FROM anon, authenticated',
    )
  })
})
