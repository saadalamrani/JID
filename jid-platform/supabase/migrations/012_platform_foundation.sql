-- Local bootstrap foundation — reconciles missing early schema for fresh `supabase start`.
-- Migrations 013+ assumed profiles/companies/jobs/etc. from a prior sprint not checked in.
-- Later migrations use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS to extend these stubs.

-- ---------------------------------------------------------------------------
-- Enums (extended by 024 / 029 / 018 / 048)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.user_role_enum AS ENUM (
    'individual',
    'entity',
    'staff',
    'admin',
    'super_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.profile_state_enum AS ENUM (
    'incomplete',
    'active',
    'suspended',
    'deleted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.profile_visibility_enum AS ENUM (
    'private',
    'discoverable',
    'public'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.entity_type_enum AS ENUM ('company', 'university');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.experience_level_enum AS ENUM (
    'intern',
    'entry',
    'mid',
    'senior',
    'lead',
    'executive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles — required by 015+ (fully extended in 024 / 029)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'ar',
  role public.user_role_enum NOT NULL DEFAULT 'individual',
  profile_state public.profile_state_enum NOT NULL DEFAULT 'active',
  visibility public.profile_visibility_enum NOT NULL DEFAULT 'private',
  profile_completion_pct smallint NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- companies — required by 016 / 018 (extended in 027 / 038)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Stub Company',
  name_ar text,
  domains text[] NOT NULL DEFAULT '{stub.local}',
  entity_type public.entity_type_enum NOT NULL DEFAULT 'company',
  is_verified boolean NOT NULL DEFAULT false,
  claimed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  university_short_code text,
  total_students_claimed integer NOT NULL DEFAULT 0,
  subscription_tier text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- sectors — required by 016 (canonical table reconciled in 044)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- jobs — required by 016 (canonical table in 048)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies (id) ON DELETE CASCADE,
  sector_id uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  applicant_count integer NOT NULL DEFAULT 0,
  required_skills text[] NOT NULL DEFAULT '{}',
  title_ar text NOT NULL DEFAULT 'Stub Job',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- applications — required by 016 / 022 (canonical table in 048)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  last_company_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- mentor_profiles — required by 016 (extended in 027 / 042 / 055)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- mentorship_meetings — required by 016 / 022 (extended in 055 / 062)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mentorship_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_status
  ON public.mentorship_meetings (status);

-- ---------------------------------------------------------------------------
-- cvs — required by 022 (extended in 026 / 068)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs (user_id);

-- Extend stubs so later migrations (048+) can create indexes without missing columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS is_remote boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS salary_min integer,
  ADD COLUMN IF NOT EXISTS salary_max integer,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS application_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS region_id uuid,
  ADD COLUMN IF NOT EXISTS experience_level public.experience_level_enum NOT NULL DEFAULT 'entry';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
