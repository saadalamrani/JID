-- Section 7 — feature flag layers (global / role / user) + pulse.billboard seed

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'modules',
  ADD COLUMN IF NOT EXISTS enabled_for_roles public.user_role_enum[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_feature_flags_category
  ON public.feature_flags (category, key);

UPDATE public.feature_flags
SET category = 'modules'
WHERE key IN (
  'catalog',
  'jobs',
  'mentorship',
  'cv_builder',
  'radar',
  'entity_signup'
);

UPDATE public.feature_flags
SET category = 'platform'
WHERE key IN ('phone_verification', 'maintenance_mode');

INSERT INTO public.feature_flags (
  key,
  category,
  label_ar,
  label_en,
  description_ar,
  description_en,
  is_enabled,
  min_role,
  enabled_for_roles,
  user_overrides
)
VALUES (
  'pulse.billboard',
  'pulse',
  'لوحة النبض',
  'Pulse billboard',
  'شريط الإعلانات الترويجي في الصفحة الرئيسية',
  'Promotional billboard strip on the home page',
  false,
  'individual',
  '{}',
  '{}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Section 7 — precedence: user override > role list > global (+ min_role floor)
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_flag_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag public.feature_flags%ROWTYPE;
  v_role public.user_role_enum;
  v_uid text;
  v_override text;
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_flag_key;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF auth.uid() IS NULL THEN
    v_role := 'individual'::public.user_role_enum;
    v_uid := NULL;
  ELSE
    v_uid := auth.uid()::text;
    v_role := public.current_user_role();
    IF v_role IS NULL THEN
      v_role := 'individual'::public.user_role_enum;
    END IF;
  END IF;

  -- Layer 3 — per-user override
  IF v_uid IS NOT NULL AND v_flag.user_overrides ? v_uid THEN
    v_override := v_flag.user_overrides ->> v_uid;
    IF v_override IN ('true', 'false') THEN
      RETURN v_override::boolean;
    END IF;
  END IF;

  -- Layer 2 — explicit role allow-list
  IF v_flag.enabled_for_roles IS NOT NULL AND cardinality(v_flag.enabled_for_roles) > 0 THEN
    RETURN v_role = ANY (v_flag.enabled_for_roles);
  END IF;

  -- Layer 1 — global toggle + legacy min_role floor
  IF NOT v_flag.is_enabled THEN
    RETURN false;
  END IF;

  RETURN public._user_role_rank(v_role) >= public._user_role_rank(v_flag.min_role);
END;
$$;

REVOKE ALL ON FUNCTION public.is_feature_enabled(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(text) TO anon, authenticated;
