-- Platform Pulse — Day 2 / Task 2 (Section 5.2)
-- Platform metrics snapshot + threshold sync.

DROP MATERIALIZED VIEW IF EXISTS public.platform_metrics_snapshot;

CREATE MATERIALIZED VIEW public.platform_metrics_snapshot AS
SELECT
  1::integer AS id,
  now() AS refreshed_at,
  (
    SELECT count(*)::bigint
    FROM public.profiles p
    WHERE p.role = 'individual'::public.user_role_enum
      AND p.deleted_at IS NULL
      AND p.suspended_at IS NULL
      AND coalesce(p.profile_state::text, 'active') NOT IN ('deleted', 'suspended')
  ) AS total_candidates,
  (
    SELECT count(*)::bigint
    FROM public.companies c
    WHERE c.entity_type = 'company'
  ) AS total_companies,
  (
    SELECT count(*)::bigint
    FROM public.jobs j
    WHERE j.status IN ('published', 'closing_soon')
  ) AS active_jobs,
  (
    SELECT count(*)::bigint
    FROM public.jobs
  ) AS total_jobs_ever,
  (
    SELECT count(*)::bigint
    FROM public.mentor_profiles mp
    WHERE mp.status = 'approved'
  ) AS total_mentors,
  (
    SELECT count(*)::bigint
    FROM public.mentorship_meetings mm
    WHERE mm.status = 'completed'
  ) AS total_sessions,
  coalesce(
    (
      SELECT round(
        100.0 * count(*) FILTER (
          WHERE a.submitted_at IS NOT NULL
            AND a.last_company_action_at IS NOT NULL
            AND a.status NOT IN ('draft', 'submitted', 'under_review', 'withdrawn', 'expired')
        )::numeric
        / nullif(
          count(*) FILTER (
            WHERE a.submitted_at IS NOT NULL
              AND a.status NOT IN ('draft', 'withdrawn')
          )::numeric,
          0
        ),
        2
      )
      FROM public.applications a
    ),
    0::numeric
  ) AS jid_response_rate_pct
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_metrics_snapshot_singleton
  ON public.platform_metrics_snapshot (id);

GRANT SELECT ON public.platform_metrics_snapshot TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_pulse_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.platform_metrics_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_pulse_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pulse_metrics() TO service_role;

CREATE OR REPLACE FUNCTION public.sync_thresholds_after_refresh()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snap public.platform_metrics_snapshot%ROWTYPE;
BEGIN
  SELECT * INTO snap
  FROM public.platform_metrics_snapshot
  WHERE id = 1;

  IF snap.id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.metric_thresholds
  SET current_value = snap.total_candidates, updated_at = now()
  WHERE metric_key = 'total_candidates';

  UPDATE public.metric_thresholds
  SET current_value = snap.total_companies, updated_at = now()
  WHERE metric_key = 'total_companies';

  UPDATE public.metric_thresholds
  SET current_value = snap.total_jobs_ever, updated_at = now()
  WHERE metric_key = 'total_jobs';

  UPDATE public.metric_thresholds
  SET current_value = snap.total_mentors, updated_at = now()
  WHERE metric_key = 'total_mentors';

  UPDATE public.metric_thresholds
  SET current_value = snap.total_sessions, updated_at = now()
  WHERE metric_key = 'total_sessions';

  UPDATE public.metric_thresholds
  SET current_value = snap.jid_response_rate_pct, updated_at = now()
  WHERE metric_key = 'response_rate';
END;
$$;

REVOKE ALL ON FUNCTION public.sync_thresholds_after_refresh() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_thresholds_after_refresh() TO service_role;

REFRESH MATERIALIZED VIEW public.platform_metrics_snapshot;
SELECT public.sync_thresholds_after_refresh();

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN ('refresh-pulse-metrics', 'sync-thresholds')
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'refresh-pulse-metrics',
  '0 * * * *',
  $$ SELECT public.refresh_pulse_metrics(); $$
);

SELECT cron.schedule(
  'sync-thresholds',
  '5 * * * *',
  $$ SELECT public.sync_thresholds_after_refresh(); $$
);
