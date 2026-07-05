-- Unified Profile System — profile enhancements (Section 5 / Section 12 Step 1)

CREATE TYPE public.profile_state_enum AS ENUM (
  'incomplete',
  'active',
  'suspended',
  'deleted'
);

CREATE TYPE public.profile_visibility_enum AS ENUM (
  'private',
  'discoverable',
  'public'
);

-- Minimal catalog tables referenced by completion scoring (full catalog ships later)
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities (id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colleges_university_id ON public.colleges (university_id);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_skills (
  profile_id uuid NOT NULL,
  skill_id uuid NOT NULL REFERENCES public.skills (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, skill_id)
);

-- Profiles may be created here (auth foundation extends it in 029)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS target_sectors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_program_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_regions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS smart_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_completion_pct smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_state public.profile_state_enum NOT NULL DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS visibility public.profile_visibility_enum NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS show_profile_to_companies boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_profile_in_university_stats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES public.universities (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.colleges (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linkedin_url text;

ALTER TABLE public.profile_skills
  ADD CONSTRAINT profile_skills_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_about_me_length_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_about_me_length_chk
      CHECK (about_me IS NULL OR char_length(about_me) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_target_sectors_max_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_target_sectors_max_chk
      CHECK (cardinality(target_sectors) <= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_completion_pct_range_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_completion_pct_range_chk
      CHECK (profile_completion_pct >= 0 AND profile_completion_pct <= 100);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_visibility_active
  ON public.profiles (visibility)
  WHERE deleted_at IS NULL AND profile_state = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_discoverable_companies
  ON public.profiles (show_profile_to_companies, visibility)
  WHERE deleted_at IS NULL
    AND profile_state = 'active'
    AND visibility = 'discoverable'
    AND show_profile_to_companies = true;
