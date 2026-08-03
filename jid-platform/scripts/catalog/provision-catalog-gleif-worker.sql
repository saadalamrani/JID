-- Non-production admin runbook for the GLEIF worker identity and scheduler.
-- This file is intentionally outside supabase/migrations: credentials are
-- provisioned and rotated out-of-band. Run with psql against jid-nonprod only:
--
--   psql "$ADMIN_DATABASE_URL" \
--     --set=target_project_ref='hmjuijmaefajdjrjdsxu' \
--     --set=worker_password='generated-32+-byte-secret' \
--     --set=edge_function_url='https://<project>.supabase.co/functions/v1/catalog-gleif-sync' \
--     --set=invocation_secret='generated-32-byte-secret' \
--     --file scripts/catalog/provision-catalog-gleif-worker.sql
--
-- Never place values in this file, shell history, CI logs, or NEXT_PUBLIC_*.

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
  \quit
\endif
\if :{?edge_function_url}
\else
  \quit
\endif
\if :{?invocation_secret}
\else
  \quit
\endif

SELECT 'CREATE ROLE catalog_worker_gleif LOGIN INHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='catalog_worker_gleif')
\gexec
SELECT format('ALTER ROLE catalog_worker_gleif PASSWORD %L', :'worker_password')
\gexec
GRANT catalog_worker TO catalog_worker_gleif;

SELECT vault.create_secret(:'edge_function_url', 'catalog_gleif_function_url',
  'Scheduler-only GLEIF Edge Function URL')
WHERE NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='catalog_gleif_function_url');
SELECT vault.update_secret(id, :'edge_function_url')
FROM vault.decrypted_secrets WHERE name='catalog_gleif_function_url';

SELECT vault.create_secret(:'invocation_secret', 'catalog_gleif_invocation_secret',
  'Scheduler invocation secret for catalog-gleif-sync')
WHERE NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='catalog_gleif_invocation_secret');
SELECT vault.update_secret(id, :'invocation_secret')
FROM vault.decrypted_secrets WHERE name='catalog_gleif_invocation_secret';

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname='catalog-gleif-weekly';
SELECT cron.schedule(
  'catalog-gleif-weekly',
  '0 2 * * 1',
  $schedule$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='catalog_gleif_function_url'),
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-catalog-invocation-secret',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='catalog_gleif_invocation_secret')
    ),
    body := jsonb_build_object('runId','SCHEDULED-' || to_char(now() at time zone 'UTC','YYYYMMDDHH24MISS')),
    timeout_milliseconds := 5000
  );
  $schedule$
);

-- Emergency credential kill (run separately when ordered):
-- ALTER ROLE catalog_worker_gleif NOLOGIN PASSWORD NULL;
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname='catalog-gleif-weekly';
