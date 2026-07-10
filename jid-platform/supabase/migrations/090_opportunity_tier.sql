-- 090_opportunity_tier.sql — Prompt 0 / logical migration 041
-- Native employer jobs default 'normal' (عادي). 'plus' reserved for Plus-gated inventory.

DO $$
BEGIN
  CREATE TYPE public.opportunity_tier_enum AS ENUM ('normal', 'plus');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tier public.opportunity_tier_enum NOT NULL DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS idx_jobs_tier
  ON public.jobs (tier)
  WHERE tier = 'plus';
