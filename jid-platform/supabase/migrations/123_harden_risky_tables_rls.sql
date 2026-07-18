-- Batch: Non-production RLS hardening for 11 previously RLS-disabled tables.
-- Environment: jid-nonprod (hmjuijmaefajdjrjdsxu) ONLY. Not applied to production.
-- Table-by-table tiered model; no single generic policy reused across tables.
-- NOTE: this migration reconciles the tracked history with a state that was
-- already applied directly to jid-nonprod. Do not re-apply via CI/CD in a way
-- that would run this twice against the same database — see verification notes.

-- =====================================================================
-- TIER 1: Public catalog reference tables (read-only for anon/authenticated)
-- universities_catalog, colleges_catalog, majors_catalog, universities, colleges, skills, badges_catalog
-- =====================================================================

ALTER TABLE public.universities_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.universities_catalog FROM anon, authenticated;
GRANT SELECT ON public.universities_catalog TO anon, authenticated;
DROP POLICY IF EXISTS universities_catalog_public_read ON public.universities_catalog;
CREATE POLICY universities_catalog_public_read ON public.universities_catalog
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.colleges_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.colleges_catalog FROM anon, authenticated;
GRANT SELECT ON public.colleges_catalog TO anon, authenticated;
DROP POLICY IF EXISTS colleges_catalog_public_read ON public.colleges_catalog;
CREATE POLICY colleges_catalog_public_read ON public.colleges_catalog
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.majors_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.majors_catalog FROM anon, authenticated;
GRANT SELECT ON public.majors_catalog TO anon, authenticated;
DROP POLICY IF EXISTS majors_catalog_public_read ON public.majors_catalog;
CREATE POLICY majors_catalog_public_read ON public.majors_catalog
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.universities FROM anon, authenticated;
GRANT SELECT ON public.universities TO anon, authenticated;
DROP POLICY IF EXISTS universities_public_read ON public.universities;
CREATE POLICY universities_public_read ON public.universities
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.colleges FROM anon, authenticated;
GRANT SELECT ON public.colleges TO anon, authenticated;
DROP POLICY IF EXISTS colleges_public_read ON public.colleges;
CREATE POLICY colleges_public_read ON public.colleges
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.skills FROM anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;
DROP POLICY IF EXISTS skills_public_read ON public.skills;
CREATE POLICY skills_public_read ON public.skills
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.badges_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.badges_catalog FROM anon, authenticated;
GRANT SELECT ON public.badges_catalog TO anon, authenticated;
DROP POLICY IF EXISTS badges_catalog_public_read ON public.badges_catalog;
CREATE POLICY badges_catalog_public_read ON public.badges_catalog
  FOR SELECT TO anon, authenticated USING (true);

-- =====================================================================
-- TIER 2: Badge assignment tables (public read only; writes are via
-- SECURITY DEFINER functions award_entity_badge/remove_entity_badge,
-- owned by postgres, which bypass RLS — no end-user write path needed)
-- =====================================================================

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_badges FROM anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
DROP POLICY IF EXISTS user_badges_public_read ON public.user_badges;
CREATE POLICY user_badges_public_read ON public.user_badges
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.entity_badges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.entity_badges FROM anon, authenticated;
GRANT SELECT ON public.entity_badges TO anon, authenticated;
DROP POLICY IF EXISTS entity_badges_public_read ON public.entity_badges;
CREATE POLICY entity_badges_public_read ON public.entity_badges
  FOR SELECT TO anon, authenticated USING (true);

-- =====================================================================
-- TIER 3: profile_skills — public/authenticated read, owner-scoped write
-- (profile_id references profiles.id, which equals auth.uid() for the owner)
-- =====================================================================

ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profile_skills FROM anon, authenticated;
GRANT SELECT ON public.profile_skills TO anon, authenticated;
GRANT INSERT, DELETE ON public.profile_skills TO authenticated;

DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills;
CREATE POLICY profile_skills_public_read ON public.profile_skills
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS profile_skills_owner_insert ON public.profile_skills;
CREATE POLICY profile_skills_owner_insert ON public.profile_skills
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS profile_skills_owner_delete ON public.profile_skills;
CREATE POLICY profile_skills_owner_delete ON public.profile_skills
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- =====================================================================
-- TIER 4: _deprecated_commitment_scores — strictest tier.
-- No application code references this table at all. Zero anon/authenticated
-- access of any kind. Staff-only SELECT via is_privileged_staff() as a
-- defense-in-depth policy (not required by any known caller today).
-- =====================================================================

ALTER TABLE public._deprecated_commitment_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._deprecated_commitment_scores FROM anon, authenticated;

DROP POLICY IF EXISTS deprecated_commitment_scores_staff_read ON public._deprecated_commitment_scores;
CREATE POLICY deprecated_commitment_scores_staff_read ON public._deprecated_commitment_scores
  FOR SELECT TO authenticated USING (public.is_privileged_staff());
-- Note: authenticated has no table-level GRANT SELECT here, so even this policy
-- is inert unless a future grant is added — this is intentional maximum strictness.
