-- Cloud bootstrap: sectors/regions lookup tables + jobs/companies FK reconciliation.
-- Run in Supabase SQL Editor when the app errors:
--   "Could not find a relationship between 'jobs' and 'sectors'"
-- Safe to re-run (idempotent).

-- ---------------------------------------------------------------------------
-- 1. Lookup tables (migration 044 / 045)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sectors
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sectors_slug ON public.sectors (slug);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON public.regions (slug);
CREATE INDEX IF NOT EXISTS idx_sectors_display_order ON public.sectors (display_order);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sectors_select_public ON public.sectors;
CREATE POLICY sectors_select_public
  ON public.sectors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS regions_select_public ON public.regions;
CREATE POLICY regions_select_public
  ON public.regions FOR SELECT TO anon, authenticated USING (true);

-- Seed catalog (abbreviated — full list in supabase/seed/sectors.sql)
INSERT INTO public.sectors (id, slug, name_en, name_ar, display_order)
VALUES
  ('f1000001-0000-4000-8000-000000000001', 'technology-information', 'Technology & Information', 'التقنية والمعلومات', 1),
  ('f1000001-0000-4000-8000-000000000006', 'finance-banking', 'Finance & Banking', 'المالية والمصرفية', 6),
  ('f1000001-0000-4000-8000-000000000007', 'education', 'Education', 'التعليم', 7),
  ('f1000001-0000-4000-8000-000000000010', 'manufacturing', 'Manufacturing', 'التصنيع', 10),
  ('f1000001-0000-4000-8000-000000000017', 'retail-ecommerce', 'Retail & E-Commerce', 'التجزئة والتجارة الإلكترونية', 17),
  ('f1000001-0000-4000-8000-000000000023', 'artificial-intelligence', 'Artificial Intelligence', 'الذكاء الاصطناعي', 23)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  display_order = EXCLUDED.display_order;

INSERT INTO public.regions (id, slug, name_en, name_ar)
VALUES
  ('f2000001-0000-4000-8000-000000000001', 'riyadh', 'Riyadh', 'الرياض'),
  ('f2000001-0000-4000-8000-000000000005', 'eastern-province', 'Eastern Province', 'المنطقة الشرقية'),
  ('f2000001-0000-4000-8000-000000000002', 'makkah', 'Makkah', 'مكة المكرمة')
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar;

-- ---------------------------------------------------------------------------
-- 2. Companies — catalog columns expected by job board queries
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'ownership_enum'
  ) THEN
    CREATE TYPE public.ownership_enum AS ENUM ('government', 'semi_government', 'private');
  END IF;
END;
$$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS career_portal_url text,
  ADD COLUMN IF NOT EXISTS ownership_type public.ownership_enum;

-- Backfill display name from legacy columns when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'legal_name_en'
  ) THEN
    EXECUTE $sql$
      UPDATE public.companies
      SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(legal_name_en), ''), NULLIF(trim(trade_name), ''), NULLIF(trim(legal_name_ar), ''))
      WHERE name IS NULL
    $sql$;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'trade_name'
  ) THEN
    EXECUTE $sql$
      UPDATE public.companies
      SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(trade_name), ''))
      WHERE name IS NULL
    $sql$;
  END IF;

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

UPDATE public.companies
SET name = COALESCE(NULLIF(trim(name), ''), 'Company')
WHERE name IS NULL;

-- Legacy text sector/region → FK ids
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'sector'
  ) THEN
    EXECUTE $sql$
      UPDATE public.companies c
      SET sector_id = s.id
      FROM public.sectors s
      WHERE c.sector_id IS NULL
        AND c.sector IS NOT NULL
        AND s.slug = lower(trim(c.sector))
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'region'
  ) THEN
    EXECUTE $sql$
      UPDATE public.companies c
      SET region_id = r.id
      FROM public.regions r
      WHERE c.region_id IS NULL
        AND c.region IS NOT NULL
        AND r.slug = lower(trim(c.region))
    $sql$;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_companies_sector_id ON public.companies (sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_region_id ON public.companies (region_id);

-- ---------------------------------------------------------------------------
-- 3. Jobs — reconciled columns expected by src/lib/queries/jobs.ts (048+)
-- ---------------------------------------------------------------------------

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_remote boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS application_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS applicant_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_boosted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS boost_ends_at timestamptz;

-- Legacy prototype columns → reconciled names
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'title'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs
      SET title_ar = COALESCE(NULLIF(trim(title_ar), ''), NULLIF(trim(title), ''))
      WHERE title_ar IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'description'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs
      SET description_ar = COALESCE(NULLIF(trim(description_ar), ''), NULLIF(trim(description), ''))
      WHERE description_ar IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'requirements'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs
      SET description_ar = COALESCE(NULLIF(trim(description_ar), ''), NULLIF(trim(requirements), ''))
      WHERE description_ar IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'closes_at'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs
      SET application_deadline = COALESCE(application_deadline, closes_at)
      WHERE application_deadline IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'expires_at'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs
      SET application_deadline = COALESCE(application_deadline, expires_at)
      WHERE application_deadline IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'sector'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs j
      SET sector_id = s.id
      FROM public.sectors s
      WHERE j.sector_id IS NULL
        AND j.sector IS NOT NULL
        AND s.slug = lower(trim(j.sector))
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'region'
  ) THEN
    EXECUTE $sql$
      UPDATE public.jobs j
      SET region_id = r.id
      FROM public.regions r
      WHERE j.region_id IS NULL
        AND j.region IS NOT NULL
        AND r.slug = lower(trim(j.region))
    $sql$;
  END IF;
END;
$$;

UPDATE public.jobs
SET
  title_ar = COALESCE(NULLIF(trim(title_ar), ''), 'Untitled'),
  application_deadline = COALESCE(application_deadline, now() + interval '30 days')
WHERE title_ar IS NULL OR application_deadline IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_sector_id ON public.jobs (sector_id);
CREATE INDEX IF NOT EXISTS idx_jobs_region_id ON public.jobs (region_id);
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON public.jobs (application_deadline);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
