-- Radar sprint reconciliation — feedback flags, applications last_seen, saved/pending statuses
-- Section 8.2 — server-computed should_show_feedback (replaces client hoursAfter morph on Day 8)

-- ---------------------------------------------------------------------------
-- applications — Radar last-seen + saved/pending enum values for Saved column
-- ---------------------------------------------------------------------------

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS last_seen_by_user_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'application_status_enum'
      AND e.enumlabel = 'saved'
  ) THEN
    ALTER TYPE public.application_status_enum ADD VALUE 'saved';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'application_status_enum'
      AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.application_status_enum ADD VALUE 'pending';
  END IF;
END;
$$;

-- Treat pending like submitted for submitted_at backfill on declare upsert
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

  IF TG_OP = 'INSERT'
    AND NEW.status IN ('submitted', 'pending')
    AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- mentorship_meetings — expected end + feedback visibility flag
-- ---------------------------------------------------------------------------

ALTER TABLE public.mentorship_meetings
  ADD COLUMN IF NOT EXISTS expected_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS should_show_feedback boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Section 8.2 — update_feedback_flags (pg_cron every 30 min)
-- Sets should_show_feedback when meeting ended + 2h grace, feedback not yet submitted.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_feedback_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.mentorship_meetings
  SET expected_end_at = scheduled_at + make_interval(mins => coalesce(duration_minutes, 0))
  WHERE expected_end_at IS NULL
    AND scheduled_at IS NOT NULL
    AND status IN ('confirmed', 'completed');

  UPDATE public.mentorship_meetings
  SET should_show_feedback = true
  WHERE status = 'confirmed'
    AND feedback_rating IS NULL
    AND expected_end_at IS NOT NULL
    AND now() >= expected_end_at + interval '2 hours'
    AND should_show_feedback IS DISTINCT FROM true;

  UPDATE public.mentorship_meetings
  SET should_show_feedback = false
  WHERE (
      feedback_rating IS NOT NULL
      OR status NOT IN ('confirmed', 'completed')
      OR (
        expected_end_at IS NOT NULL
        AND now() < expected_end_at + interval '2 hours'
      )
    )
    AND should_show_feedback IS TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.update_feedback_flags() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_feedback_flags() TO service_role;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'feedback-flags'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'feedback-flags',
  '*/30 * * * *',
  $$ SELECT public.update_feedback_flags(); $$
);

-- Mentorship confirm no longer writes radar_items — noop legacy RPC if still called
CREATE OR REPLACE FUNCTION public.sync_meeting_radar_on_confirm(p_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deprecated: radar_items bridge not used by real Radar implementation.
  NULL;
END;
$$;
