-- =============================================================================
-- 124_reconcile_mentor_domain.sql  (filename to be confirmed by Cursor — see Part C)
-- Consolidated end-state for the mentor domain: mentor_profiles, mentor_reviews,
-- mentorship_meetings, mentorship_requests, mentor_workshops,
-- mentor_notification_requests — plus the support tables their tracked foreign
-- keys require (conversations, messages, user_encryption_keys, radar_items) and
-- one prerequisite staff-check function (is_privileged_staff, from migration 036).
--
-- Derived from tracked migrations only: 012, 026, 027, 042, 055, 056, 057, 058,
-- 059, 060, 061, 062, 063, 064, 066, 067, 119, 120, 0295. Does not touch
-- public.mentors. Does not copy any test data. Does not remove staff_review_mentor().
--
-- THREE DELIBERATE, FLAGGED DEVIATIONS FROM LITERAL TRACKED SQL (see preflight
-- above for full reasoning — none are a redesign of business logic):
--   1. is_mentorship_staff() and is_privileged_staff() compare role::text instead
--      of the bare enum column, because production's real user_role enum has no
--      'super_admin' value and the literal comparison would error on every call.
--   2. award_mentor_verified_on_approval() and award_mentorship_active_badge()
--      wrap their award_user_badge() call in an exception guard because no
--      badges system exists in production yet (separate domain, not built here).
--   3. An explicit privilege-lockdown section (REVOKE/GRANT per table) is added,
--      matching the precedent already applied to the 11-table RLS-hardening
--      batch, because production's default ACLs otherwise grant anon/authenticated
--      full TRUNCATE on any new table regardless of RLS policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Section 0 — Extension (already installed in production; IF NOT EXISTS no-op)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- Section 1 — Enum types (net-new, confirmed no conflict in preflight)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.mentor_workshop_status_enum AS ENUM ('draft', 'published', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.mentorship_request_status_enum AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.mentor_notification_status_enum AS ENUM ('pending', 'sent', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.review_visibility_enum AS ENUM ('private', 'public_named', 'public_anonymous');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- Section 2 — Prerequisite staff-check functions
-- -----------------------------------------------------------------------------

-- Prerequisite from migration 036 (NOT part of the mentor domain itself, but a
-- hard dependency of mentor_reviews' final staff-read policy from 119). Included
-- verbatim in intent, with the role::text deviation explained above.
CREATE OR REPLACE FUNCTION public.is_privileged_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT role::text IN ('staff', 'admin', 'super_admin')
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_privileged_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privileged_staff() TO authenticated;

-- From migration 055.
CREATE OR REPLACE FUNCTION public.is_mentorship_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_mentorship_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mentorship_staff() TO authenticated;

-- -----------------------------------------------------------------------------
-- Section 3 — Tables (final cumulative shape, dependency order)
-- -----------------------------------------------------------------------------

-- mentor_profiles (012 base + 027/042/055/056/057/058/060/063 extensions, final shape)
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  headline text,
  bio_short text,
  avg_response_hours numeric(8, 2),
  bio_long text,
  career_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating_avg numeric(3, 2),
  sessions_count integer NOT NULL DEFAULT 0,
  expertise_sectors text[] NOT NULL DEFAULT '{}',
  years_experience smallint,
  active_workshop jsonb,
  application_message text,
  application_submitted_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  is_accepting_requests boolean NOT NULL DEFAULT true,
  max_active_mentees smallint NOT NULL DEFAULT 5,
  slug text,
  expertise_areas text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  preferred_mediums text[] NOT NULL DEFAULT '{}',
  linkedin_url text,
  nationality text,
  specializations text[] NOT NULL DEFAULT '{}',
  is_mentor_of_month boolean NOT NULL DEFAULT false,
  declined_requests_count integer NOT NULL DEFAULT 0,
  mentor_score numeric(6, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_status_check;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_status_check
  CHECK (status IN ('pending', 'pending_review', 'under_review', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_rating_avg_chk;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_rating_avg_chk
  CHECK (rating_avg IS NULL OR (rating_avg >= 0 AND rating_avg <= 5));

ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_years_experience_chk;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_years_experience_chk
  CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 60));

ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_expertise_areas_max;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_expertise_areas_max
  CHECK (cardinality(expertise_areas) <= 5);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_status ON public.mentor_profiles (status);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_accepting ON public.mentor_profiles (is_accepting_requests) WHERE status = 'approved';
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_profiles_slug ON public.mentor_profiles (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_mentor_of_month ON public.mentor_profiles (is_mentor_of_month) WHERE is_mentor_of_month = true AND status = 'approved';
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_score ON public.mentor_profiles (mentor_score DESC NULLS LAST) WHERE status = 'approved';

-- mentor_workshops (055, unchanged since)
CREATE TABLE IF NOT EXISTS public.mentor_workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  title_ar text,
  description text,
  scheduled_at timestamptz,
  capacity integer NOT NULL DEFAULT 20 CHECK (capacity > 0),
  spots_remaining integer NOT NULL DEFAULT 20 CHECK (spots_remaining >= 0),
  status public.mentor_workshop_status_enum NOT NULL DEFAULT 'draft',
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_workshops_mentor ON public.mentor_workshops (mentor_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_workshops_published ON public.mentor_workshops (scheduled_at) WHERE status = 'published';

-- mentorship_requests (055 base + 059/060 extensions, final shape; conversation_id FK added after conversations exists)
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.mentorship_request_status_enum NOT NULL DEFAULT 'pending',
  message text,
  focus_area text,
  conversation_id uuid,
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  intent_statement text,
  mentee_snapshot jsonb,
  decline_reason text,
  preferred_medium text,
  CONSTRAINT mentorship_requests_no_self_chk CHECK (mentee_id <> mentor_id)
);

ALTER TABLE public.mentorship_requests DROP CONSTRAINT IF EXISTS mentorship_requests_intent_min_len_chk;
ALTER TABLE public.mentorship_requests
  ADD CONSTRAINT mentorship_requests_intent_min_len_chk
  CHECK (intent_statement IS NULL OR char_length(trim(intent_statement)) >= 50);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_status ON public.mentorship_requests (mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee ON public.mentorship_requests (mentee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_pending_created ON public.mentorship_requests (mentor_id, created_at DESC) WHERE status = 'pending';

-- conversations (support table required by mentorship_requests.conversation_id FK and messages.conversation_id FK — 055)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_request_id uuid UNIQUE REFERENCES public.mentorship_requests (id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_mentor ON public.conversations (mentor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mentee ON public.conversations (mentee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_mentor_mentee_unique ON public.conversations (mentor_id, mentee_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_requests_conversation_id_fkey') THEN
    ALTER TABLE public.mentorship_requests
      ADD CONSTRAINT mentorship_requests_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- messages (support table — E2EE ciphertext + schedule_proposal payloads, 055 + 062)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  ciphertext text,
  nonce text,
  created_at timestamptz NOT NULL DEFAULT now(),
  message_type text NOT NULL DEFAULT 'text',
  meeting_id uuid
);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_chk;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_chk CHECK (message_type IN ('text', 'schedule_proposal'));

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_meeting ON public.messages (meeting_id) WHERE meeting_id IS NOT NULL;

-- user_encryption_keys (support table for E2EE public keys — 055)
CREATE TABLE IF NOT EXISTS public.user_encryption_keys (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  public_key text NOT NULL,
  key_version integer NOT NULL DEFAULT 1 CHECK (key_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz
);

-- mentorship_meetings (012 base + 026 redundant-but-harmless re-declare + 055/062/064/067 extensions, final shape)
CREATE TABLE IF NOT EXISTS public.mentorship_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  request_id uuid REFERENCES public.mentorship_requests (id) ON DELETE SET NULL,
  meeting_url text,
  notes text,
  duration_minutes smallint,
  medium text,
  feedback_rating smallint,
  feedback_comment text,
  feedback_submitted_at timestamptz,
  expected_end_at timestamptz,
  should_show_feedback boolean NOT NULL DEFAULT false,
  feedback_dismissed_at timestamptz
);

ALTER TABLE public.mentorship_meetings DROP CONSTRAINT IF EXISTS mentorship_meetings_status_check;
ALTER TABLE public.mentorship_meetings
  ADD CONSTRAINT mentorship_meetings_status_check
  CHECK (status IN ('pending_confirmation', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

ALTER TABLE public.mentorship_meetings DROP CONSTRAINT IF EXISTS mentorship_meetings_feedback_rating_chk;
ALTER TABLE public.mentorship_meetings
  ADD CONSTRAINT mentorship_meetings_feedback_rating_chk
  CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5));

CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_status ON public.mentorship_meetings (status);
CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_mentor_scheduled ON public.mentorship_meetings (mentor_id, scheduled_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_meeting_id_fkey') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_meeting_id_fkey
      FOREIGN KEY (meeting_id) REFERENCES public.mentorship_meetings (id) ON DELETE SET NULL;
  END IF;
END;
$$;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_payload_chk;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_payload_chk
  CHECK (
    (message_type = 'text' AND ciphertext IS NOT NULL AND nonce IS NOT NULL AND meeting_id IS NULL)
    OR (message_type = 'schedule_proposal' AND meeting_id IS NOT NULL AND ciphertext IS NULL AND nonce IS NULL)
  );

-- mentor_notification_requests (055 base + 057 extension, final shape)
CREATE TABLE IF NOT EXISTS public.mentor_notification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.mentor_notification_status_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  desired_filters jsonb
);

CREATE INDEX IF NOT EXISTS idx_mentor_notification_requests_mentor ON public.mentor_notification_requests (mentor_id, status);

-- radar_items (support/bridge table — still targeted by enqueue_mentor_pending_request_radar/process_due_radar_items, 055)
CREATE TABLE IF NOT EXISTS public.radar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL,
  reference_id uuid,
  column_name text,
  status text,
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radar_items_user_scheduled ON public.radar_items (user_id, scheduled_for) WHERE scheduled_for IS NOT NULL;

-- mentor_reviews (final reconciled shape directly — 042's original shape is fully superseded by 119;
-- since production has no mentor_reviews table at all, this goes straight to the 119 end-state rather
-- than replaying 042 then altering it)
CREATE TABLE IF NOT EXISTS public.mentor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  meeting_id uuid NOT NULL REFERENCES public.mentorship_meetings (id) ON DELETE CASCADE,
  visibility public.review_visibility_enum NOT NULL DEFAULT 'private'
);

ALTER TABLE public.mentor_reviews DROP CONSTRAINT IF EXISTS mentor_reviews_meeting_reviewer_unique;
ALTER TABLE public.mentor_reviews ADD CONSTRAINT mentor_reviews_meeting_reviewer_unique UNIQUE (meeting_id, reviewer_id);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_created ON public.mentor_reviews (mentor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_meeting ON public.mentor_reviews (meeting_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_public_mentor_created ON public.mentor_reviews (mentor_id, created_at DESC) WHERE visibility IN ('public_named', 'public_anonymous');

-- -----------------------------------------------------------------------------
-- Section 4 — RLS enable + final policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_notification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;

-- mentor_profiles: select policies from 055 (unchanged); insert/update from 056 (final, supersedes 055)
DROP POLICY IF EXISTS mentor_profiles_select_public ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_public ON public.mentor_profiles FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_profiles_insert_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_insert_own ON public.mentor_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending_review');

DROP POLICY IF EXISTS mentor_profiles_update_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_update_own ON public.mentor_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      status = (SELECT mp.status FROM public.mentor_profiles mp WHERE mp.user_id = auth.uid())
      OR (status = 'pending_review' AND (SELECT mp.status FROM public.mentor_profiles mp WHERE mp.user_id = auth.uid()) = 'rejected')
    )
  );

DROP POLICY IF EXISTS mentor_profiles_update_staff ON public.mentor_profiles;
CREATE POLICY mentor_profiles_update_staff ON public.mentor_profiles FOR UPDATE TO authenticated
  USING (public.is_mentorship_staff()) WITH CHECK (public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_profiles_select_staff ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_staff ON public.mentor_profiles FOR SELECT TO authenticated
  USING (public.is_mentorship_staff());

-- mentor_workshops (055, unchanged)
DROP POLICY IF EXISTS mentor_workshops_select ON public.mentor_workshops;
CREATE POLICY mentor_workshops_select ON public.mentor_workshops FOR SELECT TO anon, authenticated
  USING (status = 'published' OR mentor_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_workshops_mutate_own ON public.mentor_workshops;
CREATE POLICY mentor_workshops_mutate_own ON public.mentor_workshops FOR ALL TO authenticated
  USING (mentor_id = auth.uid()) WITH CHECK (mentor_id = auth.uid());

DROP POLICY IF EXISTS mentor_workshops_staff ON public.mentor_workshops;
CREATE POLICY mentor_workshops_staff ON public.mentor_workshops FOR ALL TO authenticated
  USING (public.is_mentorship_staff()) WITH CHECK (public.is_mentorship_staff());

-- mentorship_requests (055, unchanged)
DROP POLICY IF EXISTS mentorship_requests_select_parties ON public.mentorship_requests;
CREATE POLICY mentorship_requests_select_parties ON public.mentorship_requests FOR SELECT TO authenticated
  USING (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentorship_requests_insert_mentee ON public.mentorship_requests;
CREATE POLICY mentorship_requests_insert_mentee ON public.mentorship_requests FOR INSERT TO authenticated
  WITH CHECK (mentee_id = auth.uid());

DROP POLICY IF EXISTS mentorship_requests_update_parties ON public.mentorship_requests;
CREATE POLICY mentorship_requests_update_parties ON public.mentorship_requests FOR UPDATE TO authenticated
  USING (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_mentorship_staff())
  WITH CHECK (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_mentorship_staff());

-- conversations (055)
DROP POLICY IF EXISTS conversations_select_parties ON public.conversations;
CREATE POLICY conversations_select_parties ON public.conversations FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS conversations_update_parties ON public.conversations;
CREATE POLICY conversations_update_parties ON public.conversations FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid()) WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- messages (055)
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid()))
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid()))
  );

-- user_encryption_keys (055 + 061)
DROP POLICY IF EXISTS user_encryption_keys_own ON public.user_encryption_keys;
CREATE POLICY user_encryption_keys_own ON public.user_encryption_keys FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_encryption_keys_staff_select ON public.user_encryption_keys;
CREATE POLICY user_encryption_keys_staff_select ON public.user_encryption_keys FOR SELECT TO authenticated
  USING (public.is_mentorship_staff());

DROP POLICY IF EXISTS user_encryption_keys_select_public ON public.user_encryption_keys;
CREATE POLICY user_encryption_keys_select_public ON public.user_encryption_keys FOR SELECT TO authenticated
  USING (true);

-- mentorship_meetings (055, unchanged)
DROP POLICY IF EXISTS mentorship_meetings_select_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_select_parties ON public.mentorship_meetings FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentorship_meetings_update_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_update_parties ON public.mentorship_meetings FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff())
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentorship_meetings_insert_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_insert_parties ON public.mentorship_meetings FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- mentor_notification_requests (055, unchanged)
DROP POLICY IF EXISTS mentor_notification_requests_select ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_select ON public.mentor_notification_requests FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR requester_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_notification_requests_insert ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_insert ON public.mentor_notification_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS mentor_notification_requests_update_mentor ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_update_mentor ON public.mentor_notification_requests FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR public.is_mentorship_staff()) WITH CHECK (mentor_id = auth.uid() OR public.is_mentorship_staff());

-- radar_items (055, unchanged)
DROP POLICY IF EXISTS radar_items_select_own ON public.radar_items;
CREATE POLICY radar_items_select_own ON public.radar_items FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS radar_items_mutate_own ON public.radar_items;
CREATE POLICY radar_items_mutate_own ON public.radar_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS radar_items_staff ON public.radar_items;
CREATE POLICY radar_items_staff ON public.radar_items FOR ALL TO authenticated
  USING (public.is_mentorship_staff()) WITH CHECK (public.is_mentorship_staff());

-- mentor_reviews (final policy set from 119 — replaces 042's public-read-all entirely)
DROP POLICY IF EXISTS mentor_reviews_select_approved_mentors ON public.mentor_reviews;
DROP POLICY IF EXISTS mentor_reviews_insert_mentee ON public.mentor_reviews;
CREATE POLICY mentor_reviews_insert_mentee ON public.mentor_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.mentorship_meetings mm
      WHERE mm.id = meeting_id AND mm.status = 'completed' AND mm.mentee_id = auth.uid() AND mm.mentor_id = mentor_id
    )
  );

DROP POLICY IF EXISTS mentor_reviews_select_parties ON public.mentor_reviews;
CREATE POLICY mentor_reviews_select_parties ON public.mentor_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR mentor_id = auth.uid());

DROP POLICY IF EXISTS mentor_reviews_select_public ON public.mentor_reviews;
CREATE POLICY mentor_reviews_select_public ON public.mentor_reviews FOR SELECT TO anon, authenticated
  USING (
    visibility IN ('public_named', 'public_anonymous')
    AND EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.user_id = mentor_reviews.mentor_id AND mp.status = 'approved')
  );

DROP POLICY IF EXISTS mentor_reviews_update_reviewer ON public.mentor_reviews;
CREATE POLICY mentor_reviews_update_reviewer ON public.mentor_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS mentor_reviews_select_staff ON public.mentor_reviews;
CREATE POLICY mentor_reviews_select_staff ON public.mentor_reviews FOR SELECT TO authenticated
  USING (public.is_mentorship_staff() OR public.is_privileged_staff());

-- -----------------------------------------------------------------------------
-- Section 5 — Privilege lockdown (ADDED beyond literal tracked SQL — see preflight
-- finding on default ACLs; matches the already-applied 11-table RLS-hardening
-- pattern; RLS alone cannot gate TRUNCATE, only an explicit REVOKE can)
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.mentor_profiles FROM anon, authenticated;
GRANT SELECT ON public.mentor_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.mentor_profiles TO authenticated;

REVOKE ALL ON public.mentor_workshops FROM anon, authenticated;
GRANT SELECT ON public.mentor_workshops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mentor_workshops TO authenticated;

REVOKE ALL ON public.mentorship_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentorship_requests TO authenticated;

REVOKE ALL ON public.conversations FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.conversations TO authenticated;

REVOKE ALL ON public.messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

REVOKE ALL ON public.user_encryption_keys FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_encryption_keys TO authenticated;

REVOKE ALL ON public.mentorship_meetings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentorship_meetings TO authenticated;

REVOKE ALL ON public.mentor_notification_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentor_notification_requests TO authenticated;

REVOKE ALL ON public.radar_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_items TO authenticated;

REVOKE ALL ON public.mentor_reviews FROM anon, authenticated;
GRANT SELECT ON public.mentor_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.mentor_reviews TO authenticated;

-- -----------------------------------------------------------------------------
-- Section 6 — Trigger functions + triggers (final set)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_conversation_on_request_accepted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_conversation_id uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM 'accepted' AND NEW.status = 'accepted' AND NEW.conversation_id IS NULL THEN
    INSERT INTO public.conversations (mentorship_request_id, mentor_id, mentee_id)
    VALUES (NEW.id, NEW.mentor_id, NEW.mentee_id) RETURNING id INTO v_conversation_id;
    NEW.conversation_id := v_conversation_id;
    NEW.responded_at := coalesce(NEW.responded_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_requests_create_conversation ON public.mentorship_requests;
CREATE TRIGGER trg_mentorship_requests_create_conversation
  BEFORE UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_conversation_on_request_accepted();

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_touch_conversation ON public.messages;
CREATE TRIGGER trg_messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

CREATE OR REPLACE FUNCTION public.sync_mentor_sessions_on_meeting_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.mentor_profiles SET sessions_count = sessions_count + 1, updated_at = now() WHERE user_id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_sync_sessions ON public.mentorship_meetings;
CREATE TRIGGER trg_mentorship_meetings_sync_sessions
  AFTER UPDATE OF status ON public.mentorship_meetings
  FOR EACH ROW EXECUTE FUNCTION public.sync_mentor_sessions_on_meeting_complete();

-- DEVIATION 2 applied here: award_user_badge call guarded (no badges system in production yet)
CREATE OR REPLACE FUNCTION public.award_mentor_verified_on_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved' THEN
    BEGIN
      PERFORM public.award_user_badge(NEW.user_id, 'mentor_verified', jsonb_build_object('mentor_profile', NEW.user_id));
    EXCEPTION WHEN undefined_function THEN
      NULL; -- badges system not present in production yet; safe no-op guard, not a redesign
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_profiles_award_verified ON public.mentor_profiles;
CREATE TRIGGER trg_mentor_profiles_award_verified
  AFTER UPDATE OF status ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.award_mentor_verified_on_approval();

CREATE OR REPLACE FUNCTION public.set_mentorship_request_expiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + interval '14 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_requests_set_expiry ON public.mentorship_requests;
CREATE TRIGGER trg_mentorship_requests_set_expiry
  BEFORE INSERT ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_mentorship_request_expiry();

CREATE OR REPLACE FUNCTION public.update_mentor_stats_on_meeting()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg numeric(3, 2);
BEGIN
  IF NEW.feedback_rating IS NULL THEN RETURN NEW; END IF;
  IF OLD.feedback_rating IS NOT DISTINCT FROM NEW.feedback_rating THEN RETURN NEW; END IF;
  SELECT round(AVG(mm.feedback_rating)::numeric, 2) INTO v_avg
  FROM public.mentorship_meetings mm WHERE mm.mentor_id = NEW.mentor_id AND mm.feedback_rating IS NOT NULL;
  UPDATE public.mentor_profiles SET rating_avg = v_avg, updated_at = now() WHERE user_id = NEW.mentor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_update_stats ON public.mentorship_meetings;
CREATE TRIGGER trg_mentorship_meetings_update_stats
  AFTER UPDATE OF feedback_rating ON public.mentorship_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_stats_on_meeting();

CREATE OR REPLACE FUNCTION public.sync_mentor_active_workshop(p_mentor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_workshop record;
BEGIN
  SELECT id, title, title_ar, scheduled_at, spots_remaining, external_url INTO v_workshop
  FROM public.mentor_workshops
  WHERE mentor_id = p_mentor_id AND status = 'published' AND scheduled_at IS NOT NULL AND scheduled_at > now()
  ORDER BY scheduled_at ASC LIMIT 1;

  IF NOT FOUND THEN
    UPDATE public.mentor_profiles SET active_workshop = NULL, updated_at = now() WHERE user_id = p_mentor_id;
    RETURN;
  END IF;

  UPDATE public.mentor_profiles
  SET active_workshop = jsonb_build_object(
      'title', v_workshop.title, 'title_ar', v_workshop.title_ar, 'workshop_date', v_workshop.scheduled_at,
      'scheduled_at', v_workshop.scheduled_at, 'is_active', true,
      'spots_remaining', v_workshop.spots_remaining, 'url', v_workshop.external_url
    ), updated_at = now()
  WHERE user_id = p_mentor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_active_workshop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_mentor_active_workshop(coalesce(NEW.mentor_id, OLD.mentor_id));
  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_workshops_sync_active ON public.mentor_workshops;
CREATE TRIGGER trg_mentor_workshops_sync_active
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_workshops
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_active_workshop();

CREATE OR REPLACE FUNCTION public.validate_mentor_review_session()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_meeting record;
BEGIN
  SELECT id, mentor_id, mentee_id, status INTO v_meeting FROM public.mentorship_meetings WHERE id = NEW.meeting_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'mentor_review_requires_completed_meeting' USING ERRCODE = '23503'; END IF;
  IF v_meeting.status IS DISTINCT FROM 'completed' THEN RAISE EXCEPTION 'mentor_review_requires_completed_meeting' USING ERRCODE = '23514'; END IF;
  IF NEW.mentor_id IS DISTINCT FROM v_meeting.mentor_id THEN RAISE EXCEPTION 'mentor_review_mentor_mismatch' USING ERRCODE = '23514'; END IF;
  IF NEW.reviewer_id IS DISTINCT FROM v_meeting.mentee_id THEN RAISE EXCEPTION 'mentor_review_reviewer_must_be_mentee' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_reviews_validate_session ON public.mentor_reviews;
CREATE TRIGGER trg_mentor_reviews_validate_session
  BEFORE INSERT OR UPDATE OF meeting_id, mentor_id, reviewer_id ON public.mentor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_mentor_review_session();

CREATE OR REPLACE FUNCTION public.sync_mentorship_request_responded_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'declined') AND NEW.responded_at IS NULL THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_requests_sync_responded_at ON public.mentorship_requests;
CREATE TRIGGER trg_mentorship_requests_sync_responded_at
  BEFORE UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_mentorship_request_responded_at();

-- DEVIATION 2 applied here too (0295)
CREATE OR REPLACE FUNCTION public.award_mentorship_active_badge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    BEGIN
      PERFORM public.award_user_badge(NEW.mentor_id, 'mentorship_active', jsonb_build_object('meeting_id', NEW.id, 'role', 'mentor'));
      PERFORM public.award_user_badge(NEW.mentee_id, 'mentorship_graduate', jsonb_build_object('meeting_id', NEW.id, 'role', 'mentee'));
    EXCEPTION WHEN undefined_function THEN
      NULL; -- badges system not present in production yet; safe no-op guard, not a redesign
    END;
    NEW.completed_at := coalesce(NEW.completed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_award_badges ON public.mentorship_meetings;
CREATE TRIGGER trg_mentorship_meetings_award_badges
  BEFORE UPDATE OF status ON public.mentorship_meetings
  FOR EACH ROW EXECUTE FUNCTION public.award_mentorship_active_badge();

-- -----------------------------------------------------------------------------
-- Section 7 — Maintenance / cron functions + jobs (final versions)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_mentorship_requests()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.mentorship_requests SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.expire_stale_mentorship_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_mentorship_requests() TO service_role;

CREATE OR REPLACE FUNCTION public.process_due_radar_items()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.radar_items SET status = coalesce(status, 'processed')
  WHERE scheduled_for IS NOT NULL AND scheduled_for <= now() AND coalesce(status, 'pending') = 'pending';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.process_due_radar_items() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_due_radar_items() TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_mentor_pending_request_radar()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0; v_row record;
BEGIN
  FOR v_row IN
    SELECT mr.mentor_id, count(*)::integer AS pending_count
    FROM public.mentorship_requests mr WHERE mr.status = 'pending' GROUP BY mr.mentor_id HAVING count(*) > 0
  LOOP
    INSERT INTO public.radar_items (user_id, type, reference_id, status, scheduled_for)
    SELECT v_row.mentor_id, 'mentor_pending_requests', NULL, 'pending', now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.radar_items ri
      WHERE ri.user_id = v_row.mentor_id AND ri.type = 'mentor_pending_requests'
        AND coalesce(ri.status, 'pending') = 'pending' AND ri.created_at > now() - interval '1 day'
    );
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_mentor_pending_request_radar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_mentor_pending_request_radar() TO service_role;

CREATE OR REPLACE FUNCTION public.compute_mentor_scores()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.mentor_profiles mp
  SET mentor_score = round((
      coalesce(mp.rating_avg, 0) * 0.5
      + least(coalesce(mp.sessions_count, 0), 50)::numeric / 50 * 3 * 0.3
      + CASE WHEN mp.avg_response_hours IS NULL THEN 0 ELSE greatest(0, 5 - (mp.avg_response_hours / 24.0)) * 0.2 END
    )::numeric, 2),
    updated_at = now()
  WHERE mp.status = 'approved';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.compute_mentor_scores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_mentor_scores() TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_mentor_of_month()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0;
BEGIN
  PERFORM public.compute_mentor_scores();
  UPDATE public.mentor_profiles SET is_mentor_of_month = false WHERE is_mentor_of_month = true;
  UPDATE public.mentor_profiles mp
  SET is_mentor_of_month = true
  FROM (
    SELECT user_id FROM public.mentor_profiles WHERE status = 'approved' AND mentor_score IS NOT NULL
    ORDER BY mentor_score DESC NULLS LAST, sessions_count DESC, rating_avg DESC NULLS LAST LIMIT 3
  ) top
  WHERE mp.user_id = top.user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_mentor_of_month() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_mentor_of_month() TO service_role;

-- Final tracked version (067): dismiss/snooze aware
CREATE OR REPLACE FUNCTION public.update_feedback_flags()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.mentorship_meetings
  SET expected_end_at = scheduled_at + make_interval(mins => coalesce(duration_minutes, 0))
  WHERE expected_end_at IS NULL AND scheduled_at IS NOT NULL AND status IN ('confirmed', 'completed');

  UPDATE public.mentorship_meetings
  SET should_show_feedback = true
  WHERE status = 'confirmed' AND feedback_rating IS NULL AND expected_end_at IS NOT NULL
    AND now() >= expected_end_at + interval '2 hours' AND should_show_feedback IS DISTINCT FROM true
    AND (feedback_dismissed_at IS NULL OR feedback_dismissed_at < now() - interval '24 hours');

  UPDATE public.mentorship_meetings
  SET should_show_feedback = false
  WHERE (
      feedback_rating IS NOT NULL
      OR status NOT IN ('confirmed', 'completed')
      OR (expected_end_at IS NOT NULL AND now() < expected_end_at + interval '2 hours')
      OR (feedback_dismissed_at IS NOT NULL AND feedback_dismissed_at >= now() - interval '24 hours')
    )
    AND should_show_feedback IS TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.update_feedback_flags() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_feedback_flags() TO service_role;

-- Final tracked version (064): intentionally a deprecated no-op; radar_items bridge not used by real Radar
CREATE OR REPLACE FUNCTION public.sync_meeting_radar_on_confirm(p_meeting_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NULL; -- Deprecated per tracked migration 064; kept only for RPC-call compatibility.
END;
$$;
REVOKE ALL ON FUNCTION public.sync_meeting_radar_on_confirm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_meeting_radar_on_confirm(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_mentor_response_stats(p_mentor_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_allowed boolean; v_avg_hours numeric; v_acceptance_pct numeric; v_completed integer;
BEGIN
  SELECT
    EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.user_id = p_mentor_id AND mp.status = 'approved')
    OR auth.uid() = p_mentor_id OR public.is_mentorship_staff() OR public.is_privileged_staff()
  INTO v_allowed;

  IF NOT coalesce(v_allowed, false) THEN
    RETURN jsonb_build_object('avg_response_hours', NULL, 'acceptance_rate_pct', NULL, 'completed_sessions', NULL);
  END IF;

  SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE round(AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600.0)::numeric, 2) END
  INTO v_avg_hours
  FROM public.mentorship_requests WHERE mentor_id = p_mentor_id AND status IN ('accepted', 'declined') AND responded_at IS NOT NULL;

  SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE round(100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / COUNT(*)::numeric, 1) END
  INTO v_acceptance_pct
  FROM public.mentorship_requests WHERE mentor_id = p_mentor_id AND status IN ('accepted', 'declined');

  SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE COUNT(*)::integer END
  INTO v_completed
  FROM public.mentorship_meetings WHERE mentor_id = p_mentor_id AND status = 'completed';

  RETURN jsonb_build_object('avg_response_hours', v_avg_hours, 'acceptance_rate_pct', v_acceptance_pct, 'completed_sessions', v_completed);
END;
$$;
REVOKE ALL ON FUNCTION public.get_mentor_response_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mentor_response_stats(uuid) TO anon, authenticated, service_role;

DO $$
DECLARE v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('expire-mentorship-requests', 'process-radar-items', 'enqueue-mentor-pending-radar', 'refresh-mentor-of-month', 'feedback-flags')
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule('expire-mentorship-requests', '15 3 * * *', $$ SELECT public.expire_stale_mentorship_requests(); $$);
SELECT cron.schedule('process-radar-items', '*/5 * * * *', $$ SELECT public.process_due_radar_items(); $$);
SELECT cron.schedule('enqueue-mentor-pending-radar', '0 8 * * *', $$ SELECT public.enqueue_mentor_pending_request_radar(); $$);
SELECT cron.schedule('refresh-mentor-of-month', '0 6 1 * *', $$ SELECT public.refresh_mentor_of_month(); $$);
SELECT cron.schedule('feedback-flags', '*/30 * * * *', $$ SELECT public.update_feedback_flags(); $$);

-- -----------------------------------------------------------------------------
-- Section 8 — Realtime
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mentorship_meetings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_meetings;
  END IF;
END;
$$;