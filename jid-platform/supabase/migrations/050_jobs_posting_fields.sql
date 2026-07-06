-- Section 6.3 / 6.5 — per-job external apply URL + pending_review status

DO $$
BEGIN
  ALTER TYPE public.job_status_enum ADD VALUE IF NOT EXISTS 'pending_review';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS external_apply_url text;
