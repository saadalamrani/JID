-- =============================================================================
-- SHAREABLE NON-PROD PREMIUM ENTITLEMENTS — JID_SHAREABLE_TEST_SEED_V2
-- =============================================================================
-- Grants complimentary / non-production test subscriptions for @jidseed.test
-- accounts only. Idempotent. No real payment provider charges. No fake paid
-- invoices.
--
-- Marker: JID_SHAREABLE_TEST_SEED_V2
-- payment_provider: nonprod_seed
-- =============================================================================

BEGIN;

SELECT set_config('jid.allow_role_change', 'on', true);

-- Ensure Model 1 plans exist (safe if already seeded by migration 099)
INSERT INTO public.plans (key, audience, name_ar, name_en, price_monthly_sar, price_yearly_sar, display_order)
VALUES
  ('jid_plus', 'user', 'جِد بلس', 'JID Plus', 49.00, 399.00, 1),
  ('employer_premium', 'company', 'بريميوم للشركات', 'Employer Premium', 999.00, 9990.00, 2),
  ('employer_enterprise', 'company', 'مؤسسات', 'Employer Enterprise', 2499.00, 24990.00, 3)
ON CONFLICT (key) DO UPDATE
SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  price_monthly_sar = EXCLUDED.price_monthly_sar,
  price_yearly_sar = EXCLUDED.price_yearly_sar,
  display_order = EXCLUDED.display_order,
  is_active = true;

INSERT INTO public.plan_entitlements (plan_id, feature_key, quota)
SELECT p.id, e.feature_key, e.quota
FROM public.plans p
CROSS JOIN (
  VALUES
    ('cv_pro_formats', NULL::integer),
    ('search_for_me', NULL::integer),
    ('lammah_feed', NULL::integer)
) AS e(feature_key, quota)
WHERE p.key = 'jid_plus'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_entitlements (plan_id, feature_key, quota)
SELECT p.id, e.feature_key, e.quota
FROM public.plans p
CROSS JOIN (
  VALUES
    ('smart_communication', NULL::integer),
    ('ssis', NULL::integer),
    ('priority_visibility', 3::integer)
) AS e(feature_key, quota)
WHERE p.key = 'employer_premium'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

INSERT INTO public.plan_entitlements (plan_id, feature_key, quota)
SELECT p.id, e.feature_key, e.quota
FROM public.plans p
CROSS JOIN (
  VALUES
    ('smart_communication', NULL::integer),
    ('ssis', NULL::integer),
    ('priority_visibility', 10::integer)
) AS e(feature_key, quota)
WHERE p.key = 'employer_enterprise'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Cancel any prior active subscriptions for deterministic seed subjects only
UPDATE public.subscriptions s
SET status = 'canceled', updated_at = now()
WHERE s.status IN ('active', 'trialing', 'past_due')
  AND (
    s.user_id IN (
      'b1000001-0000-4000-8000-000000000001', -- individual-complete
      'b1000002-0000-4000-8000-000000000002', -- individual-new
      'b1000003-0000-4000-8000-000000000003'  -- mentor-approved
    )
    OR s.company_id IN (
      'b2000001-0000-4000-8000-000000000001', -- verified business directory
      'b2000002-0000-4000-8000-000000000002'  -- pending business directory
    )
  );

-- JID Plus for individuals + mentor (user audience)
INSERT INTO public.subscriptions (
  id,
  subscriber_type,
  user_id,
  company_id,
  plan_id,
  billing_cycle,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  payment_provider,
  provider_ref,
  activated_by,
  created_at,
  updated_at
)
SELECT
  v.id,
  'user',
  v.user_id,
  NULL,
  p.id,
  'yearly',
  'active',
  now() - interval '1 day',
  now() + interval '365 days',
  false,
  'nonprod_seed',
  'JID_SHAREABLE_TEST_SEED_V2',
  NULL,
  now(),
  now()
