-- PostgREST embed jobs → regions requires an FK (schema cache).
-- jobs.region_id already existed without a foreign key.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name = 'region_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_region_id_fkey'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_region_id_fkey
      FOREIGN KEY (region_id) REFERENCES public.regions (id) ON DELETE SET NULL;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
