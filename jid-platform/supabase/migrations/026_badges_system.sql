-- Badges catalog and junction tables (Section 5 / Section 12 Step 3)

CREATE TYPE public.badge_category_enum AS ENUM (
  'individual',
  'company',
  'mentor',
  'university'
);

CREATE TABLE IF NOT EXISTS public.badges_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category public.badge_category_enum NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  icon_key text,
  is_auto_awarded boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges_catalog (id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.entity_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('company', 'university')),
  entity_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges_catalog (id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (entity_type, entity_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_entity_badges_entity ON public.entity_badges (entity_type, entity_id);

-- MVP catalog: 14 badges (early_adopter intentionally omitted — staging backfill only)
INSERT INTO public.badges_catalog (
  slug, category, name_ar, name_en, description_ar, description_en, icon_key, is_auto_awarded, sort_order
)
VALUES
  ('verified', 'individual', 'موثّق', 'Verified', 'أكمل التحقق من الهوية', 'Completed identity verification', 'badge-verified', true, 1),
  ('cv_builder', 'individual', 'باني السيرة', 'CV Builder', 'أنشأ سيرة ذاتية على المنصة', 'Created a CV on the platform', 'badge-cv', true, 2),
  ('profile_complete', 'individual', 'ملف مكتمل', 'Profile Complete', 'أكمل 100% من الملف الشخصي', 'Reached 100% profile completion', 'badge-complete', true, 3),
  ('mentorship_graduate', 'individual', 'خريج إرشاد', 'Mentorship Graduate', 'أكمل جلسة إرشاد مهني', 'Completed a mentorship session', 'badge-graduate', true, 4),
  ('jid_partner', 'company', 'شريك جِد', 'JID Partner', 'التزام مؤسسي مرتفع', 'High institutional commitment score', 'badge-partner', true, 10),
  ('quick_responder', 'company', 'استجابة سريعة', 'Quick Responder', 'متوسط استجابة منخفض', 'Low average response time', 'badge-fast', true, 11),
  ('verified_entity', 'company', 'جهة موثقة', 'Verified Entity', 'ملكية الجهة موثقة', 'Verified entity ownership', 'badge-entity', true, 12),
  ('honor_roll', 'company', 'لوحة الشرف', 'Honor Roll', 'ضمن لوحة الشرف', 'On the honor roll', 'badge-honor', true, 13),
  ('mentor_verified', 'mentor', 'مرشد موثّق', 'Verified Mentor', 'مرشد معتمد من المنصة', 'Platform-approved mentor', 'badge-mentor', true, 20),
  ('mentorship_active', 'mentor', 'إرشاد نشط', 'Active Mentor', 'أكمل جلسات إرشاد', 'Completed mentorship sessions', 'badge-active', true, 21),
  ('responsive_mentor', 'mentor', 'مرشد متجاوب', 'Responsive Mentor', 'زمن استجابة ممتاز', 'Excellent response time', 'badge-responsive', true, 22),
  ('partner_university', 'university', 'جامعة شريكة', 'Partner University', 'جامعة شريكة معتمدة', 'Accredited partner university', 'badge-uni', true, 30),
  ('verified_university', 'university', 'جامعة موثقة', 'Verified University', 'ملكية الجامعة موثقة', 'Verified university ownership', 'badge-uni-verified', true, 31),
  ('career_ready_campus', 'university', 'حرم جاهز للتوظيف', 'Career-Ready Campus', 'مؤشرات توظيف قوية', 'Strong graduate employment indicators', 'badge-campus', true, 32)
ON CONFLICT (slug) DO NOTHING;

-- Minimal tables for auto-award triggers (Section 7.1)
CREATE TABLE IF NOT EXISTS public.cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs (user_id);

CREATE TABLE IF NOT EXISTS public.mentorship_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_meetings_status ON public.mentorship_meetings (status);
