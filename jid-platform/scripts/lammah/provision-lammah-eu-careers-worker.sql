-- Non-production runbook for the EU Careers Lammah worker and scheduler.
-- This intentionally lives outside migrations because credentials are rotated
-- out of band. Run only against jid-nonprod:
--
--   psql "$ADMIN_DATABASE_URL" \
--     --set=target_project_ref='hmjuijmaefajdjrjdsxu' \
--     --set=worker_password='generated-32+-byte-secret' \
--     --set=edge_function_url='https://hmjuijmaefajdjrjdsxu.supabase.co/functions/v1/lammah-crawler' \
--     --set=invocation_secret='generated-32+-byte-secret' \
--     --file scripts/lammah/provision-lammah-eu-careers-worker.sql
--
-- Configure the same worker credential as LAMMAH_EU_CAREERS_DATABASE_URL and
-- the invocation value as LAMMAH_EU_CAREERS_INVOCATION_SECRET in the Edge
-- Function secret store. Never place either value in source, logs, or any
-- NEXT_PUBLIC_* variable.

\if :{?target_project_ref}
\else
  \echo 'Refusing provisioning: target_project_ref is required.'
  \quit
\endif
SELECT :'target_project_ref' = 'hmjuijmaefajdjrjdsxu' AS is_approved_nonprod \gset
\if :is_approved_nonprod
\else
  \echo 'Refusing provisioning: only the approved jid-nonprod project is allowed.'
  \quit
\endif

\if :{?worker_password}
\else
  \echo 'Refusing provisioning: worker_password is required.'
  \quit
\endif
\if :{?edge_function_url}
\else
  \echo 'Refusing provisioning: edge_function_url is required.'
  \quit
\endif
\if :{?invocation_secret}
\else
  \echo 'Refusing provisioning: invocation_secret is required.'
  \quit
\endif

SELECT 'CREATE ROLE lammah_worker_eu_careers LOGIN INHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lammah_worker_eu_careers')
\gexec
SELECT format('ALTER ROLE lammah_worker_eu_careers PASSWORD %L', :'worker_password')
\gexec
GRANT lammah_worker TO lammah_worker_eu_careers;

SELECT vault.create_secret(
  :'edge_function_url','lammah_eu_careers_function_url',
  'Scheduler-only EU Careers Lammah Edge Function URL'
)
WHERE NOT EXISTS (
  SELECT 1 FROM vault.decrypted_secrets WHERE name='lammah_eu_careers_function_url'
);
SELECT vault.update_secret(id, :'edge_function_url')
FROM vault.decrypted_secrets WHERE name='lammah_eu_careers_function_url';

SELECT vault.create_secret(
  :'invocation_secret','lammah_eu_careers_invocation_secret',
  'Scheduler-only EU Careers Lammah invocation secret'
)
WHERE NOT EXISTS (
  SELECT 1 FROM vault.decrypted_secrets WHERE name='lammah_eu_careers_invocation_secret'
);
SELECT vault.update_secret(id, :'invocation_secret')
FROM vault.decrypted_secrets WHERE name='lammah_eu_careers_invocation_secret';

SELECT cron.unschedule(jobid)
FROM cron.job WHERE jobname='lammah-eu-careers-daily';
SELECT cron.schedule(
  'lammah-eu-careers-daily',
  '0 3 * * *',
  $schedule$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret FROM vault.decrypted_secrets
      WHERE name='lammah_eu_careers_function_url'
    ),
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-lammah-invocation-secret',(
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name='lammah_eu_careers_invocation_secret'
      )
    ),
    body := jsonb_build_object(
      'runId','SCHEDULED-' || to_char(now() at time zone 'UTC','YYYYMMDDHH24MISS')
    ),
    timeout_milliseconds := 5000
  );
  $schedule$
);

-- Emergency kill, run separately when ordered:
-- ALTER ROLE lammah_worker_eu_careers NOLOGIN PASSWORD NULL;
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname='lammah-eu-careers-daily';
