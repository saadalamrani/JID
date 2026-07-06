-- Sections 4.12 / 4.13 / 4.14 — Smart Scheduling + Radar sync

-- ---------------------------------------------------------------------------
-- messages: typed payloads (text = E2EE, schedule_proposal = operational)
-- Design: nullable ciphertext/nonce for schedule_proposal; meeting data lives
-- on mentorship_meetings and is joined by meeting_id (not stored in ciphertext).
-- ---------------------------------------------------------------------------

ALTER TABLE public.messages
  ALTER COLUMN ciphertext DROP NOT NULL,
  ALTER COLUMN nonce DROP NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS meeting_id uuid REFERENCES public.mentorship_meetings (id) ON DELETE SET NULL;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_chk;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_chk
  CHECK (message_type IN ('text', 'schedule_proposal'));

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_payload_chk;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_payload_chk
  CHECK (
    (
      message_type = 'text'
      AND ciphertext IS NOT NULL
      AND nonce IS NOT NULL
      AND meeting_id IS NULL
    )
    OR (
      message_type = 'schedule_proposal'
      AND meeting_id IS NOT NULL
      AND ciphertext IS NULL
      AND nonce IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_meeting ON public.messages (meeting_id)
  WHERE meeting_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_meeting_id_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_meeting_id_fkey
      FOREIGN KEY (meeting_id) REFERENCES public.mentorship_meetings (id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- mentorship_meetings: pending_confirmation + feedback fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.mentorship_meetings
  ADD COLUMN IF NOT EXISTS medium text,
  ADD COLUMN IF NOT EXISTS feedback_rating smallint,
  ADD COLUMN IF NOT EXISTS feedback_comment text,
  ADD COLUMN IF NOT EXISTS feedback_submitted_at timestamptz;

ALTER TABLE public.mentorship_meetings DROP CONSTRAINT IF EXISTS mentorship_meetings_status_check;
ALTER TABLE public.mentorship_meetings
  ADD CONSTRAINT mentorship_meetings_status_check
  CHECK (
    status IN (
      'pending_confirmation',
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    )
  );

ALTER TABLE public.mentorship_meetings DROP CONSTRAINT IF EXISTS mentorship_meetings_feedback_rating_chk;
ALTER TABLE public.mentorship_meetings
  ADD CONSTRAINT mentorship_meetings_feedback_rating_chk
  CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5));

-- ---------------------------------------------------------------------------
-- Day 1 — update mentor rating when meeting feedback is submitted
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_mentor_stats_on_meeting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric(3, 2);
BEGIN
  IF NEW.feedback_rating IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.feedback_rating IS NOT DISTINCT FROM NEW.feedback_rating THEN
    RETURN NEW;
  END IF;

  SELECT round(AVG(mm.feedback_rating)::numeric, 2)
  INTO v_avg
  FROM public.mentorship_meetings mm
  WHERE mm.mentor_id = NEW.mentor_id
    AND mm.feedback_rating IS NOT NULL;

  UPDATE public.mentor_profiles
  SET
    rating_avg = v_avg,
    updated_at = now()
  WHERE user_id = NEW.mentor_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_update_stats ON public.mentorship_meetings;

CREATE TRIGGER trg_mentorship_meetings_update_stats
  AFTER UPDATE OF feedback_rating ON public.mentorship_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_stats_on_meeting();

-- Section 4.13 — Radar bridge rows on meeting confirm (SECURITY DEFINER for cross-user inserts)
CREATE OR REPLACE FUNCTION public.sync_meeting_radar_on_confirm(p_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meeting record;
  v_feedback_at timestamptz;
BEGIN
  SELECT mentor_id, mentee_id, scheduled_at, duration_minutes, status
  INTO v_meeting
  FROM public.mentorship_meetings
  WHERE id = p_meeting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'meeting_not_found';
  END IF;

  IF v_meeting.mentee_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_meeting.status <> 'confirmed' THEN
    RAISE EXCEPTION 'meeting_not_confirmed';
  END IF;

  v_feedback_at := v_meeting.scheduled_at
    + make_interval(mins => coalesce(v_meeting.duration_minutes, 0))
    + interval '2 hours';

  -- TODO: verify compatibility when Radar module is built
  INSERT INTO public.radar_items (user_id, type, reference_id, status, scheduled_for)
  VALUES
    (v_meeting.mentee_id, 'mentorship_meeting', p_meeting_id, 'pending', v_meeting.scheduled_at),
    (v_meeting.mentee_id, 'meeting_feedback', p_meeting_id, 'pending', v_feedback_at),
    (v_meeting.mentor_id, 'mentorship_meeting', p_meeting_id, 'pending', v_meeting.scheduled_at);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_meeting_radar_on_confirm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_meeting_radar_on_confirm(uuid) TO authenticated;
