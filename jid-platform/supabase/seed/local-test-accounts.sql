-- =============================================================================
-- LOCAL TEST ACCOUNTS — deterministic fixtures for manual portal testing
-- Password for ALL accounts below: JidSeed123!
-- Domain: @jidseed.test (fixtures for local + approved NON-PROD cloud only)
-- Never apply against production / jid.sa.
-- Local: `pnpm seed:local` / `supabase db reset`
-- Non-prod cloud: `pnpm seed:cloud-test --execute --i-confirm-non-production`
-- Idempotent: safe to re-run
-- =============================================================================
-- Architecture notes (Step 0):
--   • Public actors: Individual | Business (company_admin) | University (university_admin)
--   • Staff / super_admin are internal roles on profiles.role
--   • Mentors remain role=individual + mentor_profiles row
--   • Directory (companies) ≠ owned Layer-3 profiles
--   • No mentor_articles table — articles not seeded
--   • No Evidence Vault table — not seeded
--   • No entity membership seats table — owner is sole business/uni operator
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Allow privileged role assignment during seed (prevent_role_self_escalation).
-- Must be inside a transaction — is_local=true resets at COMMIT.
SELECT set_config('jid.allow_role_change', 'on', true);

-- ---------------------------------------------------------------------------
-- Stable UUIDs (b1… namespace — avoids collisions with seed.sql a0/d0/e0 fixtures)
-- ---------------------------------------------------------------------------
-- Users
-- b1000001 = individual-complete
-- b1000002 = individual-new
-- b1000003 = mentor-approved
-- b1000004 = mentee (supporting fixture for reviews; login optional)
-- b1000005 = business-verified
-- b1000006 = business-pending
-- b1000007 = university-verified
-- b1000008 = university-pending
-- b1000009 = staff
-- b100000a = admin (super_admin)
-- Directory
-- b2000001 = Seed Verified Business Co (directory)
-- b2000002 = Seed Pending Business Co (directory)
-- b2000003 = Seed Verified University (directory as entity_type=university)
-- b2000004 = Seed Pending University (directory)
-- Profiles / ops
-- b3000001 = business_profiles (verified)
-- b3000002 = university_profiles (verified)
-- b3000003 = verification approved business
-- b3000004 = verification pending business
-- b3000005 = verification approved university
-- b3000006 = verification pending university
-- b3000007 = job published
-- b3000008 = job draft
-- b3000009 = application
-- b300000a = mentorship_request (completed path)
-- b300000b = mentorship_meeting completed
-- b300000c/d/e = mentor_reviews (named / anonymous / private)
-- b300000f = cvs for individual-complete
-- b3000010.. = cv child rows

-- =============================================================================
-- Helper: upsert auth user + email identity
-- =============================================================================

CREATE OR REPLACE FUNCTION public._seed_local_auth_user(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_password text DEFAULT 'JidSeed123!'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = p_id AND i.provider = 'email'
  );
END;
$$;

