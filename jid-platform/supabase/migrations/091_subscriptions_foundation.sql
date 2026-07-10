-- 091_subscriptions_foundation.sql — Prompt 0 / logical migration 042
-- Model 1 billing foundation: plans, entitlements, subscriptions, billing_events.

DO $$
BEGIN
  CREATE TYPE public.billing_cycle_enum AS ENUM ('monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.subscription_status_enum AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.subscriber_type_enum AS ENUM ('user', 'company');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  audience public.subscriber_type_enum NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price_monthly_sar numeric(10, 2) NOT NULL,
  price_yearly_sar numeric(10, 2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  plan_id uuid NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  quota integer,
  PRIMARY KEY (plan_id, feature_key),
  CONSTRAINT plan_entitlements_feature_key_chk CHECK (
    feature_key IN (
      'cv_pro_formats',
      'search_for_me',
      'lammah_feed',
      'smart_communication',
      'ssis',
      'priority_visibility'
    )
  )
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_type public.subscriber_type_enum NOT NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies (id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans (id),
  billing_cycle public.billing_cycle_enum NOT NULL,
  status public.subscription_status_enum NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_provider text,
  provider_ref text,
  activated_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_subscriber_xor_chk CHECK (
    (subscriber_type = 'user' AND user_id IS NOT NULL AND company_id IS NULL)
    OR (subscriber_type = 'company' AND company_id IS NOT NULL AND user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_subs_user
  ON public.subscriptions (user_id, status)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subs_company
  ON public.subscriptions (company_id, status)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subs_expiring
  ON public.subscriptions (current_period_end)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription
  ON public.billing_events (subscription_id, created_at DESC);
