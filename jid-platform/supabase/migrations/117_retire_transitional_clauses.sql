-- P-110 Task 3 — Retire P-104 transitional RLS branches and drop deprecated companies ownership columns
-- MANUAL APPLICATION ONLY — run after verify-backfill-integrity.ts reports full PASS.
-- Do NOT apply until the pre-check below returns zero rows.

-- ---------------------------------------------------------------------------
-- REQUIRED PRE-CHECK (operator must confirm zero rows before continuing):
--   SELECT id FROM public.jobs WHERE business_profile_id IS NULL;
-- If any rows are returned, STOP — run backfill first.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Jobs RLS — clean (non-transitional) policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS jobs_owner_read_own ON public.jobs;
DROP POLICY IF EXISTS jobs_owner_or_staff_update ON public.jobs;

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
      SELECT role
      FROM public.profiles
      WHERE id = auth.uid()
    ) IN ('staff', 'super_admin')
  );

-- jobs_owner_insert unchanged from P-104 (already non-transitional)

-- ---------------------------------------------------------------------------
-- Applications RLS — clean (non-transitional) policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS applications_owner_read ON public.applications;
DROP POLICY IF EXISTS applications_owner_update_status ON public.applications;

CREATE POLICY applications_owner_read
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id
      FROM public.jobs j
      WHERE j.business_profile_id IN (
        SELECT bp.id
        FROM public.business_profiles bp
        WHERE bp.owner_user_id = auth.uid()
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
      WHERE j.business_profile_id IN (
        SELECT bp.id
        FROM public.business_profiles bp
        WHERE bp.owner_user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Enforce jobs.business_profile_id NOT NULL (only when every row is backfilled)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE business_profile_id IS NULL) THEN
    ALTER TABLE public.jobs
      ALTER COLUMN business_profile_id SET NOT NULL;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Drop deprecated companies ownership columns (P-101 / P-110)
-- Skipped in automated bootstrap: claimed_by is still referenced by legacy
-- policies/functions. Apply column drops manually after verify-backfill-integrity PASS.
-- ---------------------------------------------------------------------------

-- ALTER TABLE public.companies DROP COLUMN IF EXISTS claimed_by;
-- ALTER TABLE public.companies DROP COLUMN IF EXISTS claim_status;
-- ALTER TABLE public.companies DROP COLUMN IF EXISTS is_claimed;
-- ALTER TABLE public.companies DROP COLUMN IF EXISTS claim_requested_at;
-- ALTER TABLE public.companies DROP COLUMN IF EXISTS claim_approved_at;
-- ALTER TABLE public.companies DROP COLUMN IF EXISTS claim_approved_by;

NOTIFY pgrst, 'reload schema';
