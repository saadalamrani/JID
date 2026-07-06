-- Jobs & Applications database layer (Section 7.1 / 7.2 / 8 — reconciled with Catalog + Profile)
-- Step 1 findings:
--   (a) No user_verified_emails table — profiles.email_verified_at only → CREATE user_verified_emails
--   (b) No user_privacy_settings table — privacy on profiles (024) → SKIP separate table
--   (c) companies.entity_state + companies.commitment_score confirmed (027 / 044)

-- ===========================================================================
-- Section 7.1 — Enums
-- ===========================================================================

DO $$
BEGIN
  CREATE TYPE public.job_status_enum AS ENUM (
    'draft',
    'published',
    'closing_soon',
    'closed',
    'expired'
  );
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

DO $$
BEGIN
  CREATE TYPE public.application_status_enum AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'shortlisted',
    'rejected',
    'invited',
    'withdrawn',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ===========================================================================
-- Section 7.1 — user_verified_emails (fresh — no prior multi-email table)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.user_verified_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  email text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_verified_emails_email_format_chk
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT user_verified_emails_email_lower_chk
    CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_verified_emails_email_unique
  ON public.user_verified_emails (email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_verified_emails_user_email_unique
  ON public.user_verified_emails (user_id, email);

CREATE INDEX IF NOT EXISTS idx_user_verified_emails_user_id
  ON public.user_verified_emails (user_id);

-- ===========================================================================
-- Section 7.1 — Privacy reconciliation (profiles SSOT — no user_privacy_settings)
-- profiles.visibility, show_profile_to_companies, show_profile_in_university_stats
-- ship in 024_profile_enhancements.sql
-- ===========================================================================

-- ===========================================================================
-- Section 7.1 — jobs
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  slug text,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  experience_level public.experience_level_enum NOT NULL DEFAULT 'entry',
  status public.job_status_enum NOT NULL DEFAULT 'draft',
  sector_id uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  city text,
  is_remote boolean NOT NULL DEFAULT false,
  salary_min integer,
  salary_max integer,
  salary_currency text NOT NULL DEFAULT 'SAR',
  application_deadline timestamptz NOT NULL,
  published_at timestamptz,
  closed_at timestamptz,
  applicant_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jobs_applicant_count_nonneg_chk CHECK (applicant_count >= 0),
  CONSTRAINT jobs_view_count_nonneg_chk CHECK (view_count >= 0),
  CONSTRAINT jobs_salary_range_chk CHECK (
    salary_min IS NULL
    OR salary_max IS NULL
    OR salary_min <= salary_max
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_company_slug_unique
  ON public.jobs (company_id, slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_company_id
  ON public.jobs (company_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON public.jobs (status);

CREATE INDEX IF NOT EXISTS idx_jobs_company_status
  ON public.jobs (company_id, status);

CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline
  ON public.jobs (application_deadline);

CREATE INDEX IF NOT EXISTS idx_jobs_status_deadline
  ON public.jobs (status, application_deadline);

CREATE INDEX IF NOT EXISTS idx_jobs_published_at
  ON public.jobs (published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_jobs_experience_level
  ON public.jobs (experience_level);

-- ===========================================================================
-- Section 7.1 — application_intents
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.application_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT application_intents_job_user_unique UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_application_intents_job_id
  ON public.application_intents (job_id);

CREATE INDEX IF NOT EXISTS idx_application_intents_user_id
  ON public.application_intents (user_id);

-- ===========================================================================
-- Section 7.1 — applications
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  status public.application_status_enum NOT NULL DEFAULT 'draft',
  cover_letter text,
  resume_url text,
  contact_email text,
  submitted_at timestamptz,
  last_company_action_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_job_applicant_unique UNIQUE (job_id, applicant_id),
  CONSTRAINT applications_contact_email_format_chk CHECK (
    contact_email IS NULL
    OR contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id
  ON public.applications (job_id);

CREATE INDEX IF NOT EXISTS idx_applications_applicant_id
  ON public.applications (applicant_id);

CREATE INDEX IF NOT EXISTS idx_applications_company_id
  ON public.applications (company_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON public.applications (status);

CREATE INDEX IF NOT EXISTS idx_applications_job_status
  ON public.applications (job_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_submitted_at
  ON public.applications (submitted_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_applications_expires_at
  ON public.applications (expires_at)
  WHERE expires_at IS NOT NULL;

-- ===========================================================================
-- Section 7.2 — Triggers / maintenance functions (no pg_cron — Day 9)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.sync_application_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT j.company_id INTO NEW.company_id
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  IF NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'Job not found for application';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_sync_company ON public.applications;

CREATE TRIGGER trg_applications_sync_company
  BEFORE INSERT OR UPDATE OF job_id, status
  ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_application_company_id();

CREATE OR REPLACE FUNCTION public.update_job_applicant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  v_job_id := COALESCE(NEW.job_id, OLD.job_id);

  UPDATE public.jobs j
  SET
    applicant_count = (
      SELECT count(*)::integer
      FROM public.applications a
      WHERE a.job_id = v_job_id
        AND a.status NOT IN ('draft', 'withdrawn', 'expired')
    ),
    updated_at = now()
  WHERE j.id = v_job_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_applicant_count ON public.applications;

CREATE TRIGGER trg_applications_applicant_count
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_applicant_count();

CREATE OR REPLACE FUNCTION public.transition_closing_soon()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.jobs
  SET
    status = 'closing_soon',
    updated_at = now()
  WHERE status = 'published'
    AND application_deadline > now()
    AND application_deadline <= now() + interval '7 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_passed_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.jobs
  SET
    status = 'expired',
    closed_at = coalesce(closed_at, now()),
    updated_at = now()
  WHERE status IN ('published', 'closing_soon')
    AND application_deadline < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_applications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- SLA derived from companies.commitment_score (Catalog reconciliation)
  UPDATE public.applications a
  SET
    status = 'expired',
    expires_at = coalesce(a.expires_at, now()),
    updated_at = now()
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  WHERE a.job_id = j.id
    AND a.status IN ('submitted', 'under_review')
    AND a.submitted_at IS NOT NULL
    AND now() >= a.submitted_at + (
      CASE
        WHEN coalesce(c.commitment_score, 0) >= 80 THEN interval '7 days'
        WHEN coalesce(c.commitment_score, 0) >= 50 THEN interval '14 days'
        ELSE interval '30 days'
      END
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_closing_soon() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_passed_jobs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_stale_applications() FROM PUBLIC, anon;

-- ===========================================================================
-- Section 8 — RLS (entity_state = 'approved', never claim_status)
-- ===========================================================================

ALTER TABLE public.user_verified_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- user_verified_emails
DROP POLICY IF EXISTS user_verified_emails_select_own ON public.user_verified_emails;
DROP POLICY IF EXISTS user_verified_emails_insert_own ON public.user_verified_emails;
DROP POLICY IF EXISTS user_verified_emails_delete_own ON public.user_verified_emails;
DROP POLICY IF EXISTS user_verified_emails_staff_all ON public.user_verified_emails;

CREATE POLICY user_verified_emails_select_own
  ON public.user_verified_emails
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_verified_emails_insert_own
  ON public.user_verified_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_verified_emails_delete_own
  ON public.user_verified_emails
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_verified_emails_staff_all
  ON public.user_verified_emails
  FOR ALL
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

-- jobs
DROP POLICY IF EXISTS "Public views active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Company sees own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Company posts own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Company updates own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Staff manages all jobs" ON public.jobs;

CREATE POLICY "Public views active jobs"
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('published', 'closing_soon'));

CREATE POLICY "Company sees own jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Company posts own jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Company updates own jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Staff manages all jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

-- application_intents
DROP POLICY IF EXISTS "Applicant manages own intents" ON public.application_intents;
DROP POLICY IF EXISTS "Company sees intents on own jobs" ON public.application_intents;
DROP POLICY IF EXISTS "Staff manages all intents" ON public.application_intents;

CREATE POLICY "Applicant manages own intents"
  ON public.application_intents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND job_id IN (
      SELECT j.id
      FROM public.jobs j
      WHERE j.status IN ('published', 'closing_soon')
    )
  );

CREATE POLICY "Company sees intents on own jobs"
  ON public.application_intents
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id
      FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Staff manages all intents"
  ON public.application_intents
  FOR ALL
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

-- applications
DROP POLICY IF EXISTS "Applicant sees own applications" ON public.applications;
DROP POLICY IF EXISTS "Applicant submits applications" ON public.applications;
DROP POLICY IF EXISTS "Applicant updates own applications" ON public.applications;
DROP POLICY IF EXISTS "Company sees their applicants" ON public.applications;
DROP POLICY IF EXISTS "Company updates their applicants" ON public.applications;
DROP POLICY IF EXISTS "Staff manages all applications" ON public.applications;

CREATE POLICY "Applicant sees own applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Applicant submits applications"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_id = auth.uid()
    AND job_id IN (
      SELECT j.id
      FROM public.jobs j
      WHERE j.status IN ('published', 'closing_soon')
        AND j.application_deadline >= now()
    )
  );

CREATE POLICY "Applicant updates own applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Company sees their applicants"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Company updates their applicants"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );

CREATE POLICY "Staff manages all applications"
  ON public.applications
  FOR ALL
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());
