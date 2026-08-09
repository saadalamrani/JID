-- JID Security & Privacy Contract Remediation — Gate A
-- Nonproduction forward-only closure for audience projections, university
-- aggregates, mentor-review integrity, and least-privilege grants.

-- ---------------------------------------------------------------------------
-- Audience decision shared by the safe individual projection and skills RLS.
-- Universities are intentionally absent: their supported contract is aggregate.
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.viewer_has_active_verified_business_profile()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_profiles bp
    JOIN public.verification_requests vr
      ON vr.resulting_profile_id = bp.id
     AND vr.resulting_profile_type = 'business'
     AND vr.verification_type = 'business'
     AND vr.status = 'approved'
     AND vr.applicant_user_id = bp.owner_user_id
     AND vr.directory_id = bp.directory_id
    JOIN public.profiles actor ON actor.id = bp.owner_user_id
    WHERE bp.owner_user_id = (SELECT auth.uid())
      AND bp.status IN ('draft', 'published')
      AND actor.role = 'company_admin'
      AND actor.profile_state = 'active'
      AND actor.deleted_at IS NULL
      AND actor.suspended_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION private.viewer_has_active_verified_business_profile()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.viewer_has_active_verified_business_profile()
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION private.viewer_has_active_verified_business_profile() IS
  'True only for an active company_admin whose approved Business verification resolves to the same non-suspended owned Profile and Directory anchor.';

CREATE OR REPLACE FUNCTION private.can_read_individual_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.role = 'individual'
      AND p.deleted_at IS NULL
      AND p.suspended_at IS NULL
      AND p.profile_state = 'active'
      AND (
        p.id = (SELECT auth.uid())
        OR public.is_privileged_staff()
        OR p.visibility = 'public'
        OR (
          p.visibility = 'discoverable'
          AND (SELECT auth.uid()) IS NOT NULL
          AND (
            (
              p.show_profile_to_companies = true
              AND private.viewer_has_active_verified_business_profile()
            )
            OR EXISTS (
              SELECT 1
              FROM public.mentor_profiles mp
              WHERE mp.user_id = (SELECT auth.uid())
                AND mp.status = 'approved'
            )
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.can_read_individual_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_individual_profile(uuid)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION private.can_read_individual_profile(uuid) IS
  'Audience gate for public/discoverable Individual projections. Universities use aggregate contracts only.';

-- Base profiles remain available to the owner and privileged staff policies.
-- Public, business-discovery, and university row reads move to safe projections.
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_select_verified_hr_discoverable ON public.profiles;
DROP POLICY IF EXISTS profiles_select_university_stats ON public.profiles;

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- profile_skills follows the same audience gate as its parent profile.
DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills;
DROP POLICY IF EXISTS profile_skills_audience_read ON public.profile_skills;
CREATE POLICY profile_skills_audience_read
  ON public.profile_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    private.can_read_individual_profile(profile_id)
  );

REVOKE ALL ON TABLE public.profile_skills FROM anon, authenticated;
GRANT SELECT ON TABLE public.profile_skills TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.profile_skills TO authenticated;

DROP VIEW IF EXISTS public.individual_profile_public_skills;
DROP VIEW IF EXISTS public.individual_profile_public_projection;

CREATE VIEW public.individual_profile_public_projection
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.full_name,
  p.headline,
  p.about_me,
  p.avatar_url,
  p.target_sectors,
  p.target_program_types,
  p.target_regions,
  NULLIF(p.smart_links ->> 'portfolio', '') AS portfolio_url,
  p.university_id,
  p.college_id,
  p.major_id,
  p.graduation_year,
  p.student_status,
  p.show_profile_in_university_stats AS show_graduate_badge,
  (
    p.allow_company_direct_contact
    AND p.visibility = 'discoverable'
    AND p.show_profile_to_companies
    AND private.viewer_has_active_verified_business_profile()
  ) AS allow_contact
FROM public.profiles p
WHERE private.can_read_individual_profile(p.id);

CREATE VIEW public.individual_profile_public_skills
WITH (security_barrier = true)
AS
SELECT
  ps.profile_id,
  s.id AS skill_id,
  s.name,
  s.name_ar
FROM public.profile_skills ps
JOIN public.skills s ON s.id = ps.skill_id
WHERE private.can_read_individual_profile(ps.profile_id);

REVOKE ALL ON TABLE public.individual_profile_public_projection
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.individual_profile_public_skills
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.individual_profile_public_projection
  TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.individual_profile_public_skills
  TO anon, authenticated, service_role;

COMMENT ON VIEW public.individual_profile_public_projection IS
  'Audience-safe Individual L6 core projection. Internal profiles columns are excluded.';
COMMENT ON VIEW public.individual_profile_public_skills IS
  'Audience-safe skill projection aligned with Individual profile visibility.';

-- ---------------------------------------------------------------------------
-- Mentor public projections and review integrity.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS mentor_profiles_select_public ON public.mentor_profiles;
DROP POLICY IF EXISTS mentor_profiles_select_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_own
  ON public.mentor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.mentor_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentor_profiles TO authenticated;

DROP POLICY IF EXISTS mentor_reviews_insert_mentee ON public.mentor_reviews;
CREATE POLICY mentor_reviews_insert_mentee
  ON public.mentor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    mentor_reviews.reviewer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.mentorship_meetings mm
      WHERE mm.id = mentor_reviews.meeting_id
        AND mm.mentee_id = (SELECT auth.uid())
        AND mm.mentor_id = mentor_reviews.mentor_id
        AND mm.status = 'completed'
    )
  );

