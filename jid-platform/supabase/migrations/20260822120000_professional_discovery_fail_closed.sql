-- JID Interview Prototype — Professional Discovery fail-closed
-- Forward-only after Gate A CONTRACT. Does not rewrite Gate A history.
--
-- Removes general verified-Business discovery of Individuals based solely on
-- profiles.visibility = discoverable + show_profile_to_companies.
-- Preserves: owner, privileged staff, public visibility, approved-mentor path,
-- and application-bound Business reads (legitimate applicant relationship).

CREATE OR REPLACE FUNCTION private.can_read_individual_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
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
          -- Approved mentors may still read discoverable Individuals for mentorship.
          p.visibility = 'discoverable'
          AND (SELECT auth.uid()) IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.mentor_profiles mp
            WHERE mp.user_id = (SELECT auth.uid())
              AND mp.status = 'approved'
          )
        )
        OR (
          -- Application-bound Business access only (not general Professional Discovery).
          (SELECT auth.uid()) IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.applications a
            WHERE a.applicant_id = p.id
              AND (
                EXISTS (
                  SELECT 1
                  FROM public.companies c
                  WHERE c.id = a.company_id
                    AND c.claimed_by = (SELECT auth.uid())
                    AND c.entity_state = 'approved'
                )
                OR EXISTS (
                  SELECT 1
                  FROM public.business_profiles bp
                  WHERE bp.directory_id = a.company_id
                    AND bp.owner_user_id = (SELECT auth.uid())
                    AND bp.status IN ('draft', 'published')
                )
              )
          )
        )
      )
  );
$$;

COMMENT ON FUNCTION private.can_read_individual_profile(uuid) IS
  'Audience gate: owner/staff/public/mentor + application-bound Business only. Professional Discovery fail-closed for interview prototype.';

-- Base-table SELECT for application-bound Business (triage embeds profiles).
DROP POLICY IF EXISTS profiles_select_application_bound_business ON public.profiles;
CREATE POLICY profiles_select_application_bound_business
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'individual'
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.applicant_id = profiles.id
        AND (
          EXISTS (
            SELECT 1
            FROM public.companies c
            WHERE c.id = a.company_id
              AND c.claimed_by = (SELECT auth.uid())
              AND c.entity_state = 'approved'
          )
          OR EXISTS (
            SELECT 1
            FROM public.business_profiles bp
            WHERE bp.directory_id = a.company_id
              AND bp.owner_user_id = (SELECT auth.uid())
              AND bp.status IN ('draft', 'published')
          )
        )
    )
  );

-- Contact flag must not advertise general discovery to verified Businesses.
CREATE OR REPLACE VIEW public.individual_profile_public_projection
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
  false AS allow_contact
FROM public.profiles p
WHERE private.can_read_individual_profile(p.id);

REVOKE ALL ON TABLE public.individual_profile_public_projection
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.individual_profile_public_projection
  TO anon, authenticated, service_role;