FROM public.plans p
CROSS JOIN (
  VALUES
    ('b4000001-0000-4000-8000-000000000001'::uuid, 'b1000001-0000-4000-8000-000000000001'::uuid),
    ('b4000002-0000-4000-8000-000000000002'::uuid, 'b1000002-0000-4000-8000-000000000002'::uuid),
    ('b4000003-0000-4000-8000-000000000003'::uuid, 'b1000003-0000-4000-8000-000000000003'::uuid)
) AS v(id, user_id)
WHERE p.key = 'jid_plus'
ON CONFLICT (id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = 'active',
  billing_cycle = EXCLUDED.billing_cycle,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  cancel_at_period_end = false,
  payment_provider = 'nonprod_seed',
  provider_ref = 'JID_SHAREABLE_TEST_SEED_V2',
  updated_at = now();

-- Employer Premium for verified + pending business directory company_ids
-- Pending keeps entity/pending Verification authority; premium does not grant verified status.
INSERT INTO public.subscriptions (
  id,
  subscriber_type,
  user_id,
  company_id,
  plan_id,
  billing_cycle,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  payment_provider,
  provider_ref,
  activated_by,
  created_at,
  updated_at
)
SELECT
  v.id,
  'company',
  NULL,
  v.company_id,
  p.id,
  'yearly',
  'active',
  now() - interval '1 day',
  now() + interval '365 days',
  false,
  'nonprod_seed',
  'JID_SHAREABLE_TEST_SEED_V2',
  'b100000a-0000-4000-8000-00000000000a', -- admin seed actor as activator marker
  now(),
  now()
FROM public.plans p
CROSS JOIN (
  VALUES
    ('b4000004-0000-4000-8000-000000000004'::uuid, 'b2000001-0000-4000-8000-000000000001'::uuid),
    ('b4000005-0000-4000-8000-000000000005'::uuid, 'b2000002-0000-4000-8000-000000000002'::uuid)
) AS v(id, company_id)
WHERE p.key = 'employer_premium'
ON CONFLICT (id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = 'active',
  billing_cycle = EXCLUDED.billing_cycle,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  cancel_at_period_end = false,
  payment_provider = 'nonprod_seed',
  provider_ref = 'JID_SHAREABLE_TEST_SEED_V2',
  updated_at = now();

-- Honest billing_events (seed / complimentary / non-production) — no fake paid invoices
INSERT INTO public.billing_events (id, subscription_id, event_type, payload, created_at)
VALUES
  (
    'b4100001-0000-4000-8000-000000000001',
    'b4000001-0000-4000-8000-000000000001',
    'seed_activated',
    jsonb_build_object(
      'source', 'nonprod_seed',
      'marker', 'JID_SHAREABLE_TEST_SEED_V2',
      'plan_key', 'jid_plus',
      'kind', 'complimentary',
      'environment', 'non-production'
    ),
    now()
  ),
  (
    'b4100002-0000-4000-8000-000000000002',
    'b4000002-0000-4000-8000-000000000002',
    'seed_activated',
    jsonb_build_object(
      'source', 'nonprod_seed',
      'marker', 'JID_SHAREABLE_TEST_SEED_V2',
      'plan_key', 'jid_plus',
      'kind', 'complimentary',
      'environment', 'non-production'
    ),
    now()
  ),
  (
    'b4100003-0000-4000-8000-000000000003',
    'b4000003-0000-4000-8000-000000000003',
    'seed_activated',
    jsonb_build_object(
      'source', 'nonprod_seed',
      'marker', 'JID_SHAREABLE_TEST_SEED_V2',
      'plan_key', 'jid_plus',
      'kind', 'complimentary',
      'environment', 'non-production'
    ),
    now()
  ),
  (
    'b4100004-0000-4000-8000-000000000004',
    'b4000004-0000-4000-8000-000000000004',
    'seed_activated',
    jsonb_build_object(
      'source', 'nonprod_seed',
      'marker', 'JID_SHAREABLE_TEST_SEED_V2',
      'plan_key', 'employer_premium',
      'kind', 'complimentary',
      'environment', 'non-production'
    ),
    now()
  ),
  (
    'b4100005-0000-4000-8000-000000000005',
    'b4000005-0000-4000-8000-000000000005',
    'seed_activated',
    jsonb_build_object(
      'source', 'nonprod_seed',
      'marker', 'JID_SHAREABLE_TEST_SEED_V2',
      'plan_key', 'employer_premium',
      'kind', 'complimentary',
      'environment', 'non-production',
      'note', 'pending Verification — verified-only authority remains blocked'
    ),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  subscription_id = EXCLUDED.subscription_id,
  event_type = EXCLUDED.event_type,
  payload = EXCLUDED.payload;

COMMIT;
