-- P-111 — Split conflated total_companies into Directory coverage vs Verified profiles
-- Extends existing singleton materialized view; cron jobs unchanged (refresh-pulse-metrics :00, sync-thresholds :05).

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
  ) AS directory_coverage_count,
  (
    SELECT count(*)::bigint
    FROM public.business_profiles bp
    WHERE bp.status = 'published'
  ) AS verified_business_profiles_count,
  (
    SELECT count(*)::bigint
    FROM public.university_profiles up
    WHERE up.status = 'published'
  ) AS verified_university_profiles_count,
  (
    SELECT count(*)::bigint
    FROM public.business_profiles bp
    WHERE bp.status = 'published'
  ) + (
    SELECT count(*)::bigint
    FROM public.university_profiles up
    WHERE up.status = 'published'
  ) AS verified_profiles_count,
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

COMMENT ON COLUMN public.platform_metrics_snapshot.directory_coverage_count IS
  'Market coverage — total Directory records, unconditional. Never conflate with adoption. See Profile Architecture v2 §7.';

COMMENT ON COLUMN public.platform_metrics_snapshot.verified_profiles_count IS
  'Platform adoption — organizations with a published, owned Business or University Profile. Distinct from Directory coverage by design.';

-- ---------------------------------------------------------------------------
-- metric_thresholds — retire total_companies; add directory_coverage + verified_profiles
-- ---------------------------------------------------------------------------

DELETE FROM public.metric_thresholds
WHERE metric_key = 'total_companies';

INSERT INTO public.metric_thresholds (metric_key, label_en, label_ar, min_value, current_value)
VALUES
  ('directory_coverage', 'Directory coverage', 'الجهات في الدليل', 0, 0),
  ('verified_profiles', 'Verified profiles', 'ملفات تعريفية موثّقة', 20, 0)
ON CONFLICT (metric_key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_ar = EXCLUDED.label_ar,
  min_value = EXCLUDED.min_value,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- sync_thresholds_after_refresh — map new snapshot columns
-- ---------------------------------------------------------------------------

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
  SET current_value = snap.directory_coverage_count, updated_at = now()
  WHERE metric_key = 'directory_coverage';

  UPDATE public.metric_thresholds
  SET current_value = snap.verified_profiles_count, updated_at = now()
  WHERE metric_key = 'verified_profiles';

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

NOTIFY pgrst, 'reload schema';
