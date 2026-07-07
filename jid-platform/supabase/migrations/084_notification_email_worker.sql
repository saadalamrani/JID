-- Section 6 — notification email worker schema (delivery columns + quota guardrail).

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS delivered_via_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_message_id text;

CREATE INDEX IF NOT EXISTS idx_notifications_email_pending
  ON public.notifications (created_at DESC)
  WHERE delivered_via_email = false
    AND email_sent_at IS NULL
    AND archived_at IS NULL;

INSERT INTO public.platform_config (key, value, description, is_secret, category, value_type)
VALUES (
  'email.daily_quota',
  '5000',
  'Maximum notification emails sent per calendar day (Asia/Riyadh) before circuit opens.',
  false,
  'email',
  'number'
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = COALESCE(public.platform_config.description, EXCLUDED.description);

-- ---------------------------------------------------------------------------
-- email_quota_status — cost guardrail / circuit breaker for the email worker
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.email_quota_status()
RETURNS TABLE (
  daily_limit integer,
  sent_today integer,
  remaining integer,
  circuit_open boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := 5000;
  v_sent integer;
  v_config text;
BEGIN
  SELECT pc.value
  INTO v_config
  FROM public.platform_config pc
  WHERE pc.key = 'email.daily_quota';

  IF v_config IS NOT NULL AND v_config ~ '^\d+$' THEN
    v_limit := v_config::integer;
  END IF;

  SELECT count(*)::integer
  INTO v_sent
  FROM public.email_send_log esl
  WHERE esl.status = 'sent'
    AND esl.sent_at IS NOT NULL
    AND (esl.sent_at AT TIME ZONE 'Asia/Riyadh')::date =
        (now() AT TIME ZONE 'Asia/Riyadh')::date;

  daily_limit := v_limit;
  sent_today := COALESCE(v_sent, 0);
  remaining := GREATEST(v_limit - COALESCE(v_sent, 0), 0);
  circuit_open := COALESCE(v_sent, 0) >= v_limit;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.email_quota_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_quota_status() TO service_role;

COMMENT ON FUNCTION public.email_quota_status IS
  'Daily Resend send quota — worker short-circuits when circuit_open is true.';
