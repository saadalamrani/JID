-- University Pillar MVP — Day 2 / Task 1
-- Materialized snapshot for university dashboard KPIs.

DROP MATERIALIZED VIEW IF EXISTS public.university_dashboard_snapshot;

CREATE MATERIALIZED VIEW public.university_dashboard_snapshot AS
WITH base_profiles AS (
  SELECT
    p.id,
    p.university_id,
    p.college_id,
    p.student_status,
    p.profile_completion_pct
  FROM public.profiles p
  WHERE p.university_id IS NOT NULL
),
college_counts AS (
  SELECT
    bp.university_id,
    jsonb_object_agg(
      COALESCE(cc.name_en, 'Unknown'),
      bp.college_count
      ORDER BY COALESCE(cc.name_en, 'Unknown')
    ) AS college_distribution
  FROM (
    SELECT
      university_id,
      college_id,
      count(*)::bigint AS college_count
    FROM base_profiles
    GROUP BY university_id, college_id
  ) bp
  LEFT JOIN public.colleges_catalog cc ON cc.id = bp.college_id
  GROUP BY bp.university_id
),
status_counts AS (
  SELECT
    bp.university_id,
    jsonb_object_agg(
      COALESCE(bp.student_status, 'unspecified'),
      bp.status_count
      ORDER BY COALESCE(bp.student_status, 'unspecified')
    ) AS status_breakdown
  FROM (
    SELECT
      university_id,
      student_status,
      count(*)::bigint AS status_count
    FROM base_profiles
    GROUP BY university_id, student_status
  ) bp
  GROUP BY bp.university_id
)
SELECT
  u.id AS university_id,
  count(bp.id)::bigint AS total_students,
  COALESCE(cc.college_distribution, '{}'::jsonb) AS college_distribution,
  round(COALESCE(avg(bp.profile_completion_pct), 0)::numeric, 2) AS profile_completion_pct,
  round(
    CASE
      WHEN count(bp.id) = 0 THEN 0
      ELSE (
        count(DISTINCT CASE WHEN cv.id IS NOT NULL THEN bp.id END)::numeric
        / count(bp.id)::numeric
      ) * 100
    END,
    2
  ) AS cv_creation_pct,
  count(a.id)::bigint AS job_applications,
  count(mm.id)::bigint AS mentorship_sessions,
  COALESCE(sc.status_breakdown, '{}'::jsonb) AS status_breakdown,
  now() AS refreshed_at
FROM public.universities_catalog u
LEFT JOIN base_profiles bp
  ON bp.university_id = u.id
LEFT JOIN public.cvs cv
  ON cv.user_id = bp.id
LEFT JOIN public.applications a
  ON a.applicant_id = bp.id
LEFT JOIN public.mentorship_meetings mm
  ON mm.mentee_id = bp.id
  AND mm.status IN ('confirmed', 'completed')
LEFT JOIN college_counts cc
  ON cc.university_id = u.id
LEFT JOIN status_counts sc
  ON sc.university_id = u.id
GROUP BY
  u.id,
  cc.college_distribution,
  sc.status_breakdown
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_university_dashboard_snapshot_university_id
  ON public.university_dashboard_snapshot (university_id);

CREATE OR REPLACE FUNCTION public.refresh_university_dashboard_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.university_dashboard_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_university_dashboard_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_university_dashboard_snapshot() TO service_role;

-- First fill (cannot be concurrent for an unpopulated MV).
REFRESH MATERIALIZED VIEW public.university_dashboard_snapshot;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'refresh-university-dashboard-snapshot'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'refresh-university-dashboard-snapshot',
  '*/30 * * * *',
  $$ SELECT public.refresh_university_dashboard_snapshot(); $$
);
