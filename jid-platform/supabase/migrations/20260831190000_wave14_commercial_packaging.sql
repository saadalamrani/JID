-- Wave 14: commercial packaging catalog, honest price-adoption state,
-- owner-anchored billing RLS, and webhook/subscription idempotency.
-- Forward-only. Production is not a target of this migration.

DO $$
BEGIN
  CREATE TYPE public.commercial_actor AS ENUM ('individual', 'business', 'university', 'government');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.commercial_package_kind AS ENUM (
    'core_free',
    'paid_intelligence',
    'design_partner',
    'contract_only'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.price_adoption_status AS ENUM ('not_adopted', 'adopted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_adoption_status public.price_adoption_status NOT NULL DEFAULT 'not_adopted';

UPDATE public.plans
SET price_adoption_status = 'not_adopted'
WHERE price_adoption_status IS DISTINCT FROM 'not_adopted';

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_price_adoption_not_public_chk;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_price_adoption_not_public_chk
  CHECK (price_adoption_status = 'not_adopted');

INSERT INTO public.plans (key, audience, name_ar, name_en, price_monthly_sar, price_yearly_sar, display_order, price_adoption_status)
VALUES (
  'university_outcomes',
  'company',
  'مساحة المخرجات',
  'Outcomes Workspace',
  0,
  0,
  4,
  'not_adopted'
)
ON CONFLICT (key) DO UPDATE
SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  price_adoption_status = 'not_adopted',
  is_active = true;

CREATE TABLE IF NOT EXISTS public.commercial_packages (
  key text PRIMARY KEY,
  actor public.commercial_actor NOT NULL,
  kind public.commercial_package_kind NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  summary_ar text NOT NULL,
  summary_en text NOT NULL,
  included_ar text[] NOT NULL DEFAULT '{}',
  included_en text[] NOT NULL DEFAULT '{}',
  operational_plan_key text REFERENCES public.plans (key),
  price_adoption_status public.price_adoption_status NOT NULL DEFAULT 'not_adopted',
  is_public boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL,
  excluded_claims text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT commercial_package_key_format CHECK (key ~ '^[a-z0-9_]+$'),
  CONSTRAINT commercial_package_price_not_adopted_chk CHECK (price_adoption_status = 'not_adopted'),
  CONSTRAINT commercial_package_excluded_claims_chk CHECK (
    excluded_claims @> ARRAY[
      'pay_to_win_organic',
      'privacy_paywall',
      'job_guarantee',
      'data_sale',
      'fabricated_price',
      'government_endorsement'
    ]::text[]
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_packages_actor_order_uidx
  ON public.commercial_packages (actor, display_order);

INSERT INTO public.commercial_packages (
  key, actor, kind, name_ar, name_en, summary_ar, summary_en,
  included_ar, included_en, operational_plan_key, price_adoption_status,
  is_public, display_order, excluded_claims
) VALUES
(
  'individual_core', 'individual', 'core_free',
  'الأساس للفرد', 'Individual Core',
  'السجل المهني، حقوق البيانات، اكتشاف الفرص، والمشاركة المهنية الأساسية تبقى مجانية.',
  'Career Record, data rights, opportunity discovery, and core professional participation stay free.',
  ARRAY['السجل المهني المعياري وضوابط الخصوصية','اكتشاف الفرص الأساسية وتتبع رادار','حقوق الوصول والتصحيح والتصدير والحذف'],
  ARRAY['Canonical Career Record and privacy controls','Core opportunity discovery and Radar tracking','Access, correction, export, and deletion rights'],
  NULL, 'not_adopted', true, 10,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'jid_plus', 'individual', 'paid_intelligence',
  'جِد بلس', 'JID Plus',
  'ذكاء ومسار عمل متكرر للفرد بعد إثبات الفائدة. السعر غير معتمد بعد.',
  'Recurring individual intelligence and workflow after proven utility. Price is not adopted yet.',
  ARRAY['صيغ سيرة مهنية إضافية','تغذية لمّاح الخارجية عند توفر مصدر حقيقي'],
  ARRAY['Additional professional CV formats','Lammah external feed when a real source exists'],
  'jid_plus', 'not_adopted', true, 20,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'employer_starter', 'business', 'core_free',
  'بدء جهة التوظيف', 'Employer Starter',
  'مسار التوظيف الأساسي: الفرصة، المسار، التواصل، والمراجعة المنظمة.',
  'Core hiring workflow: opportunity, pipeline, communication, and structured review.',
  ARRAY['نشر الفرص الأصلية','مسار المتقدمين','مراجعة منظمة دون ترتيب مدفوع'],
  ARRAY['Native opportunity publication','Applicant pipeline','Structured review without paid ranking'],
  NULL, 'not_adopted', true, 30,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'employer_growth', 'business', 'design_partner',
  'نمو جهة التوظيف', 'Employer Growth',
  'أدوار الفريق، الفحص، والتواصل المدعوم. التفعيل عبر شراكة تصميم أو مبيعات.',
  'Team roles, screening, and assisted communication. Activation is design-partner or sales-led.',
  ARRAY['التواصل داخل جِد','الفحص الأولي','حصّة ظهور مدفوع منفصلة عن الترتيب العضوي'],
  ARRAY['In-platform communication','Initial screening','Labeled paid visibility separate from organic ranking'],
  'employer_premium', 'not_adopted', true, 40,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'employer_enterprise', 'business', 'contract_only',
  'عقد المؤسسات', 'Employer Enterprise',
  'عقد سنوي للحوكمة، التكامل، وبرامج التوظيف. ليس دفعاً ذاتياً.',
  'Annual contract for governance, integrations, and hiring programs. Not self-serve checkout.',
  ARRAY['صلاحيات أوسع للفريق','أساس التكامل (الموجة 13)','تفعيل يدوي مع سجل تدقيق'],
  ARRAY['Broader team authority','Integration foundation (Wave 13)','Manual activation with an audit record'],
  'employer_enterprise', 'not_adopted', true, 50,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'university_core', 'university', 'core_free',
  'أساس الجامعة', 'University Core',
  'الهوية، الانتماء، الأفواج، والتقارير المنهجية تبقى متاحة دون حاجز خصوصية مدفوع.',
  'Identity, affiliation, cohorts, and methodology-visible reporting stay available without a privacy paywall.',
  ARRAY['ملف الجامعة المملوك','الانتماء المعلن/الموثّق','تقارير التغطية والمنهجية'],
  ARRAY['Owned university profile','Declared/verified affiliation','Coverage and methodology reports'],
  NULL, 'not_adopted', true, 60,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'university_readiness', 'university', 'design_partner',
  'جاهزية القياس', 'University Readiness',
  'عمل منهجي مدفوع لاكتشاف الجاهزية. ليس اشتراكاً منشوراً بسعر.',
  'Paid methodology/readiness discovery work. Not a published-price subscription.',
  ARRAY['مراجعة منهجية القياس','تحديد الفجوات في التغطية','اتفاق شراكة تصميم'],
  ARRAY['Measurement methodology review','Coverage-gap identification','Design-partner agreement'],
  NULL, 'not_adopted', true, 70,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'university_outcomes', 'university', 'contract_only',
  'مساحة المخرجات', 'Outcomes Workspace',
  'عقد سنوي لمساحة الانتقال والمخرجات حسب نطاق الفوج/البرنامج.',
  'Annual contract for the transition/outcomes workspace by cohort or program scope.',
  ARRAY['مساحة تشغيل سنوية','تقارير مؤسسية بمنهجية ظاهرة','بدون ترتيب أو متوسط وطني مختلق'],
  ARRAY['Annual operating workspace','Institutional reports with visible methodology','No fabricated ranking or national average'],
  'university_outcomes', 'not_adopted', true, 80,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'university_implementation', 'university', 'contract_only',
  'التنفيذ والربط', 'Implementation',
  'رسوم تنفيذ/ربط ظاهرة بشكل منفصل عن عقد المساحة السنوي.',
  'Implementation or integration work, priced separately from the annual workspace contract.',
  ARRAY['ربط البيانات عند وجود سلطة','تشغيل أولي','فاتورة منفصلة عن الاشتراك'],
  ARRAY['Data linkage where authority exists','Initial operating setup','Invoice separate from subscription'],
  NULL, 'not_adopted', true, 90,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
),
(
  'government_contract', 'government', 'contract_only',
  'تعاقد حكومي', 'Government contract',
  'الحكومة ليست فاعلاً رابعاً في السوق. أي عمل يتم عبر عقد بصلاحية صريحة.',
  'Government is not a fourth marketplace actor. Any work is contract-only with explicit authority.',
  ARRAY['تعاقد بسلطة واضحة','لا بيع لبيانات الأفراد','لا إحصاء رسمي من المنصة'],
  ARRAY['Contract with explicit authority','No sale of individual data','No official national statistics claim'],
  NULL, 'not_adopted', false, 100,
  ARRAY['pay_to_win_organic','privacy_paywall','job_guarantee','data_sale','fabricated_price','government_endorsement']
)
ON CONFLICT (key) DO UPDATE
SET
  actor = EXCLUDED.actor,
  kind = EXCLUDED.kind,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  summary_ar = EXCLUDED.summary_ar,
  summary_en = EXCLUDED.summary_en,
  included_ar = EXCLUDED.included_ar,
  included_en = EXCLUDED.included_en,
  operational_plan_key = EXCLUDED.operational_plan_key,
  price_adoption_status = 'not_adopted',
  is_public = EXCLUDED.is_public,
  display_order = EXCLUDED.display_order,
  excluded_claims = EXCLUDED.excluded_claims;

ALTER TABLE public.billing_events
  ADD COLUMN IF NOT EXISTS provider_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_id_uidx
  ON public.billing_events (provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_provider_ref_idx
  ON public.subscriptions (payment_provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

DROP POLICY IF EXISTS "User sees own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner sees own subscription" ON public.subscriptions;
CREATE POLICY "Owner sees own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT bp.directory_id
      FROM public.business_profiles bp
      WHERE bp.owner_user_id = auth.uid()
      UNION
      SELECT up.directory_id
      FROM public.university_profiles up
      WHERE up.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('staff', 'super_admin')
    )
  );

ALTER TABLE public.commercial_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commercial_packages_public_read ON public.commercial_packages;
CREATE POLICY commercial_packages_public_read
  ON public.commercial_packages
  FOR SELECT
  TO authenticated
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  ));

CREATE OR REPLACE FUNCTION public.plan_price_is_adopted(p_plan_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.plans
    WHERE key = p_plan_key
      AND is_active = true
      AND price_adoption_status = 'adopted'
  );
$$;
