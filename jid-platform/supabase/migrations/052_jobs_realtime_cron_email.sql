-- Section 5.4 / 7.2 / 7.3 — Realtime applications + deferred job cron + expiry email queue

-- ---------------------------------------------------------------------------
-- Realtime: applications (Section 5.4)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- expire_stale_applications: queue expiry notifications (7/14/30 day SLA)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_applications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public.applications a
    SET
      status = 'expired',
      expires_at = coalesce(a.expires_at, now()),
      updated_at = now()
    FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE a.job_id = j.id
      AND a.status IN ('submitted', 'under_review')
      AND a.submitted_at IS NOT NULL
      AND now() >= a.submitted_at + (
        CASE
          WHEN coalesce(c.commitment_score, 0) >= 80 THEN interval '7 days'
          WHEN coalesce(c.commitment_score, 0) >= 50 THEN interval '14 days'
          ELSE interval '30 days'
        END
      )
    RETURNING
      a.id,
      a.applicant_id,
      a.job_id,
      a.contact_email,
      j.title_ar,
      j.title_en,
      c.name,
      c.name_ar
  ),
  queued AS (
    INSERT INTO public.email_outbox (template, payload, status)
    SELECT
      'application_expiry',
      jsonb_build_object(
        'application_id', e.id,
        'applicant_id', e.applicant_id,
        'job_id', e.job_id,
        'contact_email', e.contact_email,
        'job_title_ar', e.title_ar,
        'job_title_en', e.title_en,
        'company_name', coalesce(e.name_ar, e.name)
      ),
      'pending'
    FROM expired e
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_count FROM expired;

  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_applications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_applications() TO service_role;

-- ---------------------------------------------------------------------------
-- pg_cron — Day 1 deferred maintenance (Section 7.2)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'transition-closing-soon',
      'expire-passed-jobs',
      'expire-stale-apps',
      'process-email-outbox'
    )
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'transition-closing-soon',
  '0 * * * *',
  $$ SELECT public.transition_closing_soon(); $$
);

SELECT cron.schedule(
  'expire-passed-jobs',
  '5 * * * *',
  $$ SELECT public.expire_passed_jobs(); $$
);

SELECT cron.schedule(
  'expire-stale-apps',
  '0 3 * * *',
  $$
  SELECT public.expire_stale_applications();
  SELECT net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Retry pending outbox every minute (Section 9 — rejection within 30s when invoke fails)
SELECT cron.schedule(
  'process-email-outbox',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