REVOKE ALL ON FUNCTION public._seed_local_auth_user(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- 1–2 · Individuals (+ supporting mentee)
-- =============================================================================

SELECT public._seed_local_auth_user(
  'b1000001-0000-4000-8000-000000000001',
  'individual-complete@jidseed.test',
  'Sara Al-Harbi'
);
SELECT public._seed_local_auth_user(
  'b1000002-0000-4000-8000-000000000002',
  'individual-new@jidseed.test',
  'New Seeker'
);
SELECT public._seed_local_auth_user(
  'b1000004-0000-4000-8000-000000000004',
  'mentee-fixture@jidseed.test',
  'Mentee Fixture'
);

-- Resolve KSU catalog id for education / university visibility linkage
DO $$
DECLARE
  v_ksu uuid;
BEGIN
  SELECT id INTO v_ksu FROM public.universities_catalog WHERE short_code = 'KSU' LIMIT 1;

  INSERT INTO public.profiles (
    id, full_name, role, locale, visibility, profile_state,
    headline, about_me, avatar_url, linkedin_url,
    university_id, college_id, target_sectors, target_regions,
    show_profile_to_companies, show_profile_in_university_stats,
    show_application_history, allow_company_direct_contact,
    onboarding_started_at, onboarding_completed_at,
    profile_completion_pct
  )
  VALUES
  (
    'b1000001-0000-4000-8000-000000000001',
    'Sara Al-Harbi',
    'individual',
    'ar',
    'public',
    'active',
    'Software engineer · Riyadh',
    'Graduate building products for the Saudi talent market. Open to full-time software roles.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=individual-complete',
    'https://www.linkedin.com/in/sara-alharbi-jidseed',
    v_ksu,
    (SELECT id FROM public.colleges_catalog WHERE university_id = v_ksu LIMIT 1),
    ARRAY['Technology', 'FinTech'],
    ARRAY['Riyadh'],
    true,
    true,  -- consent: visible to university / graduate directory
    true,
    true,
    now() - interval '14 days',
    now() - interval '7 days',
    100
  ),
  (
    'b1000002-0000-4000-8000-000000000002',
    'New Seeker',
    'individual',
    'ar',
    'private',
    'incomplete',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}',
    '{}',
    false,
    false,
    false,
    false,
    now() - interval '1 day',
    NULL,  -- onboarding not completed
    5
  ),
  (
    'b1000004-0000-4000-8000-000000000004',
    'Mentee Fixture',
    'individual',
    'ar',
    'private',
    'active',
    'Mentee for mentor review fixtures',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}',
    '{}',
    false,
    false,
    false,
    false,
    now() - interval '30 days',
    now() - interval '20 days',
    40
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    visibility = EXCLUDED.visibility,
    profile_state = EXCLUDED.profile_state,
    headline = EXCLUDED.headline,
    about_me = EXCLUDED.about_me,
    avatar_url = EXCLUDED.avatar_url,
    linkedin_url = EXCLUDED.linkedin_url,
    university_id = EXCLUDED.university_id,
    college_id = EXCLUDED.college_id,
    target_sectors = EXCLUDED.target_sectors,
    target_regions = EXCLUDED.target_regions,
    show_profile_to_companies = EXCLUDED.show_profile_to_companies,
    show_profile_in_university_stats = EXCLUDED.show_profile_in_university_stats,
    show_application_history = EXCLUDED.show_application_history,
    allow_company_direct_contact = EXCLUDED.allow_company_direct_contact,
    onboarding_started_at = EXCLUDED.onboarding_started_at,
    onboarding_completed_at = EXCLUDED.onboarding_completed_at,
    profile_completion_pct = EXCLUDED.profile_completion_pct,
    updated_at = now();
END;
$$;

-- Skills (complete individual) — no percentage fields
INSERT INTO public.skills (id, name, name_ar)
VALUES
  ('b4000001-0000-4000-8000-000000000001', 'TypeScript', 'تايب سكريبت'),
  ('b4000002-0000-4000-8000-000000000002', 'PostgreSQL', 'بوستgres'),
  ('b4000003-0000-4000-8000-000000000003', 'Product Thinking', 'تفكير المنتجات')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profile_skills (profile_id, skill_id)
