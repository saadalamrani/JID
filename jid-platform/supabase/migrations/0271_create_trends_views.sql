-- Platform Pulse — Day 2 / Task 3 (Section 5.3)
-- Market trend snapshots + staggered cron refreshes.

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

GRANT SELECT ON public.sector_demand_snapshot TO anon, authenticated;
GRANT SELECT ON public.skills_demand_snapshot TO anon, authenticated;

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

REVOKE ALL ON FUNCTION public.refresh_sector_demand() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_skills_demand() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_sector_demand() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_skills_demand() TO service_role;

REFRESH MATERIALIZED VIEW public.sector_demand_snapshot;
REFRESH MATERIALIZED VIEW public.skills_demand_snapshot;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN ('refresh-sector-demand', 'refresh-skills-demand')
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'refresh-sector-demand',
  '15 * * * *',
  $$ SELECT public.refresh_sector_demand(); $$
);

SELECT cron.schedule(
  'refresh-skills-demand',
  '20 * * * *',
  $$ SELECT public.refresh_skills_demand(); $$
);
