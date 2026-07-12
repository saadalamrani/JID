-- P-101 Task 1 — Layer 3 Business Profile (Profile Architecture v2 §5)
-- Directory ≠ Profile: org-authored identity anchored 1:1 to a companies (Layer 1) row.

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 1:1 anchor to the Layer-1 Directory record. UNIQUE enforces one profile per directory
  -- entity. ON DELETE RESTRICT: a directory record with a live profile may never be
  -- silently deleted by directory maintenance.
  directory_id uuid NOT NULL UNIQUE REFERENCES public.companies (id) ON DELETE RESTRICT,
  -- FLAGGED DECISION: single-owner for Model 1 (no multi-seat yet — "Hiring Manager Seats"
  -- is an explicit Model-2 backlog item). A future seats table would generalize this
  -- without breaking the FK; do not build seats now.
  owner_user_id uuid NOT NULL REFERENCES auth.users (id),
  -- Self-authored identity (may legitimately diverge from the directory reference name):
  display_name_ar text NOT NULL,
  display_name_en text,
  tagline_ar text,
  about_ar text,
  about_en text,
  founded_year integer,
  employee_count_range text,
  cover_image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Publication lifecycle (authored before public):
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
  published_at timestamptz,
  -- Projection of Layer-2 verification truth for cheap public reads; source of truth
  -- remains verification_requests.status — P-102 keeps this in sync:
  verified_badge boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_profiles_founded_year_chk
    CHECK (founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= 2100))
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_owner
  ON public.business_profiles (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_business_profiles_status
  ON public.business_profiles (status)
  WHERE status = 'published';

COMMENT ON TABLE public.business_profiles IS
  'Layer 3 — Owned Profile. Org-authored identity, anchored 1:1 to a Directory record. See JID Profile Architecture v2 §5.';

COMMENT ON COLUMN public.business_profiles.directory_id IS
  'FK to companies.id (Layer 1). Profile points at directory — never the reverse.';

COMMENT ON COLUMN public.business_profiles.verified_badge IS
  'Denormalized verification projection for public cards; authoritative state is verification_requests (Layer 2).';

-- RLS enabled; policy content deferred to P-103 (Ownership Law rewrite).
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
