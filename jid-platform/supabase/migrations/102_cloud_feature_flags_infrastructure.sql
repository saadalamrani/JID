-- 102_cloud_feature_flags_infrastructure.sql
-- Feature-flags ONLY — cloud-reconciled extract from 074 + 075 + FLAG_KEYS seeds.
-- Does NOT create platform_config, emergency_actions, or sys metrics (074 scope excluded).
-- Uses public.user_role_enum (cloud) instead of user_role_enum.

-- ---------------------------------------------------------------------------
-- Prerequisites (036) — required by is_feature_enabled
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT role = 'admin'
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_above() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above() TO authenticated;

-- ---------------------------------------------------------------------------
-- 074 §3.1 feature_flags table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  description_ar text,
  description_en text,
  is_enabled boolean NOT NULL DEFAULT true,
  min_role public.user_role_enum NOT NULL DEFAULT 'individual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags (is_enabled);

-- ---------------------------------------------------------------------------
-- 075 Section 7 columns + index
-- ---------------------------------------------------------------------------

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'modules',
  ADD COLUMN IF NOT EXISTS enabled_for_roles public.user_role_enum[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_feature_flags_category
  ON public.feature_flags (category, key);

-- ---------------------------------------------------------------------------
-- 074 §3.6 helpers + 075 is_feature_enabled (layered)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._user_role_rank(p_role public.user_role_enum)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'individual' THEN 1
    WHEN 'entity' THEN 2
    WHEN 'company_admin' THEN 2
    WHEN 'university_admin' THEN 2
    WHEN 'staff' THEN 3
    WHEN 'admin' THEN 4
    ELSE 1
  END;
$$;

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

  IF v_uid IS NOT NULL AND v_flag.user_overrides ? v_uid THEN
    v_override := v_flag.user_overrides ->> v_uid;
    IF v_override IN ('true', 'false') THEN
      RETURN v_override::boolean;
    END IF;
  END IF;

  IF v_flag.enabled_for_roles IS NOT NULL AND cardinality(v_flag.enabled_for_roles) > 0 THEN
    RETURN v_role = ANY (v_flag.enabled_for_roles);
  END IF;

  IF NOT v_flag.is_enabled THEN
    RETURN false;
  END IF;

  RETURN public._user_role_rank(v_role) >= public._user_role_rank(v_flag.min_role);
END;
$$;

REVOKE ALL ON FUNCTION public.is_feature_enabled(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS — anon SELECT required for pulse middleware REST + RPC for other gates
-- ---------------------------------------------------------------------------

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_select_public ON public.feature_flags;
CREATE POLICY feature_flags_select_public
  ON public.feature_flags
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS feature_flags_select_authenticated ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_mutate_super_admin ON public.feature_flags;

CREATE POLICY feature_flags_mutate_admin
  ON public.feature_flags
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_above())
  WITH CHECK (public.is_admin_or_above());

-- ---------------------------------------------------------------------------
-- Seed: 074 module flags
-- ---------------------------------------------------------------------------

INSERT INTO public.feature_flags (
  key, category, label_ar, label_en, description_ar, description_en, is_enabled, min_role
)
VALUES
  ('catalog', 'modules', 'دليل الشركات', 'Company catalog', 'تصفح دليل الشركات والجامعات', 'Browse the company and university catalog', true, 'individual'),
  ('jobs', 'modules', 'لوحة الوظائف', 'Job board', 'نشر وتصفح فرص العمل', 'Post and browse job opportunities', true, 'individual'),
  ('mentorship', 'modules', 'الإرشاد المهني', 'Mentorship', 'اكتشاف المرشدين وطلب جلسات الإرشاد', 'Discover mentors and request mentorship', true, 'individual'),
  ('cv_builder', 'modules', 'باني السيرة', 'CV builder', 'إنشاء وتصدير السيرة الذاتية', 'Build and export your CV', true, 'individual'),
  ('radar', 'modules', 'رادار الفرص', 'Opportunity radar', 'تتبع الطلبات على لوحة الرادار', 'Track applications on the opportunity radar', true, 'individual'),
  ('entity_signup', 'modules', 'تسجيل الجهات', 'Entity signup', 'التقدم لامتلاك صفحة شركة أو جامعة', 'Apply to claim a company or university page', true, 'individual'),
  ('phone_verification', 'platform', 'التحقق من الهاتف', 'Phone verification', 'التحقق من رقم الهاتف عبر OTP', 'Verify phone number via OTP', true, 'individual'),
  ('maintenance_mode', 'platform', 'وضع الصيانة', 'Maintenance mode', 'إيقاف المنصة مؤقتاً للصيانة', 'Temporarily disable the platform for maintenance', false, 'admin')
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  label_ar = EXCLUDED.label_ar,
  label_en = EXCLUDED.label_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  is_enabled = EXCLUDED.is_enabled,
  min_role = EXCLUDED.min_role,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Seed: Pulse flags (024 / FLAG_KEYS) — launch ON
-- ---------------------------------------------------------------------------

INSERT INTO public.feature_flags (key, category, label_ar, label_en, description_en, is_enabled, min_role)
VALUES
  ('platform_pulse_public', 'pulse', 'نبض المنصة', 'Platform Pulse', 'Show the public Platform Pulse page', true, 'individual'),
  ('platform_pulse_metrics', 'pulse', 'مقاييس النبض', 'Pulse metrics', 'Show metric cards on Platform Pulse', true, 'individual'),
  ('platform_pulse_trends', 'pulse', 'اتجاهات السوق', 'Pulse trends', 'Show trend charts on Platform Pulse', true, 'individual'),
  ('platform_pulse_announcements', 'pulse', 'إعلانات النبض', 'Pulse announcements', 'Show announcements strip on Platform Pulse', true, 'individual'),
  ('pulse.billboard', 'pulse', 'لوحة النبض', 'Pulse billboard', 'Promotional billboard strip on the home page', true, 'individual')
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  is_enabled = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Seed: FLAG_KEYS granular + module metadata — launch ON
-- ---------------------------------------------------------------------------

INSERT INTO public.feature_flags (key, category, label_ar, label_en, description_en, is_enabled, min_role)
VALUES
  ('pulse', 'modules', 'نبض', 'Pulse module', 'Pulse module master key', true, 'individual'),
  ('universities', 'modules', 'الجامعات', 'Universities module', 'Universities module master key', true, 'individual'),
  ('profile', 'modules', 'الملف الشخصي', 'Profile module', 'Profile module master key', true, 'individual'),
  ('universities.discover', 'modules', 'اكتشاف الجامعات', 'Universities discover', 'Public universities discovery page', true, 'individual'),
  ('mentorship.discovery', 'modules', 'اكتشاف المرشدين', 'Mentorship discovery', 'Public mentors listing and discovery', true, 'individual'),
  ('cv_builder.smart_hints', 'modules', 'تلميحات السيرة', 'CV smart hints', 'Contextual CV builder hints panel', true, 'individual'),
  ('jobs.smart_matching', 'modules', 'المطابقة الذكية', 'Job smart matching', 'Smart matching on job detail', true, 'individual'),
  ('jobs.application_analytics', 'modules', 'تحليلات التقديم', 'Job application analytics', 'Application analytics on job detail', true, 'individual'),
  ('radar.realtime_updates', 'modules', 'تحديثات الرادار', 'Radar realtime updates', 'Realtime radar board updates', true, 'individual')
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  is_enabled = true,
  updated_at = now();

NOTIFY pgrst, 'reload schema';