DROP POLICY IF EXISTS mentor_reviews_select_public ON public.mentor_reviews;

REVOKE ALL ON TABLE public.mentor_reviews FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentor_reviews TO authenticated;

DROP VIEW IF EXISTS public.mentor_review_public_projection;
DROP VIEW IF EXISTS public.mentor_public_projection;

CREATE VIEW public.mentor_public_projection
WITH (security_barrier = true)
AS
SELECT
  mp.user_id,
  mp.slug,
  p.full_name,
  p.avatar_url,
  mp.headline,
  mp.bio_short,
  mp.bio_long,
  mp.expertise_areas,
  mp.expertise_sectors,
  mp.specializations,
  mp.languages,
  mp.preferred_mediums,
  mp.nationality,
  mp.years_experience,
  mp.rating_avg,
  mp.sessions_count,
  mp.is_accepting_requests,
  mp.is_mentor_of_month,
  mp.active_workshop,
  mp.career_history
FROM public.mentor_profiles mp
JOIN public.profiles p ON p.id = mp.user_id
WHERE mp.status = 'approved'
  AND p.deleted_at IS NULL
  AND p.suspended_at IS NULL
  AND p.profile_state = 'active';

CREATE VIEW public.mentor_review_public_projection
WITH (security_barrier = true)
AS
SELECT
  mr.id,
  mr.mentor_id,
  mr.rating,
  mr.review_text,
  mr.visibility,
  mr.created_at,
  CASE
    WHEN mr.visibility = 'public_named'
      AND reviewer.deleted_at IS NULL
      AND reviewer.profile_state = 'active'
    THEN reviewer.full_name
    ELSE NULL
  END AS reviewer_name
FROM public.mentor_reviews mr
JOIN public.mentor_profiles mp
  ON mp.user_id = mr.mentor_id
 AND mp.status = 'approved'
JOIN public.profiles mentor
  ON mentor.id = mr.mentor_id
 AND mentor.deleted_at IS NULL
 AND mentor.suspended_at IS NULL
 AND mentor.profile_state = 'active'
LEFT JOIN public.profiles reviewer ON reviewer.id = mr.reviewer_id
WHERE mr.visibility IN ('public_named', 'public_anonymous');

-- Applications retain their current applicant, owned-Business, and Staff RLS
-- contracts. Gate A contains the legacy document/contact columns by removing
-- every anonymous privilege and granting authenticated users only the
-- operations those existing policies require. No projection grants access to
-- application rows.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.applications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.applications TO authenticated;

REVOKE ALL ON TABLE public.mentor_public_projection
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.mentor_review_public_projection
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.mentor_public_projection
  TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.mentor_review_public_projection
  TO anon, authenticated, service_role;

COMMENT ON VIEW public.mentor_public_projection IS
  'Approved, active Mentor public fields only; application and moderation columns are excluded.';
COMMENT ON VIEW public.mentor_review_public_projection IS
  'Public review fields only; meeting and reviewer identifiers are excluded.';

-- ---------------------------------------------------------------------------
-- University dashboard: consented active population, independent aggregates.
-- A university with no consented active profiles has no snapshot row, allowing
-- the application to preserve its truthful unavailable/empty state.
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS public.university_dashboard_view;
DROP VIEW IF EXISTS public.university_dashboard_view_admin;
DROP MATERIALIZED VIEW IF EXISTS public.university_dashboard_snapshot;

