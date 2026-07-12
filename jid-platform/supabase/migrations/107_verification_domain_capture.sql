-- P-102 Task 1 — verified_domains capture (Layer 2 evidence → Layer 3 profile copy)
-- Profiles are the live read source for downstream trust mechanics (P-104 domain validation).

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS verified_domains text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.verification_requests.verified_domains IS
  'Domain(s) confirmed during verification (from business_email and supporting evidence). Copied onto the owned profile at creation time by create_business_profile / create_university_profile — profiles are the live read source for downstream trust mechanics (job apply-link validation, Lammah entity matching), not this table, which remains the audit record of the verification event itself. FLAGGED DECISION: this dual-location design (capture here, copy to profile) is an implementation choice not spelled out verbatim in Profile Architecture v2 — confirm with founder if a single-source approach is preferred instead.';

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS verified_domains text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.university_profiles
  ADD COLUMN IF NOT EXISTS verified_domains text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_business_profiles_verified_domains
  ON public.business_profiles USING gin (verified_domains);

CREATE INDEX IF NOT EXISTS idx_university_profiles_verified_domains
  ON public.university_profiles USING gin (verified_domains);
