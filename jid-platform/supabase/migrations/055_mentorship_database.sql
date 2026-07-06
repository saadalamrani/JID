-- Mentorship Module — Section 5.1 (tables), 5.2 (triggers/cron), 6 (RLS)
-- Reconciles mentor_profiles + mentorship_meetings from Profile sprint stubs.

-- ---------------------------------------------------------------------------
-- Staff helper (Section 6 — staff + super_admin only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_mentorship_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_mentorship_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mentorship_staff() TO authenticated;

-- ---------------------------------------------------------------------------
-- ENUMs (Section 5.1)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.mentor_workshop_status_enum AS ENUM (
    'draft',
    'published',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.mentorship_request_status_enum AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.mentor_notification_status_enum AS ENUM (
    'pending',
    'sent',
    'dismissed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- mentor_profiles — RECONCILED (027 / 042) + mentorship application fields
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  headline text,
  bio_short text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS avg_response_hours numeric(8, 2),
  ADD COLUMN IF NOT EXISTS bio_long text,
  ADD COLUMN IF NOT EXISTS career_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3, 2),
  ADD COLUMN IF NOT EXISTS sessions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expertise_sectors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience smallint,
  ADD COLUMN IF NOT EXISTS active_workshop jsonb,
  ADD COLUMN IF NOT EXISTS application_message text,
  ADD COLUMN IF NOT EXISTS application_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS is_accepting_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_active_mentees smallint NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_status ON public.mentor_profiles (status);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_accepting
  ON public.mentor_profiles (is_accepting_requests)
  WHERE status = 'approved';

DO $$
BEGIN
  ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END;
$$;

ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_status_check;

ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended'));

-- ---------------------------------------------------------------------------
-- mentor_workshops — NEW
-- ---------------------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS idx_mentor_workshops_mentor
  ON public.mentor_workshops (mentor_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_workshops_published
  ON public.mentor_workshops (scheduled_at)
  WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- mentorship_requests — NEW
-- ---------------------------------------------------------------------------

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
  CONSTRAINT mentorship_requests_no_self_chk CHECK (mentee_id <> mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_status
  ON public.mentorship_requests (mentor_id, status);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee
  ON public.mentorship_requests (mentee_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- conversations — NEW
-- ---------------------------------------------------------------------------

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_requests_conversation_id_fkey'
  ) THEN
    ALTER TABLE public.mentorship_requests
      ADD CONSTRAINT mentorship_requests_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- messages — NEW (E2EE ciphertext stored server-side)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  ciphertext text NOT NULL,
  nonce text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- user_encryption_keys — NEW
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_encryption_keys (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  public_key text NOT NULL,
  key_version integer NOT NULL DEFAULT 1 CHECK (key_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz
);

-- ---------------------------------------------------------------------------
-- mentorship_meetings — RECONCILED (026 stub)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mentorship_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentorship_meetings
  ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.mentorship_requests (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS duration_minutes smallint;

CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_status ON public.mentorship_meetings (status);
CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_mentor_scheduled
  ON public.mentorship_meetings (mentor_id, scheduled_at);

-- ---------------------------------------------------------------------------
-- mentor_notification_requests — NEW
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mentor_notification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.mentor_notification_status_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mentor_notification_requests_mentor
  ON public.mentor_notification_requests (mentor_id, status);

-- ---------------------------------------------------------------------------
-- radar_items — BRIDGE TABLE (minimal until Radar Master Prompt)
-- ---------------------------------------------------------------------------

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
-- BRIDGE TABLE: minimal schema, MUST be reconciled when Radar Master Prompt is executed

CREATE INDEX IF NOT EXISTS idx_radar_items_user_scheduled
  ON public.radar_items (user_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Section 6 — RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_notification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_items ENABLE ROW LEVEL SECURITY;

-- mentor_profiles
DROP POLICY IF EXISTS mentor_profiles_select_public ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_public
  ON public.mentor_profiles FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_profiles_insert_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_insert_own
  ON public.mentor_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mentor_profiles_update_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_update_own
  ON public.mentor_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mentor_profiles_update_staff ON public.mentor_profiles;
CREATE POLICY mentor_profiles_update_staff
  ON public.mentor_profiles FOR UPDATE TO authenticated
  USING (public.is_mentorship_staff())
  WITH CHECK (public.is_mentorship_staff());

DROP POLICY IF EXISTS mentor_profiles_select_staff ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_staff
  ON public.mentor_profiles FOR SELECT TO authenticated
  USING (public.is_mentorship_staff());

-- mentor_workshops
DROP POLICY IF EXISTS mentor_workshops_select ON public.mentor_workshops;
CREATE POLICY mentor_workshops_select
  ON public.mentor_workshops FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR mentor_id = auth.uid()
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS mentor_workshops_mutate_own ON public.mentor_workshops;
CREATE POLICY mentor_workshops_mutate_own
  ON public.mentor_workshops FOR ALL TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

DROP POLICY IF EXISTS mentor_workshops_staff ON public.mentor_workshops;
CREATE POLICY mentor_workshops_staff
  ON public.mentor_workshops FOR ALL TO authenticated
  USING (public.is_mentorship_staff())
  WITH CHECK (public.is_mentorship_staff());

-- mentorship_requests
DROP POLICY IF EXISTS mentorship_requests_select_parties ON public.mentorship_requests;
CREATE POLICY mentorship_requests_select_parties
  ON public.mentorship_requests FOR SELECT TO authenticated
  USING (
    mentee_id = auth.uid()
    OR mentor_id = auth.uid()
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS mentorship_requests_insert_mentee ON public.mentorship_requests;
CREATE POLICY mentorship_requests_insert_mentee
  ON public.mentorship_requests FOR INSERT TO authenticated
  WITH CHECK (mentee_id = auth.uid());

DROP POLICY IF EXISTS mentorship_requests_update_parties ON public.mentorship_requests;
CREATE POLICY mentorship_requests_update_parties
  ON public.mentorship_requests FOR UPDATE TO authenticated
  USING (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_mentorship_staff())
  WITH CHECK (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_mentorship_staff());

-- conversations
DROP POLICY IF EXISTS conversations_select_parties ON public.conversations;
CREATE POLICY conversations_select_parties
  ON public.conversations FOR SELECT TO authenticated
  USING (
    mentor_id = auth.uid()
    OR mentee_id = auth.uid()
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS conversations_update_parties ON public.conversations;
CREATE POLICY conversations_update_parties
  ON public.conversations FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- messages
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid())
    )
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.mentor_id = auth.uid() OR c.mentee_id = auth.uid())
    )
  );

-- user_encryption_keys
DROP POLICY IF EXISTS user_encryption_keys_own ON public.user_encryption_keys;
CREATE POLICY user_encryption_keys_own
  ON public.user_encryption_keys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_encryption_keys_staff_select ON public.user_encryption_keys;
CREATE POLICY user_encryption_keys_staff_select
  ON public.user_encryption_keys FOR SELECT TO authenticated
  USING (public.is_mentorship_staff());

-- mentorship_meetings
DROP POLICY IF EXISTS mentorship_meetings_select_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_select_parties
  ON public.mentorship_meetings FOR SELECT TO authenticated
  USING (
    mentor_id = auth.uid()
    OR mentee_id = auth.uid()
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS mentorship_meetings_update_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_update_parties
  ON public.mentorship_meetings FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff())
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS mentorship_meetings_insert_parties ON public.mentorship_meetings;
CREATE POLICY mentorship_meetings_insert_parties
  ON public.mentorship_meetings FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- mentor_notification_requests
DROP POLICY IF EXISTS mentor_notification_requests_select ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_select
  ON public.mentor_notification_requests FOR SELECT TO authenticated
  USING (
    mentor_id = auth.uid()
    OR requester_id = auth.uid()
    OR public.is_mentorship_staff()
  );

DROP POLICY IF EXISTS mentor_notification_requests_insert ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_insert
  ON public.mentor_notification_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS mentor_notification_requests_update_mentor ON public.mentor_notification_requests;
CREATE POLICY mentor_notification_requests_update_mentor
  ON public.mentor_notification_requests FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR public.is_mentorship_staff())
  WITH CHECK (mentor_id = auth.uid() OR public.is_mentorship_staff());

-- radar_items
DROP POLICY IF EXISTS radar_items_select_own ON public.radar_items;
CREATE POLICY radar_items_select_own
  ON public.radar_items FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_mentorship_staff());

DROP POLICY IF EXISTS radar_items_mutate_own ON public.radar_items;
CREATE POLICY radar_items_mutate_own
  ON public.radar_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS radar_items_staff ON public.radar_items;
CREATE POLICY radar_items_staff
  ON public.radar_items FOR ALL TO authenticated
  USING (public.is_mentorship_staff())
  WITH CHECK (public.is_mentorship_staff());

-- ---------------------------------------------------------------------------
-- Section 5.2 — Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_conversation_on_request_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM 'accepted' AND NEW.status = 'accepted' AND NEW.conversation_id IS NULL THEN
    INSERT INTO public.conversations (mentorship_request_id, mentor_id, mentee_id)
    VALUES (NEW.id, NEW.mentor_id, NEW.mentee_id)
    RETURNING id INTO v_conversation_id;

    NEW.conversation_id := v_conversation_id;
    NEW.responded_at := coalesce(NEW.responded_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_requests_create_conversation ON public.mentorship_requests;

CREATE TRIGGER trg_mentorship_requests_create_conversation
  BEFORE UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_on_request_accepted();

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_touch_conversation ON public.messages;

CREATE TRIGGER trg_messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_on_message();

CREATE OR REPLACE FUNCTION public.sync_mentor_sessions_on_meeting_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.mentor_profiles
    SET
      sessions_count = sessions_count + 1,
      updated_at = now()
    WHERE user_id = NEW.mentor_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_sync_sessions ON public.mentorship_meetings;

CREATE TRIGGER trg_mentorship_meetings_sync_sessions
  AFTER UPDATE OF status ON public.mentorship_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mentor_sessions_on_meeting_complete();

CREATE OR REPLACE FUNCTION public.award_mentor_verified_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved' THEN
    PERFORM public.award_user_badge(
      NEW.user_id,
      'mentor_verified',
      jsonb_build_object('mentor_profile', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_profiles_award_verified ON public.mentor_profiles;

CREATE TRIGGER trg_mentor_profiles_award_verified
  AFTER UPDATE OF status ON public.mentor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_mentor_verified_on_approval();

CREATE OR REPLACE FUNCTION public.set_mentorship_request_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mentorship_request_expiry();

-- ---------------------------------------------------------------------------
-- Section 5.2 — Maintenance functions + pg_cron
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_mentorship_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.mentorship_requests
  SET
    status = 'expired',
    updated_at = now()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_mentorship_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_mentorship_requests() TO service_role;

CREATE OR REPLACE FUNCTION public.process_due_radar_items()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.radar_items
  SET status = coalesce(status, 'processed')
  WHERE scheduled_for IS NOT NULL
    AND scheduled_for <= now()
    AND coalesce(status, 'pending') = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.process_due_radar_items() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_due_radar_items() TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_mentor_pending_request_radar()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_row record;
BEGIN
  FOR v_row IN
    SELECT mr.mentor_id, count(*)::integer AS pending_count
    FROM public.mentorship_requests mr
    WHERE mr.status = 'pending'
    GROUP BY mr.mentor_id
    HAVING count(*) > 0
  LOOP
    INSERT INTO public.radar_items (user_id, type, reference_id, status, scheduled_for)
    SELECT
      v_row.mentor_id,
      'mentor_pending_requests',
      NULL,
      'pending',
      now()
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.radar_items ri
      WHERE ri.user_id = v_row.mentor_id
        AND ri.type = 'mentor_pending_requests'
        AND coalesce(ri.status, 'pending') = 'pending'
        AND ri.created_at > now() - interval '1 day'
    );

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_mentor_pending_request_radar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_mentor_pending_request_radar() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'expire-mentorship-requests',
      'process-radar-items',
      'enqueue-mentor-pending-radar'
    )
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'expire-mentorship-requests',
  '15 3 * * *',
  $$ SELECT public.expire_stale_mentorship_requests(); $$
);

SELECT cron.schedule(
  'process-radar-items',
  '*/5 * * * *',
  $$ SELECT public.process_due_radar_items(); $$
);

SELECT cron.schedule(
  'enqueue-mentor-pending-radar',
  '0 8 * * *',
  $$ SELECT public.enqueue_mentor_pending_request_radar(); $$
);

-- Realtime: conversations + messages for live chat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;
