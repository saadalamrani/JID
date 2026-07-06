-- Section 8.5 — feedback dismiss snooze (dismissForLater)

ALTER TABLE public.mentorship_meetings
  ADD COLUMN IF NOT EXISTS feedback_dismissed_at timestamptz;

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
    AND should_show_feedback IS DISTINCT FROM true
    AND (
      feedback_dismissed_at IS NULL
      OR feedback_dismissed_at < now() - interval '24 hours'
    );

  UPDATE public.mentorship_meetings
  SET should_show_feedback = false
  WHERE (
      feedback_rating IS NOT NULL
      OR status NOT IN ('confirmed', 'completed')
      OR (
        expected_end_at IS NOT NULL
        AND now() < expected_end_at + interval '2 hours'
      )
      OR (
        feedback_dismissed_at IS NOT NULL
        AND feedback_dismissed_at >= now() - interval '24 hours'
      )
    )
    AND should_show_feedback IS TRUE;
END;
$$;
