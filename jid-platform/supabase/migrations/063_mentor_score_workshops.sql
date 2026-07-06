-- Sections 4.15 / Mentor of Month — mentor_score + active_workshop sync

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS mentor_score numeric(6, 2);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_score
  ON public.mentor_profiles (mentor_score DESC NULLS LAST)
  WHERE status = 'approved';

-- Composite score: rating (50%) + session volume (30%) + responsiveness (20%)
CREATE OR REPLACE FUNCTION public.compute_mentor_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.mentor_profiles mp
  SET
    mentor_score = round(
      (
        coalesce(mp.rating_avg, 0) * 0.5
        + least(coalesce(mp.sessions_count, 0), 50)::numeric / 50 * 3 * 0.3
        + CASE
            WHEN mp.avg_response_hours IS NULL THEN 0
            ELSE greatest(0, 5 - (mp.avg_response_hours / 24.0)) * 0.2
          END
      )::numeric,
      2
    ),
    updated_at = now()
  WHERE mp.status = 'approved';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.compute_mentor_scores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_mentor_scores() TO service_role;

-- Top 3 approved mentors by mentor_score each month
CREATE OR REPLACE FUNCTION public.refresh_mentor_of_month()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  PERFORM public.compute_mentor_scores();

  UPDATE public.mentor_profiles
  SET is_mentor_of_month = false
  WHERE is_mentor_of_month = true;

  UPDATE public.mentor_profiles mp
  SET is_mentor_of_month = true
  FROM (
    SELECT user_id
    FROM public.mentor_profiles
    WHERE status = 'approved'
      AND mentor_score IS NOT NULL
    ORDER BY mentor_score DESC NULLS LAST, sessions_count DESC, rating_avg DESC NULLS LAST
    LIMIT 3
  ) top
  WHERE mp.user_id = top.user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_mentor_of_month() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_mentor_of_month() TO service_role;

-- Sync mentor_profiles.active_workshop from nearest published future workshop
CREATE OR REPLACE FUNCTION public.sync_mentor_active_workshop(p_mentor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workshop record;
BEGIN
  SELECT id, title, title_ar, scheduled_at, spots_remaining, external_url
  INTO v_workshop
  FROM public.mentor_workshops
  WHERE mentor_id = p_mentor_id
    AND status = 'published'
    AND scheduled_at IS NOT NULL
    AND scheduled_at > now()
  ORDER BY scheduled_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE public.mentor_profiles
    SET active_workshop = NULL, updated_at = now()
    WHERE user_id = p_mentor_id;
    RETURN;
  END IF;

  UPDATE public.mentor_profiles
  SET
    active_workshop = jsonb_build_object(
      'title', v_workshop.title,
      'title_ar', v_workshop.title_ar,
      'workshop_date', v_workshop.scheduled_at,
      'scheduled_at', v_workshop.scheduled_at,
      'is_active', true,
      'spots_remaining', v_workshop.spots_remaining,
      'url', v_workshop.external_url
    ),
    updated_at = now()
  WHERE user_id = p_mentor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_active_workshop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_mentor_active_workshop(coalesce(NEW.mentor_id, OLD.mentor_id));
  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_workshops_sync_active ON public.mentor_workshops;
CREATE TRIGGER trg_mentor_workshops_sync_active
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_active_workshop();

SELECT cron.schedule(
  'refresh-mentor-of-month',
  '0 6 1 * *',
  $$ SELECT public.refresh_mentor_of_month(); $$
);
