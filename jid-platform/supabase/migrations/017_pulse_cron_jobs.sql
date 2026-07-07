-- Section 12 Step 5 / Master Prompt 5.3 — Platform Pulse cron schedules (hourly stagger).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'refresh-pulse-metrics',
      'sync-thresholds',
      'refresh-sector-demand',
      'refresh-skills-demand'
    )
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

-- :00 — refresh platform metrics snapshot (CONCURRENTLY via helper)
SELECT cron.schedule(
  'refresh-pulse-metrics',
  '0 * * * *',
  $$ SELECT public.refresh_pulse_metrics(); $$
);

-- :05 — sync metric_thresholds.current_value from latest snapshot
SELECT cron.schedule(
  'sync-thresholds',
  '5 * * * *',
  $$ SELECT public.sync_thresholds_after_refresh(); $$
);

-- :15 — refresh sector demand trends
SELECT cron.schedule(
  'refresh-sector-demand',
  '15 * * * *',
  $$ SELECT public.refresh_sector_demand(); $$
);

-- :20 — refresh skills demand trends
SELECT cron.schedule(
  'refresh-skills-demand',
  '20 * * * *',
  $$ SELECT public.refresh_skills_demand(); $$
);
