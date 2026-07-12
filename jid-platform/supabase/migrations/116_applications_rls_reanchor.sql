-- P-104 Task 3 — Re-anchor applications RLS via jobs ownership (+ transitional path)

DROP POLICY IF EXISTS "Company sees their applicants" ON public.applications;
DROP POLICY IF EXISTS "Company updates their applicants" ON public.applications;
DROP POLICY IF EXISTS "Company updates status" ON public.applications;

CREATE POLICY applications_owner_read
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id
      FROM public.jobs j
      WHERE
        j.business_profile_id IN (
          SELECT bp.id
          FROM public.business_profiles bp
          WHERE bp.owner_user_id = auth.uid()
        )
        OR (
          -- TRANSITIONAL (P-104): retire this branch in P-110 after backfill
          j.business_profile_id IS NULL
          AND j.company_id IN (
            SELECT c.id
            FROM public.companies c
            WHERE c.claimed_by = auth.uid()
          )
        )
    )
  );

CREATE POLICY applications_owner_update_status
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id
      FROM public.jobs j
      WHERE
        j.business_profile_id IN (
          SELECT bp.id
          FROM public.business_profiles bp
          WHERE bp.owner_user_id = auth.uid()
        )
        OR (
          -- TRANSITIONAL (P-104): retire this branch in P-110 after backfill
          j.business_profile_id IS NULL
          AND j.company_id IN (
            SELECT c.id
            FROM public.companies c
            WHERE c.claimed_by = auth.uid()
          )
        )
    )
  );

NOTIFY pgrst, 'reload schema';