CREATE MATERIALIZED VIEW public.university_dashboard_snapshot AS
WITH eligible_profiles AS (
  SELECT
    p.id,
    p.university_id,
    p.college_id,
    p.student_status,
    p.profile_completion_pct
  FROM public.profiles p
  WHERE p.university_id IS NOT NULL
    AND p.show_profile_in_university_stats = true
    AND p.deleted_at IS NULL
    AND p.suspended_at IS NULL
    AND p.profile_state = 'active'
    AND p.role = 'individual'
),
profile_aggregates AS (
  SELECT
    ep.university_id,
    count(DISTINCT ep.id)::integer AS total_students,
    round(avg(ep.profile_completion_pct)::numeric, 1) AS profile_completion_pct
  FROM eligible_profiles ep
  GROUP BY ep.university_id
),
college_aggregates AS (
  SELECT
    counts.university_id,
    jsonb_object_agg(counts.college_id::text, counts.profile_count) AS college_distribution
  FROM (
    SELECT ep.university_id, ep.college_id, count(DISTINCT ep.id)::integer AS profile_count
    FROM eligible_profiles ep
    WHERE ep.college_id IS NOT NULL
    GROUP BY ep.university_id, ep.college_id
  ) counts
  GROUP BY counts.university_id
),
status_aggregates AS (
  SELECT
    counts.university_id,
    jsonb_object_agg(counts.student_status, counts.profile_count) AS status_breakdown
  FROM (
    SELECT ep.university_id, ep.student_status, count(DISTINCT ep.id)::integer AS profile_count
    FROM eligible_profiles ep
    WHERE ep.student_status IS NOT NULL
    GROUP BY ep.university_id, ep.student_status
  ) counts
  GROUP BY counts.university_id
),
cv_aggregates AS (
  SELECT ep.university_id, count(DISTINCT c.user_id)::integer AS profiles_with_cv
  FROM eligible_profiles ep
  JOIN public.cvs c ON c.user_id = ep.id
  GROUP BY ep.university_id
),
application_aggregates AS (
  SELECT ep.university_id, count(a.id)::integer AS job_applications
  FROM eligible_profiles ep
  JOIN public.applications a ON a.applicant_id = ep.id
  GROUP BY ep.university_id
),
meeting_aggregates AS (
  SELECT ep.university_id, count(mm.id)::integer AS mentorship_sessions
  FROM eligible_profiles ep
  JOIN public.mentorship_meetings mm
    ON mm.mentee_id = ep.id
   AND mm.status = 'completed'
  GROUP BY ep.university_id
)
SELECT
  pa.university_id,
  pa.total_students,
  ca.college_distribution,
  pa.profile_completion_pct,
  round(
    100.0 * coalesce(cva.profiles_with_cv, 0)::numeric / pa.total_students,
    1
  ) AS cv_creation_pct,
  coalesce(aa.job_applications, 0)::integer AS job_applications,
  coalesce(ma.mentorship_sessions, 0)::integer AS mentorship_sessions,
  sa.status_breakdown,
  now() AS refreshed_at
FROM profile_aggregates pa
LEFT JOIN college_aggregates ca ON ca.university_id = pa.university_id
LEFT JOIN status_aggregates sa ON sa.university_id = pa.university_id
LEFT JOIN cv_aggregates cva ON cva.university_id = pa.university_id
LEFT JOIN application_aggregates aa ON aa.university_id = pa.university_id
LEFT JOIN meeting_aggregates ma ON ma.university_id = pa.university_id
WITH NO DATA;

CREATE UNIQUE INDEX idx_university_dashboard_snapshot_university_id
  ON public.university_dashboard_snapshot (university_id);

REFRESH MATERIALIZED VIEW public.university_dashboard_snapshot;

CREATE VIEW public.university_dashboard_view
WITH (security_barrier = true)
AS
SELECT uds.*
FROM public.university_dashboard_snapshot uds
WHERE false;

CREATE VIEW public.university_dashboard_view_admin
WITH (security_barrier = true)
AS
SELECT uds.*
FROM public.university_dashboard_snapshot uds
WHERE public.is_privileged_staff();

REVOKE ALL ON TABLE public.university_dashboard_snapshot
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.university_dashboard_view
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.university_dashboard_view_admin
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.university_dashboard_snapshot TO service_role;
GRANT SELECT ON TABLE public.university_dashboard_view
  TO authenticated, service_role;
GRANT SELECT ON TABLE public.university_dashboard_view_admin
  TO authenticated, service_role;

COMMENT ON MATERIALIZED VIEW public.university_dashboard_snapshot IS
  'Internal consent-safe aggregates keyed by the legacy universities_catalog id. Not an institutional identity or University Intelligence contract.';
COMMENT ON VIEW public.university_dashboard_view IS
  'Fail-closed University owner contract. Directory-to-academic-catalog identity is not referentially mapped; returns no rows until the dedicated identity reconciliation is approved and complete.';
