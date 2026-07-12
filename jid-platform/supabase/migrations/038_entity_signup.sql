-- Entity signup catalog, claim extensions (Section 11 Steps 8-9)

DO $$
BEGIN
  CREATE TYPE public.claim_type_enum AS ENUM ('company', 'university');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  domains text[] NOT NULL DEFAULT '{}',
  entity_type text NOT NULL CHECK (entity_type IN ('company', 'university')),
  is_verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_domains_nonempty_chk CHECK (cardinality(domains) > 0)
);

CREATE INDEX IF NOT EXISTS idx_companies_entity_type ON public.companies (entity_type);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_name_ar ON public.companies (name_ar);

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS claim_type public.claim_type_enum NOT NULL DEFAULT 'company';

CREATE INDEX IF NOT EXISTS idx_claim_requests_claim_type ON public.claim_requests (claim_type);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT companies_domains_nonempty_chk CHECK (cardinality(domains) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE POLICY companies_select_public
  ON public.companies
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY companies_insert_signup
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (is_verified = false);

DROP POLICY IF EXISTS claim_requests_insert_own ON public.claim_requests;

CREATE POLICY claim_requests_insert_own
  ON public.claim_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'pending_review', 'under_review')
  );

-- Seed catalog entries for local signup/search testing
INSERT INTO public.companies (name, name_ar, domains, entity_type, is_verified)
VALUES
  (
    'Saudi Aramco',
    'أرامكو السعودية',
    ARRAY['aramco.com', 'aramco.sa'],
    'company',
    true
  ),
  (
    'SABIC',
    'سابك',
    ARRAY['sabic.com', 'sabic.sa'],
    'company',
    true
  ),
  (
    'King Saud University',
    'جامعة الملك سعود',
    ARRAY['ksu.edu.sa'],
    'university',
    true
  ),
  (
    'King Abdulaziz University',
    'جامعة الملك عبدالعزيز',
    ARRAY['kau.edu.sa'],
    'university',
    true
  );
