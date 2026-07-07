-- Extend email quota guardrail with monthly limits (sys health dashboard).

INSERT INTO public.platform_config (key, value, description, is_secret, category, value_type)
VALUES (
  'email.monthly_quota',
  '120000',
  'Maximum notification emails sent per calendar month (Asia/Riyadh) before circuit opens.',
  false,
  'email',
  'number'
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = COALESCE(public.platform_config.description, EXCLUDED.description);

CREATE OR REPLACE FUNCTION public.email_quota_status()
RETURNS TABLE (
  daily_limit integer,
  sent_today integer,
  remaining integer,
  monthly_limit integer,
  sent_this_month integer,
  monthly_remaining integer,
  circuit_open boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_limit integer := 5000;
  v_monthly_limit integer := 120000;
  v_sent_today integer;
  v_sent_month integer;
  v_daily_config text;
  v_monthly_config text;
  v_riyadh_today date;
  v_riyadh_month_start date;
BEGIN
  v_riyadh_today := (now() AT TIME ZONE 'Asia/Riyadh')::date;
  v_riyadh_month_start := date_trunc('month', v_riyadh_today::timestamp)::date;

  SELECT pc.value INTO v_daily_config
  FROM public.platform_config pc
  WHERE pc.key = 'email.daily_quota';

  SELECT pc.value INTO v_monthly_config
  FROM public.platform_config pc
  WHERE pc.key = 'email.monthly_quota';

  IF v_daily_config IS NOT NULL AND v_daily_config ~ '^\d+$' THEN
    v_daily_limit := v_daily_config::integer;
  END IF;

  IF v_monthly_config IS NOT NULL AND v_monthly_config ~ '^\d+$' THEN
    v_monthly_limit := v_monthly_config::integer;
  END IF;

  SELECT count(*)::integer
  INTO v_sent_today
  FROM public.email_send_log esl
  WHERE esl.status = 'sent'
    AND esl.sent_at IS NOT NULL
    AND (esl.sent_at AT TIME ZONE 'Asia/Riyadh')::date = v_riyadh_today;

  SELECT count(*)::integer
  INTO v_sent_month
  FROM public.email_send_log esl
  WHERE esl.status = 'sent'
    AND esl.sent_at IS NOT NULL
    AND (esl.sent_at AT TIME ZONE 'Asia/Riyadh')::date >= v_riyadh_month_start
    AND (esl.sent_at AT TIME ZONE 'Asia/Riyadh')::date <= v_riyadh_today;

  daily_limit := v_daily_limit;
  sent_today := COALESCE(v_sent_today, 0);
  remaining := GREATEST(v_daily_limit - COALESCE(v_sent_today, 0), 0);
  monthly_limit := v_monthly_limit;
  sent_this_month := COALESCE(v_sent_month, 0);
  monthly_remaining := GREATEST(v_monthly_limit - COALESCE(v_sent_month, 0), 0);
  circuit_open :=
    COALESCE(v_sent_today, 0) >= v_daily_limit
    OR COALESCE(v_sent_month, 0) >= v_monthly_limit;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.email_quota_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_quota_status() TO service_role;
