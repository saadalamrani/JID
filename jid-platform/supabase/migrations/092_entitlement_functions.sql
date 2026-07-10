-- 092_entitlement_functions.sql — Prompt 0 / logical migration 043
-- Entitlement RPCs, subscription expiry sweep, RLS policies.

-- ---------------------------------------------------------------------------
-- Entitlement RPCs (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_entitlement(p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
      AND pe.feature_key = p_feature
  );
$$;

CREATE OR REPLACE FUNCTION public.company_has_entitlement(p_company_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id
    WHERE s.company_id = p_company_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
      AND pe.feature_key = p_feature
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS TABLE (feature_key text, quota integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pe.feature_key, pe.quota
  FROM public.subscriptions s
  JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id
  WHERE s.user_id = auth.uid()
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > now();
$$;

REVOKE ALL ON FUNCTION public.has_entitlement(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.company_has_entitlement(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_entitlements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_entitlement(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_has_entitlement(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_has_entitlement(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Nightly subscription expiry sweep
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_lapsed_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND current_period_end < now()
    AND cancel_at_period_end = true;

  UPDATE public.subscriptions
  SET status = 'past_due', updated_at = now()
  WHERE status = 'active'
    AND current_period_end < now()
    AND cancel_at_period_end = false;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_lapsed_subscriptions() TO service_role;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR v_job_id IN
      SELECT jobid FROM cron.job WHERE jobname = 'expire-subscriptions'
    LOOP
      PERFORM cron.unschedule(v_job_id);
    END LOOP;

    PERFORM cron.schedule(
      'expire-subscriptions',
      '30 0 * * *',
      $$SELECT public.expire_lapsed_subscriptions();$$
    );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active plans" ON public.plans;
CREATE POLICY "Public reads active plans"
  ON public.plans
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public reads plan entitlements" ON public.plan_entitlements;
CREATE POLICY "Public reads plan entitlements"
  ON public.plan_entitlements
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "User sees own subscription" ON public.subscriptions;
CREATE POLICY "User sees own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT c.id
      FROM public.companies c
      WHERE c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
    OR (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ) IN ('staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Staff reads billing events" ON public.billing_events;
CREATE POLICY "Staff reads billing events"
  ON public.billing_events
  FOR SELECT
  USING (
    (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ) IN ('staff', 'super_admin')
  );

-- WRITES: only via SECURITY DEFINER functions / service-role webhook handler.
-- No direct INSERT/UPDATE policies on subscriptions or billing_events.
