-- Section 10 — platform_config category + value_type for Super Admin config UI

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'platform';

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS value_type text NOT NULL DEFAULT 'json';

ALTER TABLE public.platform_config
  DROP CONSTRAINT IF EXISTS platform_config_value_type_chk;

ALTER TABLE public.platform_config
  ADD CONSTRAINT platform_config_value_type_chk
  CHECK (value_type IN ('string', 'number', 'boolean', 'json'));

CREATE INDEX IF NOT EXISTS idx_platform_config_category
  ON public.platform_config (category, key);

-- Seed / reconcile known keys
INSERT INTO public.platform_config (key, value, description, is_secret, category, value_type)
VALUES
  (
    'maintenance_mode',
    '{"enabled": false, "message": ""}'::jsonb,
    'Platform maintenance banner and kill switch companion',
    false,
    'platform',
    'json'
  ),
  (
    'sys_session_max_seconds',
    '7200'::jsonb,
    'Maximum super_admin shell session length in seconds',
    false,
    'security',
    'number'
  ),
  (
    'claims_sla_hours',
    '72'::jsonb,
    'SLA window for claim review (hours)',
    false,
    'operations',
    'number'
  ),
  (
    'support_contact_email',
    '"support@jid.sa"'::jsonb,
    'Public support contact email',
    false,
    'platform',
    'string'
  ),
  (
    'smtp_api_key',
    '""'::jsonb,
    'Transactional email provider API key',
    true,
    'integrations',
    'string'
  )
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  value_type = EXCLUDED.value_type,
  description = COALESCE(public.platform_config.description, EXCLUDED.description);
