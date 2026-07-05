-- Company profile fields + mentor profile extensions (Section 5.4 / 5.5)

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  domains text[] NOT NULL DEFAULT '{}',
  entity_type text NOT NULL DEFAULT 'company' CHECK (entity_type IN ('company', 'university')),
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tagline_ar text,
  ADD COLUMN IF NOT EXISTS tagline_en text,
  ADD COLUMN IF NOT EXISTS about_long_ar text,
  ADD COLUMN IF NOT EXISTS about_long_en text,
  ADD COLUMN IF NOT EXISTS founded_year smallint,
  ADD COLUMN IF NOT EXISTS employee_count_range text,
  ADD COLUMN IF NOT EXISTS office_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS commitment_score numeric(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_response_days numeric(6, 2),
  ADD COLUMN IF NOT EXISTS response_rate_pct numeric(5, 2),
  ADD COLUMN IF NOT EXISTS total_jobs_posted_12mo integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_on_honor_roll boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entity_state text NOT NULL DEFAULT 'unclaimed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_entity_state_chk'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_entity_state_chk
      CHECK (entity_state IN ('unclaimed', 'pending', 'claimed', 'suspended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_founded_year_chk'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_founded_year_chk
      CHECK (founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= 2100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_commitment_score_chk'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_commitment_score_chk
      CHECK (commitment_score >= 0 AND commitment_score <= 100);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_companies_entity_state ON public.companies (entity_state);
CREATE INDEX IF NOT EXISTS idx_companies_commitment_score ON public.companies (commitment_score DESC);

-- Deferred FK from profile_views (025) — company-level viewer only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profile_views_viewer_company_id_fkey'
  ) THEN
    ALTER TABLE public.profile_views
      ADD CONSTRAINT profile_views_viewer_company_id_fkey
      FOREIGN KEY (viewer_company_id) REFERENCES public.companies (id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  headline text,
  bio_short text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS avg_response_hours numeric(8, 2),
  ADD COLUMN IF NOT EXISTS bio_long text,
  ADD COLUMN IF NOT EXISTS career_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_status ON public.mentor_profiles (status);

-- Claim workflow stub (expanded in 031 / 038) — required for profile HR RLS in 028
DO $$
BEGIN
  CREATE TYPE public.claim_status_enum AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.claim_type_enum AS ENUM ('company', 'university');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_email text NOT NULL,
  claimant_name text NOT NULL,
  claimant_title text,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status public.claim_status_enum NOT NULL DEFAULT 'pending',
  claim_type public.claim_type_enum NOT NULL DEFAULT 'company',
  review_notes text,
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT claim_requests_business_email_format_chk CHECK (business_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_user_id ON public.claim_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_company_id ON public.claim_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.claim_requests (status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_claim_type ON public.claim_requests (claim_type);
