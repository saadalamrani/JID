-- Onboarding sprint — Section 9.3 contact_messages + profile onboarding timestamps.
-- Part A confirmed: no prior onboarding_* columns on profiles; notifications enum lacks platform.announcement.

-- ---------------------------------------------------------------------------
-- Section 9.3 — contact_messages (onboarding / support intake)
-- NOTE: Master Prompt Section 9.3 DDL is not checked into this repo; this migration
-- implements the documented intent: authenticated users submit, staff read all.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.contact_message_source_enum AS ENUM (
    'onboarding',
    'contact_page',
    'claim_help'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  source public.contact_message_source_enum NOT NULL DEFAULT 'onboarding',
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_email_format_chk CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT contact_messages_full_name_nonempty_chk CHECK (char_length(trim(full_name)) > 0),
  CONSTRAINT contact_messages_subject_nonempty_chk CHECK (char_length(trim(subject)) > 0),
  CONSTRAINT contact_messages_body_nonempty_chk CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id
  ON public.contact_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_source
  ON public.contact_messages (source);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_insert_authenticated ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_select_own ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_select_staff ON public.contact_messages;

-- Submitters may file messages (user_id must match session when provided).
CREATE POLICY contact_messages_insert_authenticated
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Users may read their own submissions.
CREATE POLICY contact_messages_select_own
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Section 9.3 — staff read access for triage.
CREATE POLICY contact_messages_select_staff
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());

-- ---------------------------------------------------------------------------
-- Profile onboarding timestamps (Part A.4 — columns did not exist)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at
  ON public.profiles (onboarding_completed_at)
  WHERE onboarding_completed_at IS NOT NULL;
