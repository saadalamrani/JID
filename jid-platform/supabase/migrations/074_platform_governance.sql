-- Section 3 — Platform governance: feature flags, config, emergency actions, sys metrics.
-- Reconciled: audit_logs.created_at (not performed_at), no claim_requests.sla_due_at,
-- active_sessions from Auth/RBAC 034, profiles.suspended_at from 024/041.

-- ---------------------------------------------------------------------------
-- 3.1 feature_flags
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

INSERT INTO public.feature_flags (
  key,
  label_ar,
  label_en,
  description_ar,
  description_en,
  is_enabled,
  min_role
)
VALUES
  (
    'catalog',
    'دليل الشركات',
    'Company catalog',
    'تصفح دليل الشركات والجامعات',
    'Browse the company and university catalog',
    true,
    'individual'
  ),
  (
    'jobs',
    'لوحة الوظائف',
    'Job board',
    'نشر وتصفح فرص العمل',
    'Post and browse job opportunities',
    true,
    'individual'
  ),
  (
    'mentorship',
    'الإرشاد المهني',
    'Mentorship',
    'اكتشاف المرشدين وطلب جلسات الإرشاد',
    'Discover mentors and request mentorship',
    true,
    'individual'
  ),
  (
    'cv_builder',
    'باني السيرة',
    'CV builder',
    'إنشاء وتصدير السيرة الذاتية',
    'Build and export your CV',
    true,
    'individual'
  ),
  (
    'radar',
    'رادار الفرص',
    'Opportunity radar',
    'تتبع الطلبات على لوحة الرادار',
    'Track applications on the opportunity radar',
    true,
    'individual'
  ),
  (
    'entity_signup',
    'تسجيل الجهات',
    'Entity signup',
    'التقدم لامتلاك صفحة شركة أو جامعة',
    'Apply to claim a company or university page',
    true,
    'individual'
  ),
  (
    'phone_verification',
    'التحقق من الهاتف',
    'Phone verification',
    'التحقق من رقم الهاتف عبر OTP',
    'Verify phone number via OTP',
    true,
    'individual'
  ),
  (
    'maintenance_mode',
    'وضع الصيانة',
    'Maintenance mode',
    'إيقاف المنصة مؤقتاً للصيانة',
    'Temporarily disable the platform for maintenance',
    false,
    'super_admin'
  )
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3.2 platform_config
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_secret boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 3.3 emergency_actions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.emergency_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  activated_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  activated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  deactivated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_actions_active
  ON public.emergency_actions (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_emergency_actions_activated_at
  ON public.emergency_actions (activated_at DESC);

-- ---------------------------------------------------------------------------
-- 3.4 mv_sys_dashboard_metrics (reconciled column sources)
-- ---------------------------------------------------------------------------

DROP MATERIALIZED VIEW IF EXISTS public.mv_sys_dashboard_metrics;

CREATE MATERIALIZED VIEW public.mv_sys_dashboard_metrics AS
SELECT
  1::integer AS id,
  now() AS refreshed_at,
  (SELECT count(*)::bigint FROM public.profiles) AS total_users,
  (SELECT count(*)::bigint FROM public.profiles WHERE suspended_at IS NOT NULL) AS suspended_users,
  (
    SELECT count(*)::bigint
    FROM public.active_sessions
    WHERE revoked_at IS NULL
      AND expires_at > now()
  ) AS active_sessions_now,
  (
    SELECT count(*)::bigint
    FROM public.claim_requests
    WHERE status IN ('pending', 'pending_review', 'under_review')
  ) AS pending_claims,
  (
    SELECT count(*)::bigint
    FROM public.claim_requests
    WHERE status IN ('pending', 'pending_review', 'under_review')
      AND created_at < now() - interval '72 hours'
  ) AS overdue_claims,
  (
    SELECT count(*)::bigint
    FROM public.audit_logs
    WHERE created_at >= now() - interval '24 hours'
  ) AS audit_events_24h,
  (
    SELECT count(*)::bigint
    FROM public.mentor_profiles
    WHERE status = 'pending_review'
  ) AS pending_mentor_applications,
  (
    SELECT count(*)::bigint
    FROM public.staff_invitations
    WHERE accepted_at IS NULL
      AND expires_at > now()
  ) AS pending_staff_invites
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sys_dashboard_metrics_singleton
  ON public.mv_sys_dashboard_metrics (id);

-- ---------------------------------------------------------------------------
-- 3.5 RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_select_authenticated ON public.feature_flags;
CREATE POLICY feature_flags_select_authenticated
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS feature_flags_mutate_super_admin ON public.feature_flags;
CREATE POLICY feature_flags_mutate_super_admin
  ON public.feature_flags
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_config_select_admin ON public.platform_config;
CREATE POLICY platform_config_select_admin
  ON public.platform_config
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above() OR NOT is_secret);

DROP POLICY IF EXISTS platform_config_mutate_super_admin ON public.platform_config;
CREATE POLICY platform_config_mutate_super_admin
  ON public.platform_config
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

ALTER TABLE public.emergency_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emergency_actions_select_admin ON public.emergency_actions;
CREATE POLICY emergency_actions_select_admin
  ON public.emergency_actions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above());

DROP POLICY IF EXISTS emergency_actions_insert_super_admin ON public.emergency_actions;
CREATE POLICY emergency_actions_insert_super_admin
  ON public.emergency_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS emergency_actions_update_super_admin ON public.emergency_actions;
CREATE POLICY emergency_actions_update_super_admin
  ON public.emergency_actions
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

ALTER MATERIALIZED VIEW public.mv_sys_dashboard_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mv_sys_dashboard_metrics_select_admin ON public.mv_sys_dashboard_metrics;
CREATE POLICY mv_sys_dashboard_metrics_select_admin
  ON public.mv_sys_dashboard_metrics
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above());

-- ---------------------------------------------------------------------------
-- 3.6 is_feature_enabled(), refresh_sys_metrics()
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
    WHEN 'super_admin' THEN 5
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
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_flag_key;
  IF NOT FOUND OR NOT v_flag.is_enabled THEN
    RETURN false;
  END IF;

  IF auth.uid() IS NULL THEN
    v_role := 'individual'::public.user_role_enum;
  ELSE
    v_role := public.current_user_role();
    IF v_role IS NULL THEN
      v_role := 'individual'::public.user_role_enum;
    END IF;
  END IF;

  RETURN public._user_role_rank(v_role) >= public._user_role_rank(v_flag.min_role);
END;
$$;

REVOKE ALL ON FUNCTION public.is_feature_enabled(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_sys_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_sys_dashboard_metrics;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_sys_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_sys_metrics() TO service_role;

-- Initial populate (non-concurrent first refresh after WITH NO DATA)
REFRESH MATERIALIZED VIEW public.mv_sys_dashboard_metrics;

-- ---------------------------------------------------------------------------
-- Part D — cron (5-minute interval; 1-minute is aggressive on free-tier CPU/IO)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'refresh-sys-metrics';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'refresh-sys-metrics',
  '*/5 * * * *',
  $$ SELECT public.refresh_sys_metrics(); $$
);
