-- P-104 Task 1 — Anchor jobs to owned business_profiles (Layer 3)

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS business_profile_id uuid
    REFERENCES public.business_profiles (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_jobs_business_profile
  ON public.jobs (business_profile_id);

COMMENT ON COLUMN public.jobs.business_profile_id IS
  'The owned Business Profile this job belongs to (Layer 3). company_id (Directory reference) is retained for display/taxonomy joins only — see Profile Architecture v2 §3, "operations anchor to owned profiles." NULL only for legacy pre-refactor rows pending P-110 backfill.';

NOTIFY pgrst, 'reload schema';
