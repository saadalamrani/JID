-- Section 12 Step 1 / Master Prompt 4.1 — Platform Pulse feature flag foundation.
-- Idempotent: safe on greenfield (runs before 074) and on databases that already have governance flags.

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read (anon + authenticated) — gate checks must work without a session.
DROP POLICY IF EXISTS feature_flags_select_public ON public.feature_flags;
CREATE POLICY feature_flags_select_public
  ON public.feature_flags
  FOR SELECT
  TO public
  USING (true);

-- Super admin UPDATE (requires current_user_role from migration 036+).
DO $$
BEGIN
  IF to_regprocedure('public.current_user_role()') IS NOT NULL THEN
    DROP POLICY IF EXISTS feature_flags_update_super_admin ON public.feature_flags;
    EXECUTE $policy$
      CREATE POLICY feature_flags_update_super_admin
        ON public.feature_flags
        FOR UPDATE
        TO authenticated
        USING (public.current_user_role() = 'super_admin')
        WITH CHECK (public.current_user_role() = 'super_admin')
    $policy$;
  END IF;
END;
$$;

-- Seed Platform Pulse keys (fail-closed defaults except announcements).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feature_flags'
      AND column_name = 'label_ar'
  ) THEN
    INSERT INTO public.feature_flags (
      key,
      label_ar,
      label_en,
      description_ar,
      description_en,
      is_enabled,
      min_role,
      category,
      enabled_for_roles,
      user_overrides
    )
    VALUES
      (
        'platform_pulse_public',
        'نبض المنصة العام',
        'Platform Pulse (public)',
        'عرض صفحة نبض المنصة للزوار',
        'Show the public Platform Pulse page',
        false,
        'individual',
        'pulse',
        '{}',
        '{}'::jsonb
      ),
      (
        'platform_pulse_metrics',
        'مقاييس النبض',
        'Platform Pulse metrics',
        'عرض بطاقات المقاييس على نبض المنصة',
        'Show metric cards on Platform Pulse',
        false,
        'individual',
        'pulse',
        '{}',
        '{}'::jsonb
      ),
      (
        'platform_pulse_trends',
        'اتجاهات النبض',
        'Platform Pulse trends',
        'عرض مخططات الاتجاهات على نبض المنصة',
        'Show trend charts on Platform Pulse',
        false,
        'individual',
        'pulse',
        '{}',
        '{}'::jsonb
      ),
      (
        'platform_pulse_announcements',
        'إعلانات النبض',
        'Platform Pulse announcements',
        'عرض شريط الإعلانات على نبض المنصة',
        'Show the announcements strip on Platform Pulse',
        true,
        'individual',
        'pulse',
        '{}',
        '{}'::jsonb
      )
    ON CONFLICT (key) DO UPDATE SET
      category = EXCLUDED.category,
      description_en = EXCLUDED.description_en,
      description_ar = EXCLUDED.description_ar,
      updated_at = now();
  ELSE
    INSERT INTO public.feature_flags (key, is_enabled, description, updated_at)
    VALUES
      ('platform_pulse_public', false, 'Show the public Platform Pulse page', now()),
      ('platform_pulse_metrics', false, 'Show metric cards on Platform Pulse', now()),
      ('platform_pulse_trends', false, 'Show trend charts on Platform Pulse', now()),
      ('platform_pulse_announcements', true, 'Show announcements strip on Platform Pulse', now())
    ON CONFLICT (key) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = now();
  END IF;
END;
$$;
