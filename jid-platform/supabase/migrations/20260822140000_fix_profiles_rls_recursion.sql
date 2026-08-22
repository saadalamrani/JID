-- Fix profiles RLS infinite recursion (42P17) introduced by inline
-- profiles_select_application_bound_business that queried applications under RLS,
-- which re-entered profiles via is_privileged_staff() / related checks.
--
-- Forward-only after 20260822120000. Does not weaken Professional Discovery
-- fail-closed: application-bound Business read remains, via SECURITY DEFINER
-- with row_security off so policy evaluation cannot recurse.

CREATE OR REPLACE FUNCTION public.is_privileged_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT coalesce(
    (
      SELECT role::text IN ('staff', 'admin', 'super_admin')
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION private.can_read_individual_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET row_security = off
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
          AND EXISTS (
            SELECT 1
            FROM public.mentor_profiles mp
            WHERE mp.user_id = (SELECT auth.uid())
              AND mp.status = 'approved'
          )
        )
        OR (
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

CREATE OR REPLACE FUNCTION private.business_can_select_applicant_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.role = 'individual'
      AND p.deleted_at IS NULL
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
  );
$$;

REVOKE ALL ON FUNCTION private.business_can_select_applicant_profile(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.business_can_select_applicant_profile(uuid)
  TO authenticated;

COMMENT ON FUNCTION private.business_can_select_applicant_profile(uuid) IS
  'RLS-safe application-bound Business SELECT gate for public.profiles. row_security off to prevent 42P17 recursion.';

DROP POLICY IF EXISTS profiles_select_application_bound_business ON public.profiles;
CREATE POLICY profiles_select_application_bound_business
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (private.business_can_select_applicant_profile(id));
