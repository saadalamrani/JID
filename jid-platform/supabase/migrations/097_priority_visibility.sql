-- 097_priority_visibility.sql — Employer boost (Prompt 6)
-- Master doc names 049; 049 is jobs_required_skills — using 097.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS boost_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_boosted
  ON public.jobs (is_boosted, boost_ends_at)
  WHERE is_boosted = true;

CREATE TABLE IF NOT EXISTS public.job_boost_daily_stats (
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  card_opens INTEGER NOT NULL DEFAULT 0,
  intent_clicks INTEGER NOT NULL DEFAULT 0,
  declarations INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (job_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_job_boost_stats_job
  ON public.job_boost_daily_stats (job_id, stat_date DESC);

CREATE OR REPLACE FUNCTION public.toggle_job_boost(p_job_id UUID, p_enable BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_deadline TIMESTAMPTZ;
  v_quota INTEGER;
  v_active INTEGER;
  v_is_staff BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT j.company_id, j.application_deadline
  INTO v_company_id, v_deadline
  FROM public.jobs j
  WHERE j.id = p_job_id
    AND j.status IN ('published', 'closing_soon');

  IF v_company_id IS NULL THEN RAISE EXCEPTION 'job_not_boostable'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  ) INTO v_is_staff;

  IF NOT v_is_staff AND NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = v_company_id AND c.claimed_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT public.company_has_entitlement(v_company_id, 'priority_visibility') THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;

  IF p_enable THEN
    SELECT pe.quota INTO v_quota
    FROM public.subscriptions s
    JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id AND pe.feature_key = 'priority_visibility'
    WHERE s.company_id = v_company_id
      AND s.subscriber_type = 'company'
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > NOW()
    ORDER BY s.current_period_end DESC
    LIMIT 1;

    SELECT COUNT(*)::INTEGER INTO v_active
    FROM public.jobs j
    WHERE j.company_id = v_company_id
      AND j.is_boosted = true
      AND j.boost_ends_at > NOW();

    IF v_active >= COALESCE(v_quota, 0) THEN
      RAISE EXCEPTION 'boost_quota_exceeded';
    END IF;

    UPDATE public.jobs
    SET
      is_boosted = true,
      boost_starts_at = NOW(),
      boost_ends_at = LEAST(v_deadline, NOW() + INTERVAL '30 days'),
      updated_at = NOW()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.jobs
    SET
      is_boosted = false,
      boost_ends_at = NOW(),
      updated_at = NOW()
    WHERE id = p_job_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_job_boost(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.sweep_expired_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.jobs j
  SET is_boosted = false, updated_at = NOW()
  WHERE j.is_boosted = true
    AND (
      j.boost_ends_at < NOW()
      OR NOT public.company_has_entitlement(j.company_id, 'priority_visibility')
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

SELECT cron.schedule(
  'sweep-boosts',
  '45 0 * * *',
  $$SELECT public.sweep_expired_boosts();$$
);

CREATE OR REPLACE FUNCTION public.get_company_boost_usage(p_company_id UUID)
RETURNS TABLE(quota INTEGER, active_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT pe.quota
      FROM public.subscriptions s
      JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id AND pe.feature_key = 'priority_visibility'
      WHERE s.company_id = p_company_id
        AND s.subscriber_type = 'company'
        AND s.status IN ('active', 'trialing')
        AND s.current_period_end > NOW()
      ORDER BY s.current_period_end DESC
      LIMIT 1
    )::INTEGER AS quota,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.jobs j
      WHERE j.company_id = p_company_id
        AND j.is_boosted = true
        AND j.boost_ends_at > NOW()
    ) AS active_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_boost_usage(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_job_boost_stat(
  p_job_id UUID,
  p_metric TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id AND j.is_boosted = true AND j.boost_ends_at > NOW()
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.job_boost_daily_stats (job_id, stat_date)
  VALUES (p_job_id, CURRENT_DATE)
  ON CONFLICT (job_id, stat_date) DO NOTHING;

  IF p_metric = 'impressions' THEN
    UPDATE public.job_boost_daily_stats SET impressions = impressions + 1
    WHERE job_id = p_job_id AND stat_date = CURRENT_DATE;
  ELSIF p_metric = 'card_opens' THEN
    UPDATE public.job_boost_daily_stats SET card_opens = card_opens + 1
    WHERE job_id = p_job_id AND stat_date = CURRENT_DATE;
  ELSIF p_metric = 'intent_clicks' THEN
    UPDATE public.job_boost_daily_stats SET intent_clicks = intent_clicks + 1
    WHERE job_id = p_job_id AND stat_date = CURRENT_DATE;
  ELSIF p_metric = 'declarations' THEN
    UPDATE public.job_boost_daily_stats SET declarations = declarations + 1
    WHERE job_id = p_job_id AND stat_date = CURRENT_DATE;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_job_boost_stat(UUID, TEXT) TO anon, authenticated;

ALTER TABLE public.job_boost_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_boost_stats_company_read ON public.job_boost_daily_stats;
CREATE POLICY job_boost_stats_company_read
  ON public.job_boost_daily_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = job_boost_daily_stats.job_id
        AND (
          c.claimed_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
          )
        )
    )
  );

COMMENT ON COLUMN public.jobs.is_boosted IS
  'Priority visibility boost — ranking only; does NOT affect ابحثلي mandate scores.';
