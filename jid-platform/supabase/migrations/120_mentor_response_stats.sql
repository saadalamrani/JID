-- Task 3 — Live aggregate response analytics (RPC-only; no denormalized column refresh)
-- Step 0b: responded_at already exists on mentorship_requests; belt-and-suspenders trigger below.

-- ---------------------------------------------------------------------------
-- Ensure responded_at is stamped on accept/decline (DB-level, idempotent with app)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_mentorship_request_responded_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status IN ('accepted', 'declined')
    AND NEW.responded_at IS NULL
  THEN
    NEW.responded_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_requests_sync_responded_at ON public.mentorship_requests;

CREATE TRIGGER trg_mentorship_requests_sync_responded_at
  BEFORE UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mentorship_request_responded_at();

-- ---------------------------------------------------------------------------
-- Aggregate-only mentor response stats (live query — not materialized)
-- Returns NULL sub-values when no backing rows exist (frontend omits cards).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mentor_response_stats(p_mentor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed boolean;
  v_avg_hours numeric;
  v_acceptance_pct numeric;
  v_completed integer;
BEGIN
  SELECT
    EXISTS (
      SELECT 1
      FROM public.mentor_profiles mp
      WHERE mp.user_id = p_mentor_id
        AND mp.status = 'approved'
    )
    OR auth.uid() = p_mentor_id
    OR public.is_mentorship_staff()
    OR public.is_privileged_staff()
  INTO v_allowed;

  IF NOT coalesce(v_allowed, false) THEN
    RETURN jsonb_build_object(
      'avg_response_hours', NULL,
      'acceptance_rate_pct', NULL,
      'completed_sessions', NULL
    );
  END IF;

  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE round(
        AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600.0)::numeric,
        2
      )
    END
  INTO v_avg_hours
  FROM public.mentorship_requests
  WHERE mentor_id = p_mentor_id
    AND status IN ('accepted', 'declined')
    AND responded_at IS NOT NULL;

  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE round(
        100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / COUNT(*)::numeric,
        1
      )
    END
  INTO v_acceptance_pct
  FROM public.mentorship_requests
  WHERE mentor_id = p_mentor_id
    AND status IN ('accepted', 'declined');

  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE COUNT(*)::integer
    END
  INTO v_completed
  FROM public.mentorship_meetings
  WHERE mentor_id = p_mentor_id
    AND status = 'completed';

  RETURN jsonb_build_object(
    'avg_response_hours', v_avg_hours,
    'acceptance_rate_pct', v_acceptance_pct,
    'completed_sessions', v_completed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_mentor_response_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mentor_response_stats(uuid) TO anon, authenticated, service_role;
