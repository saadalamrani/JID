-- Section 12 Steps 4–5 / Master Prompt 5.2 — Platform Pulse materialized views + threshold sync.
-- Uses REFRESH MATERIALIZED VIEW CONCURRENTLY (non-blocking reads during refresh).

-- ---------------------------------------------------------------------------
-- platform_metrics_snapshot — singleton row (id = 1)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- sector_demand_snapshot — active demand by sector
-- ---------------------------------------------------------------------------

DROP MATERIALIZED VIEW IF EXISTS public.sector_demand_snapshot;

CREATE MATERIALIZED VIEW public.sector_demand_snapshot AS
SELECT
  s.id AS sector_id,
  s.slug AS sector_slug,
  s.name_en,
  s.name_ar,
  count(j.id) FILTER (WHERE j.status IN ('published', 'closing_soon'))::bigint AS active_job_count,
  coalesce(
    sum(j.applicant_count) FILTER (WHERE j.status IN ('published', 'closing_soon')),
    0
  )::bigint AS application_count,
  now() AS refreshed_at
FROM public.sectors s
LEFT JOIN public.jobs j ON j.sector_id = s.id
GROUP BY s.id, s.slug, s.name_en, s.name_ar
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sector_demand_snapshot_sector_id
  ON public.sector_demand_snapshot (sector_id);

-- ---------------------------------------------------------------------------
-- skills_demand_snapshot — skills extracted from jobs.required_skills
-- ---------------------------------------------------------------------------

DROP MATERIALIZED VIEW IF EXISTS public.skills_demand_snapshot;

CREATE MATERIALIZED VIEW public.skills_demand_snapshot AS
SELECT
  lower(trim(skill.skill_name)) AS skill_name,
  count(DISTINCT j.id)::bigint AS active_job_count,
  coalesce(sum(j.applicant_count), 0)::bigint AS application_count,
  now() AS refreshed_at
FROM public.jobs j
CROSS JOIN LATERAL unnest(j.required_skills) AS skill(skill_name)
WHERE j.status IN ('published', 'closing_soon')
  AND skill.skill_name IS NOT NULL
  AND trim(skill.skill_name) <> ''
GROUP BY lower(trim(skill.skill_name))
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_demand_snapshot_skill_name
  ON public.skills_demand_snapshot (skill_name);

-- ---------------------------------------------------------------------------
-- Public read grants (anon + authenticated)
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.platform_metrics_snapshot TO anon, authenticated;
GRANT SELECT ON public.sector_demand_snapshot TO anon, authenticated;
GRANT SELECT ON public.skills_demand_snapshot TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Refresh helpers — CONCURRENTLY (requires unique indexes above)
-- ---------------------------------------------------------------------------

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

CREATE OR REPLACE FUNCTION public.refresh_sector_demand()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.sector_demand_snapshot;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_skills_demand()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.skills_demand_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_pulse_metrics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_sector_demand() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_skills_demand() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pulse_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_sector_demand() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_skills_demand() TO service_role;

-- ---------------------------------------------------------------------------
-- sync_thresholds_after_refresh — copy latest snapshot into metric_thresholds
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

-- Section 13 — label as "JID Response Rate" (never "National Compliance")
UPDATE public.metric_thresholds
SET
  label_en = 'JID Response Rate',
  label_ar = 'معدل استجابة جيد',
  updated_at = now()
WHERE metric_key = 'response_rate';

-- ---------------------------------------------------------------------------
-- Initial populate (non-concurrent first refresh; enables CONCURRENTLY later)
-- ---------------------------------------------------------------------------

REFRESH MATERIALIZED VIEW public.platform_metrics_snapshot;
REFRESH MATERIALIZED VIEW public.sector_demand_snapshot;
REFRESH MATERIALIZED VIEW public.skills_demand_snapshot;

SELECT public.sync_thresholds_after_refresh();
