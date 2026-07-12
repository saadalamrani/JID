-- P-104 Task 2 — Re-anchor jobs RLS to business_profiles (+ transitional claimed_by read path)

DROP POLICY IF EXISTS "Company sees own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Company posts own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Company updates own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Update own or admin" ON public.jobs;

CREATE POLICY jobs_owner_read_own
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    business_profile_id IN (
      SELECT bp.id
      FROM public.business_profiles bp
      WHERE bp.owner_user_id = auth.uid()
    )
    OR (
      -- TRANSITIONAL (P-104): retire this branch in P-110 after backfill
      business_profile_id IS NULL
      AND company_id IN (
        SELECT c.id
        FROM public.companies c
        WHERE c.claimed_by = auth.uid()
      )
    )
  );

CREATE POLICY jobs_owner_insert
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_profile_id IS NOT NULL
    AND business_profile_id IN (
      SELECT bp.id
      FROM public.business_profiles bp
      WHERE bp.owner_user_id = auth.uid()
        AND bp.status <> 'suspended'
    )
  );

CREATE POLICY jobs_owner_or_staff_update
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    business_profile_id IN (
      SELECT bp.id
      FROM public.business_profiles bp
      WHERE bp.owner_user_id = auth.uid()
    )
    OR (
      -- TRANSITIONAL (P-104): retire this branch in P-110 after backfill
      business_profile_id IS NULL
      AND company_id IN (
        SELECT c.id
        FROM public.companies c
        WHERE c.claimed_by = auth.uid()
      )
    )
    OR (
      SELECT role
      FROM public.profiles
      WHERE id = auth.uid()
    ) IN ('staff', 'super_admin')
  );

-- Untouched: "Public views active jobs", "Staff manages all jobs" (048)

NOTIFY pgrst, 'reload schema';