VALUES
  ('b1000001-0000-4000-8000-000000000001', 'b4000001-0000-4000-8000-000000000001'),
  ('b1000001-0000-4000-8000-000000000001', 'b4000002-0000-4000-8000-000000000002'),
  ('b1000001-0000-4000-8000-000000000001', 'b4000003-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;

-- CV snapshot for complete individual (Career Record / Timeline / Canvas UI sources)
INSERT INTO public.cvs (
  id, user_id, title, status, locale, is_primary,
  full_name, email, phone, city, country,
  summary, technical_skills, languages
)
VALUES (
  'b300000f-0000-4000-8000-00000000000f',
  'b1000001-0000-4000-8000-000000000001',
  'Sara Al-Harbi — Primary CV',
  'draft',
  'ar',
  true,
  'Sara Al-Harbi',
  'individual-complete@jidseed.test',
  '+966500000101',
  'Riyadh',
  'Saudi Arabia',
  'Software engineer focused on hiring-platform products.',
  '["TypeScript", "PostgreSQL", "React"]'::jsonb,
  '[{"name":"Arabic","level":"native"},{"name":"English","level":"fluent"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  summary = EXCLUDED.summary,
  technical_skills = EXCLUDED.technical_skills,
  languages = EXCLUDED.languages,
  updated_at = now();

DELETE FROM public.cv_education WHERE cv_id = 'b300000f-0000-4000-8000-00000000000f';
INSERT INTO public.cv_education (
  id, cv_id, institution_name, degree, field_of_study,
  start_year, end_year, graduation_year, is_current, sort_order,
  institution_city, institution_country
)
VALUES (
  'b3000010-0000-4000-8000-000000000010',
  'b300000f-0000-4000-8000-00000000000f',
  'King Saud University',
  'BSc',
  'Computer Science',
  2018, 2022, 2022, false, 0,
  'Riyadh', 'Saudi Arabia'
);

DELETE FROM public.cv_experience WHERE cv_id = 'b300000f-0000-4000-8000-00000000000f';
INSERT INTO public.cv_experience (
  id, cv_id, company_name, job_title, location,
  start_year, end_year, is_current, bullets, sort_order,
  company_city, company_country
)
VALUES (
  'b3000011-0000-4000-8000-000000000011',
  'b300000f-0000-4000-8000-00000000000f',
  'Approved Tech Corp',
  'Software Engineer',
  'Riyadh',
  2022, NULL, true,
  ARRAY['Shipped applicant tracking improvements used by hiring teams.', 'Reduced review latency for shortlist workflows.'],
  0,
  'Riyadh', 'Saudi Arabia'
);

DELETE FROM public.cv_additional WHERE cv_id = 'b300000f-0000-4000-8000-00000000000f';
INSERT INTO public.cv_additional (id, cv_id, category, title, issuer, description, start_date, sort_order)
VALUES
  (
    'b3000012-0000-4000-8000-000000000012',
    'b300000f-0000-4000-8000-00000000000f',
    'certification',
    'AWS Cloud Practitioner',
    'Amazon Web Services',
    'Foundational cloud certification.',
    '2024-06-01',
    0
  ),
  (
    'b3000013-0000-4000-8000-000000000013',
    'b300000f-0000-4000-8000-00000000000f',
    'project',
    'Campus Career Portal Prototype',
    'Personal',
    'Prototype matching graduates to internship listings.',
    '2023-01-01',
    1
  );

-- Hidden graduate for university consent testing (education pointer + privacy off)
UPDATE public.profiles
SET
  university_id = (SELECT id FROM public.universities_catalog WHERE short_code = 'KSU' LIMIT 1),
  show_profile_in_university_stats = false,
  visibility = 'private'
WHERE id = 'b1000002-0000-4000-8000-000000000002';

-- =============================================================================
-- 3 · Approved mentor (+ reviews / response analytics fixtures)
-- =============================================================================

SELECT public._seed_local_auth_user(
  'b1000003-0000-4000-8000-000000000003',
  'mentor-approved@jidseed.test',
  'Noura Al-Qahtani'
);

INSERT INTO public.profiles (
  id, full_name, role, locale, visibility, profile_state,
  headline, avatar_url, onboarding_completed_at, profile_completion_pct
)
VALUES (
  'b1000003-0000-4000-8000-000000000003',
  'Noura Al-Qahtani',
  'individual',
  'ar',
  'public',
  'active',
  'Product mentor for early-career engineers',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor-approved-jidseed',
  now() - interval '60 days',
  80
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = 'individual',
  visibility = EXCLUDED.visibility,
  headline = EXCLUDED.headline,
  avatar_url = EXCLUDED.avatar_url,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  updated_at = now();

INSERT INTO public.mentor_profiles (
  user_id, status, slug, headline, bio_short, bio_long,
  avg_response_hours, career_history, rating_avg, sessions_count,
  expertise_sectors, expertise_areas, specializations, languages,
  preferred_mediums, nationality, years_experience,
  is_accepting_requests, is_mentor_of_month
)
VALUES (
  'b1000003-0000-4000-8000-000000000003',
  'approved',
  'noura-al-qahtani',
  'I help graduates ship their first product portfolio.',
  'Mentor for interview prep and first 90 days on the job.',
  'Former PM at a Riyadh fintech. Focus on portfolio reviews and behavioral interviews.',
  6.0,
  '[{"title":"Product Manager","company":"Fintech SA","start_year":2016,"end_year":2024}]'::jsonb,
  4.7,
  1,
  ARRAY['Technology', 'Product'],
  ARRAY['Interview Prep', 'Portfolio Review'],
  ARRAY['New Graduates', 'Product'],
  ARRAY['ar', 'en'],
  ARRAY['video', 'chat'],
  'SA',
  10,
  true,
  false
)
ON CONFLICT (user_id) DO UPDATE SET
  status = 'approved',
  slug = EXCLUDED.slug,
  headline = EXCLUDED.headline,
  bio_short = EXCLUDED.bio_short,
  bio_long = EXCLUDED.bio_long,
  avg_response_hours = EXCLUDED.avg_response_hours,
  career_history = EXCLUDED.career_history,
  rating_avg = EXCLUDED.rating_avg,
  sessions_count = EXCLUDED.sessions_count,
  expertise_sectors = EXCLUDED.expertise_sectors,
  expertise_areas = EXCLUDED.expertise_areas,
  specializations = EXCLUDED.specializations,
  languages = EXCLUDED.languages,
  preferred_mediums = EXCLUDED.preferred_mediums,
  years_experience = EXCLUDED.years_experience,
  is_accepting_requests = EXCLUDED.is_accepting_requests,
  updated_at = now();

-- Request → accepted with responded_at (analytics) + completed meeting + reviews
INSERT INTO public.mentorship_requests (
  id, mentee_id, mentor_id, status, message, focus_area,
  intent_statement, created_at, responded_at, updated_at
)
VALUES (
  'b300000a-0000-4000-8000-00000000000a',
  'b1000004-0000-4000-8000-000000000004',
  'b1000003-0000-4000-8000-000000000003',
  'accepted',
  'Looking for portfolio review before interviews.',
  'Interview Prep',
  'I am preparing for product analyst interviews and need feedback on my case-study portfolio and storytelling.',
  now() - interval '10 days',
  now() - interval '9 days 18 hours',
  now() - interval '9 days'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'accepted',
  responded_at = EXCLUDED.responded_at,
  focus_area = EXCLUDED.focus_area,
  updated_at = now();

INSERT INTO public.mentorship_meetings (
  id, mentor_id, mentee_id, request_id, status,
  scheduled_at, completed_at, duration_minutes, medium
)
VALUES (
  'b300000b-0000-4000-8000-00000000000b',
  'b1000003-0000-4000-8000-000000000003',
  'b1000004-0000-4000-8000-000000000004',
  'b300000a-0000-4000-8000-00000000000a',
  'completed',
  now() - interval '5 days',
  now() - interval '5 days' + interval '45 minutes',
  45,
  'video'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'completed',
  completed_at = EXCLUDED.completed_at,
  updated_at = now();

-- Second declined request for acceptance-rate math (genuine data)
INSERT INTO public.mentorship_requests (
  id, mentee_id, mentor_id, status, message, focus_area,
  intent_statement, created_at, responded_at, decline_reason
)
VALUES (
  'b3000014-0000-4000-8000-000000000014',
  'b1000001-0000-4000-8000-000000000001',
  'b1000003-0000-4000-8000-000000000003',
  'declined',
  'Quick chat about switching into PM.',
  'Career Transition',
  'I want to transition from engineering into product management within six months and need a realistic plan.',
  now() - interval '20 days',
  now() - interval '19 days',
  'Calendar full this month'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'declined',
  responded_at = EXCLUDED.responded_at;

DELETE FROM public.mentor_reviews
WHERE meeting_id = 'b300000b-0000-4000-8000-00000000000b';

INSERT INTO public.mentor_reviews (
  id, meeting_id, mentor_id, reviewer_id, rating, review_text, visibility
)
VALUES
  (
    'b300000c-0000-4000-8000-00000000000c',
    'b300000b-0000-4000-8000-00000000000b',
    'b1000003-0000-4000-8000-000000000003',
    'b1000004-0000-4000-8000-000000000004',
    5,
    'Clear, actionable portfolio feedback. Highly recommend.',
    'public_named'
  );

-- Extra completed meetings for anonymous + private reviews (one review per meeting)
INSERT INTO public.mentorship_meetings (
  id, mentor_id, mentee_id, status, scheduled_at, completed_at, duration_minutes
)
VALUES
  (
    'b3000015-0000-4000-8000-000000000015',
    'b1000003-0000-4000-8000-000000000003',
    'b1000004-0000-4000-8000-000000000004',
    'completed',
    now() - interval '40 days',
    now() - interval '40 days' + interval '30 minutes',
    30
  ),
  (
    'b3000016-0000-4000-8000-000000000016',
    'b1000003-0000-4000-8000-000000000003',
    'b1000004-0000-4000-8000-000000000004',
    'completed',
    now() - interval '55 days',
    now() - interval '55 days' + interval '30 minutes',
    30
  )
ON CONFLICT (id) DO UPDATE SET status = 'completed', completed_at = EXCLUDED.completed_at;

DELETE FROM public.mentor_reviews
WHERE id IN (
  'b300000d-0000-4000-8000-00000000000d',
  'b300000e-0000-4000-8000-00000000000e'
);

INSERT INTO public.mentor_reviews (
  id, meeting_id, mentor_id, reviewer_id, rating, review_text, visibility
)
VALUES
  (
    'b300000d-0000-4000-8000-00000000000d',
    'b3000015-0000-4000-8000-000000000015',
    'b1000003-0000-4000-8000-000000000003',
    'b1000004-0000-4000-8000-000000000004',
    4,
    'Helpful session on behavioral questions.',
    'public_anonymous'
  ),
  (
    'b300000e-0000-4000-8000-00000000000e',
    'b3000016-0000-4000-8000-000000000016',
    'b1000003-0000-4000-8000-000000000003',
    'b1000004-0000-4000-8000-000000000004',
    3,
    'Private note — scheduling was tight but content was fine.',
    'private'
  );

-- =============================================================================
-- 4–5 · Business verified + pending
-- =============================================================================

-- Directory rows (Layer 1) — not owned profiles
INSERT INTO public.companies (
  id, name, name_ar, domains, entity_type, entity_state,
  is_verified, is_active, slug, description_en, description_ar
)
VALUES
  (
    'b2000001-0000-4000-8000-000000000001',
    'Seed Verified Business Co',
    'شركة البذور المعتمدة',
    ARRAY['seed-verified.jidseed.test'],
    'business',
    'approved',
    true,
    true,
    'seed-verified-business-co',
    'Local seed directory company for verified business portal testing.',
    'شركة دليل محلية لاختبار بوابة الأعمال المعتمدة.'
  ),
  (
    'b2000002-0000-4000-8000-000000000002',
    'Seed Pending Business Co',
    'شركة البذور قيد المراجعة',
    ARRAY['seed-pending.jidseed.test'],
    'business',
    'unclaimed',
    false,
    true,
    'seed-pending-business-co',
    'Directory row for pending verification UX.',
    'سجل دليل لحالة التحقق المعلقة.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domains = EXCLUDED.domains,
  entity_type = 'business',
  entity_state = EXCLUDED.entity_state,
  is_verified = EXCLUDED.is_verified,
  updated_at = now();

SELECT public._seed_local_auth_user(
  'b1000005-0000-4000-8000-000000000005',
  'business-verified@jidseed.test',
  'Business Verified Owner'
);
SELECT public._seed_local_auth_user(
  'b1000006-0000-4000-8000-000000000006',
  'business-pending@jidseed.test',
  'Business Pending Owner'
);

INSERT INTO public.profiles (id, full_name, role, locale, visibility, profile_state, onboarding_completed_at)
VALUES
  (
    'b1000005-0000-4000-8000-000000000005',
    'Business Verified Owner',
    'company_admin',
    'ar',
    'private',
    'active',
    now() - interval '3 days'
  ),
  (
    'b1000006-0000-4000-8000-000000000006',
    'Business Pending Owner',
    'entity',
    'ar',
    'private',
    'incomplete',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  profile_state = EXCLUDED.profile_state,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  updated_at = now();

INSERT INTO public.verification_requests (
  id, applicant_user_id, directory_id, company_name, business_email,
  claimant_name, status, verification_type, reviewed_at, verified_domains,
  resulting_profile_id, resulting_profile_type
)
VALUES
  (
    'b3000003-0000-4000-8000-000000000003',
    'b1000005-0000-4000-8000-000000000005',
    'b2000001-0000-4000-8000-000000000001',
    'Seed Verified Business Co',
    'business-verified@seed-verified.jidseed.test',
    'Business Verified Owner',
    'approved',
    'business',
    now() - interval '2 days',
    ARRAY['seed-verified.jidseed.test'],
    'b3000001-0000-4000-8000-000000000001',
    'business'
  ),
  (
    'b3000004-0000-4000-8000-000000000004',
    'b1000006-0000-4000-8000-000000000006',
    'b2000002-0000-4000-8000-000000000002',
    'Seed Pending Business Co',
    'business-pending@seed-pending.jidseed.test',
    'Business Pending Owner',
    'pending_review',
    'business',
    NULL,
    '{}',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  reviewed_at = EXCLUDED.reviewed_at,
  resulting_profile_id = EXCLUDED.resulting_profile_id,
  resulting_profile_type = EXCLUDED.resulting_profile_type,
  verified_domains = EXCLUDED.verified_domains,
  updated_at = now();

INSERT INTO public.business_profiles (
  id, directory_id, owner_user_id,
  display_name_ar, display_name_en, tagline_ar, about_ar, about_en,
  founded_year, employee_count_range, status, published_at, verified_domains
)
VALUES (
  'b3000001-0000-4000-8000-000000000001',
  'b2000001-0000-4000-8000-000000000001',
  'b1000005-0000-4000-8000-000000000005',
  'شركة البذور المعتمدة',
  'Seed Verified Business Co',
  'نوظف المواهب التقنية',
  'ملف أعمال مملوك بعد التحقق — منفصل عن سجل الدليل.',
  'Owned business profile after verification — separate from directory.',
  2019,
  '51–200',
  'published',
  now() - interval '1 day',
  ARRAY['seed-verified.jidseed.test']
)
ON CONFLICT (id) DO UPDATE SET
  owner_user_id = EXCLUDED.owner_user_id,
  display_name_ar = EXCLUDED.display_name_ar,
  display_name_en = EXCLUDED.display_name_en,
  status = 'published',
  published_at = EXCLUDED.published_at,
  verified_domains = EXCLUDED.verified_domains,
  updated_at = now();

-- Opportunities (published + draft) + application from complete individual
INSERT INTO public.jobs (
  id, company_id, business_profile_id, created_by,
  title_ar, title_en, slug, status, published_at,
  sector_id, region_id
)
VALUES
  (
    'b3000007-0000-4000-8000-000000000007',
    'b2000001-0000-4000-8000-000000000001',
    'b3000001-0000-4000-8000-000000000001',
    'b1000005-0000-4000-8000-000000000005',
    'مهندس برمجيات',
    'Software Engineer',
    'seed-software-engineer',
    'published',
    now() - interval '12 hours',
    'f1000001-0000-4000-8000-000000000001',
    'f2000001-0000-4000-8000-000000000001'
  ),
  (
    'b3000008-0000-4000-8000-000000000008',
    'b2000001-0000-4000-8000-000000000001',
    'b3000001-0000-4000-8000-000000000001',
    'b1000005-0000-4000-8000-000000000005',
    'مسودة محلل منتجات',
    'Product Analyst (Draft)',
    'seed-product-analyst-draft',
    'draft',
    NULL,
    'f1000001-0000-4000-8000-000000000001',
    'f2000001-0000-4000-8000-000000000001'
  )
ON CONFLICT (id) DO UPDATE SET
  business_profile_id = EXCLUDED.business_profile_id,
  title_en = EXCLUDED.title_en,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.applications (
  id, applicant_id, job_id, company_id, status, submitted_at
)
VALUES (
  'b3000009-0000-4000-8000-000000000009',
  'b1000001-0000-4000-8000-000000000001',
  'b3000007-0000-4000-8000-000000000007',
  'b2000001-0000-4000-8000-000000000001',
  'submitted',
  now() - interval '6 hours'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'submitted',
  submitted_at = EXCLUDED.submitted_at;

-- =============================================================================
-- 6–7 · University verified + pending
-- =============================================================================

INSERT INTO public.companies (
  id, name, name_ar, domains, entity_type, entity_state,
  is_verified, is_active, slug, description_en
)
VALUES
  (
    'b2000003-0000-4000-8000-000000000003',
    'Seed Verified University',
    'جامعة البذور المعتمدة',
    ARRAY['seed-uni.jidseed.test'],
    'university',
    'approved',
    true,
    true,
    'seed-verified-university',
    'Directory university row for owned university profile testing.'
  ),
  (
    'b2000004-0000-4000-8000-000000000004',
    'Seed Pending University',
    'جامعة البذور قيد المراجعة',
    ARRAY['seed-uni-pending.jidseed.test'],
    'university',
    'unclaimed',
    false,
    true,
    'seed-pending-university',
    'Directory university row for pending verification UX.'
  )
ON CONFLICT (id) DO UPDATE SET
  entity_type = EXCLUDED.entity_type,
  entity_state = EXCLUDED.entity_state,
  domains = EXCLUDED.domains,
  updated_at = now();

SELECT public._seed_local_auth_user(
  'b1000007-0000-4000-8000-000000000007',
  'university-verified@jidseed.test',
  'University Verified Admin'
);
SELECT public._seed_local_auth_user(
  'b1000008-0000-4000-8000-000000000008',
  'university-pending@jidseed.test',
  'University Pending Admin'
);

INSERT INTO public.profiles (id, full_name, role, locale, visibility, profile_state, onboarding_completed_at)
VALUES
  (
    'b1000007-0000-4000-8000-000000000007',
    'University Verified Admin',
    'university_admin',
    'ar',
    'private',
    'active',
    now() - interval '2 days'
  ),
  (
    'b1000008-0000-4000-8000-000000000008',
    'University Pending Admin',
    'entity',
    'ar',
    'private',
    'incomplete',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  profile_state = EXCLUDED.profile_state,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  updated_at = now();

INSERT INTO public.verification_requests (
  id, applicant_user_id, directory_id, company_name, business_email,
  claimant_name, status, verification_type, reviewed_at, verified_domains,
  resulting_profile_id, resulting_profile_type
)
VALUES
  (
    'b3000005-0000-4000-8000-000000000005',
    'b1000007-0000-4000-8000-000000000007',
    'b2000003-0000-4000-8000-000000000003',
    'Seed Verified University',
    'university-verified@seed-uni.jidseed.test',
    'University Verified Admin',
    'approved',
    'university',
    now() - interval '1 day',
    ARRAY['seed-uni.jidseed.test'],
    'b3000002-0000-4000-8000-000000000002',
    'university'
  ),
  (
    'b3000006-0000-4000-8000-000000000006',
    'b1000008-0000-4000-8000-000000000008',
    'b2000004-0000-4000-8000-000000000004',
    'Seed Pending University',
    'university-pending@seed-uni-pending.jidseed.test',
    'University Pending Admin',
    'pending_review',
    'university',
    NULL,
    '{}',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  resulting_profile_id = EXCLUDED.resulting_profile_id,
  resulting_profile_type = EXCLUDED.resulting_profile_type,
  updated_at = now();

INSERT INTO public.university_profiles (
  id, directory_id, owner_user_id,
  display_name_ar, display_name_en, about_ar, about_en,
  university_type, established_year, status, published_at, verified_domains
)
VALUES (
  'b3000002-0000-4000-8000-000000000002',
  'b2000003-0000-4000-8000-000000000003',
  'b1000007-0000-4000-8000-000000000007',
  'جامعة البذور المعتمدة',
  'Seed Verified University',
  'ملف جامعة مملوك بعد التحقق.',
  'Owned university profile after verification.',
  'government',
  1957,
  'published',
  now() - interval '12 hours',
  ARRAY['seed-uni.jidseed.test']
)
ON CONFLICT (id) DO UPDATE SET
  owner_user_id = EXCLUDED.owner_user_id,
  status = 'published',
  published_at = EXCLUDED.published_at,
  verified_domains = EXCLUDED.verified_domains,
  updated_at = now();

-- Colleges/majors: catalog entities exist (colleges_catalog) — link via universities_catalog only.
-- No university-owned department table on Layer-3 profiles; skip fabricated department rows.

-- =============================================================================
-- 8–9 · Staff + Super Admin
-- =============================================================================

SELECT public._seed_local_auth_user(
  'b1000009-0000-4000-8000-000000000009',
  'staff@jidseed.test',
  'Staff Operator'
);
SELECT public._seed_local_auth_user(
  'b100000a-0000-4000-8000-00000000000a',
  'admin@jidseed.test',
  'Super Admin'
);

INSERT INTO public.profiles (id, full_name, role, locale, visibility, profile_state, onboarding_completed_at)
VALUES
  (
    'b1000009-0000-4000-8000-000000000009',
    'Staff Operator',
    'staff',
    'ar',
    'private',
    'active',
    now()
  ),
  (
    'b100000a-0000-4000-8000-00000000000a',
    'Super Admin',
    'super_admin',
    'ar',
    'private',
    'active',
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  profile_state = 'active',
  updated_at = now();

-- =============================================================================
-- Cleanup helper (keep function for re-runs; revoke execute from clients)
-- =============================================================================

COMMENT ON FUNCTION public._seed_local_auth_user(uuid, text, text, text) IS
  'TEST FIXTURES — creates auth.users + identities for jidseed.test (local or approved non-prod only).';

COMMIT;
