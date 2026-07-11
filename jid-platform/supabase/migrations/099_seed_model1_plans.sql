-- 099_seed_model1_plans.sql — Prompt 0 plan registry + entitlements seed
-- Run after 091_subscriptions_foundation.sql if plans table is empty.

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

-- JID Plus entitlements (B2C)
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

-- Employer Premium entitlements
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

-- Employer Enterprise entitlements (higher boost quota)
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
