-- Section 11 — emergency controls: registrations_open, public gate reads, revert columns

ALTER TABLE public.emergency_actions
  ADD COLUMN IF NOT EXISTS reverted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reverted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

INSERT INTO public.platform_config (key, value, description, is_secret, category, value_type)
VALUES (
  'registrations_open',
  'true'::jsonb,
  'When false, new user registrations are blocked platform-wide',
  false,
  'platform',
  'boolean'
)
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  value_type = EXCLUDED.value_type,
  description = COALESCE(public.platform_config.description, EXCLUDED.description);

DROP POLICY IF EXISTS platform_config_select_public_gates ON public.platform_config;
CREATE POLICY platform_config_select_public_gates
  ON public.platform_config
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('maintenance_mode', 'registrations_open') AND NOT is_secret);
