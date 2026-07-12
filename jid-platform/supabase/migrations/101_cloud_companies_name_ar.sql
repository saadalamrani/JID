-- Cloud reconciliation: companies catalog display columns missing from legacy schema.
-- Fixes: "column companies_1.name_ar does not exist"
-- Safe to re-run.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS link_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_audit_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entity_state text NOT NULL DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS tagline_en text,
  ADD COLUMN IF NOT EXISTS tagline_ar text,
  ADD COLUMN IF NOT EXISTS founded_year smallint,
  ADD COLUMN IF NOT EXISTS employee_count_range text,
  ADD COLUMN IF NOT EXISTS broken_since timestamptz,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text;

-- Backfill Arabic display name from legacy legal/trade names.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'legal_name_ar'
  ) THEN
    EXECUTE $sql$
      UPDATE public.companies
      SET name_ar = COALESCE(NULLIF(trim(name_ar), ''), NULLIF(trim(legal_name_ar), ''), NULLIF(trim(trade_name), ''))
      WHERE name_ar IS NULL
    $sql$;
  END IF;
END;
$$;

-- Backfill English name if still missing (job board embed uses name + name_ar).
UPDATE public.companies
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(name_ar), ''), 'Company')
WHERE name IS NULL;

UPDATE public.companies
SET is_verified = (verification_status = 'approved')
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'verification_status'
);

NOTIFY pgrst, 'reload schema';
