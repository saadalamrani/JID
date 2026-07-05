-- Entity ownership claim workflow
-- Section 11 Step 1

CREATE TYPE public.claim_status_enum AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TABLE public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  company_name text NOT NULL,
  business_email text NOT NULL,
  claimant_name text NOT NULL,
  claimant_title text,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status public.claim_status_enum NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT claim_requests_business_email_format_chk CHECK (business_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX idx_claim_requests_user_id ON public.claim_requests (user_id);

CREATE INDEX idx_claim_requests_company_id ON public.claim_requests (company_id);

CREATE INDEX idx_claim_requests_status ON public.claim_requests (status);

CREATE INDEX idx_claim_requests_created_at ON public.claim_requests (created_at DESC);
