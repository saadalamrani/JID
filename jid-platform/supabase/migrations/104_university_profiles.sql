-- P-101 Task 2 — Layer 3 University Profile (Profile Architecture v2 §6)
-- Engage-face institutional content; university_programs belongs to P-501 (not here).

CREATE TABLE IF NOT EXISTS public.university_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_id uuid NOT NULL UNIQUE REFERENCES public.companies (id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES auth.users (id),
  display_name_ar text NOT NULL,
  display_name_en text,
  about_ar text,
  about_en text,
  -- Intent migrated from superseded Universities Pillar draft (was incorrectly on
  -- companies). Data backfill is P-110; this migration creates destination shape only:
  university_type text,
  accreditation_body text,
  student_population integer,
  established_year integer,
  partnership_highlights text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
  published_at timestamptz,
  verified_badge boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT university_profiles_established_year_chk
    CHECK (established_year IS NULL OR (established_year >= 1800 AND established_year <= 2100)),
  CONSTRAINT university_profiles_university_type_chk
    CHECK (university_type IS NULL OR university_type IN ('government', 'private'))
);

CREATE INDEX IF NOT EXISTS idx_university_profiles_owner
  ON public.university_profiles (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_university_profiles_status
  ON public.university_profiles (status)
  WHERE status = 'published';

COMMENT ON TABLE public.university_profiles IS
  'Layer 3 — Owned Profile for universities. Engage-face content lives here. See JID Profile Architecture v2 §6.';

COMMENT ON COLUMN public.university_profiles.directory_id IS
  'FK to companies.id (Layer 1). Profile points at directory — never the reverse.';

-- RLS enabled; policy content deferred to P-103 (Ownership Law rewrite).
ALTER TABLE public.university_profiles ENABLE ROW LEVEL SECURITY;
