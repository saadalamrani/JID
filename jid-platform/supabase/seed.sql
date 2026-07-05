-- Profile public-view test fixtures (Section 12 Steps 8–9)
-- Run via: pnpm supabase db reset
--
-- Test URLs (default locale, no prefix):
--   Empty private  → /u/a0000000-0000-4000-8000-000000000001  (anonymous → private gate)
--   ~90% complete  → /u/a0000000-0000-4000-8000-000000000002  (public → content + banner)
--   Suspended      → /u/a0000000-0000-4000-8000-000000000003  (anonymous → 404; staff → admin shell)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

INSERT INTO public.universities (id, name, name_ar)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'King Saud University',
  'جامعة الملك سعود'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skills (id, name, name_ar)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'TypeScript', 'تايب سكريبت'),
  ('c0000000-0000-4000-8000-000000000002', 'React', 'ريأكت'),
  ('c0000000-0000-4000-8000-000000000003', 'Node.js', 'نود')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Auth users (password: TestProfile1!)
-- ---------------------------------------------------------------------------

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
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'profile-empty@test.jid.local',
    crypt('TestProfile1!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Empty Test User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'profile-complete@test.jid.local',
    crypt('TestProfile1!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Complete Test User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'profile-suspended@test.jid.local',
    crypt('TestProfile1!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Suspended Test User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

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
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

INSERT INTO public.profiles (
  id,
  full_name,
  role,
  locale,
  visibility,
  show_profile_to_companies,
  profile_state,
  headline,
  about_me,
  avatar_url,
  university_id,
  target_sectors,
  target_regions,
  linkedin_url,
  smart_links,
  profile_completion_pct
)
VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'Empty Test User',
    'individual',
    'ar',
    'private',
    false,
    'incomplete',
    NULL,
    NULL,
    NULL,
    NULL,
    '{}',
    '{}',
    NULL,
    '{}'::jsonb,
    0
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'Complete Test User',
    'individual',
    'ar',
    'public',
    true,
    'active',
    'Software engineering graduate seeking internships',
    'Passionate about building products that help students find meaningful careers in Saudi Arabia.',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=complete-test',
    'b0000000-0000-4000-8000-000000000001',
    ARRAY['Technology', 'Finance'],
    ARRAY['Riyadh'],
    NULL,
    '{}'::jsonb,
    85
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'Suspended Test User',
    'individual',
    'ar',
    'public',
    true,
    'suspended',
    'Former public profile',
    NULL,
    NULL,
    NULL,
    '{}',
    '{}',
    NULL,
    '{}'::jsonb,
    0
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  visibility = EXCLUDED.visibility,
  show_profile_to_companies = EXCLUDED.show_profile_to_companies,
  profile_state = EXCLUDED.profile_state,
  headline = EXCLUDED.headline,
  about_me = EXCLUDED.about_me,
  avatar_url = EXCLUDED.avatar_url,
  university_id = EXCLUDED.university_id,
  target_sectors = EXCLUDED.target_sectors,
  target_regions = EXCLUDED.target_regions,
  linkedin_url = EXCLUDED.linkedin_url,
  profile_completion_pct = EXCLUDED.profile_completion_pct,
  suspended_at = CASE
    WHEN EXCLUDED.id = 'a0000000-0000-4000-8000-000000000003' THEN now()
    ELSE public.profiles.suspended_at
  END,
  suspended_reason = CASE
    WHEN EXCLUDED.id = 'a0000000-0000-4000-8000-000000000003' THEN 'Policy violation (seed fixture)'
    ELSE public.profiles.suspended_reason
  END;

UPDATE public.profiles
SET
  suspended_at = now(),
  suspended_reason = 'Policy violation (seed fixture)'
WHERE id = 'a0000000-0000-4000-8000-000000000003';

INSERT INTO public.profile_skills (profile_id, skill_id)
VALUES
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Company public-view fixtures (Section 12 Step 10)
-- Test URLs:
--   Unclaimed  → /companies/d0000000-0000-4000-8000-000000000001  (CTA visible)
--   Claimed      → /companies/d0000000-0000-4000-8000-000000000002  (full profile)
--   Suspended    → /companies/d0000000-0000-4000-8000-000000000003  (404)
--
-- Company admin (owner of claimed co.): company-admin@test.jid.local / TestProfile1!

INSERT INTO public.companies (
  id,
  name,
  name_ar,
  domains,
  entity_type,
  entity_state,
  is_verified,
  tagline_en,
  tagline_ar,
  about_long_en,
  about_long_ar,
  founded_year,
  employee_count_range,
  office_locations,
  commitment_score,
  avg_response_days,
  response_rate_pct,
  total_jobs_posted_12mo,
  is_on_honor_roll
)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'Unclaimed Startup Co',
    'شركة ناشئة غير مطالب بها',
    ARRAY['unclaimed-test.jid.local'],
    'company',
    'unclaimed',
    false,
    'Building the future of work',
    'نبني مستقبل العمل',
    NULL,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    0,
    NULL,
    NULL,
    0,
    false
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'Approved Tech Corp',
    'شركة التقنية المعتمدة',
    ARRAY['approved-tech.jid.local'],
    'company',
    'approved',
    true,
    'Hiring Saudi tech talent',
    'نوظف الكفاءات التقنية السعودية',
    'Approved Tech Corp partners with universities to place graduates in software, data, and product roles across the Kingdom.',
    'تتعاون شركة التقنية المعتمدة مع الجامعات لتوظيف الخريجين في مجالات البرمجيات والبيانات والمنتجات.',
    2018,
    '201–500',
    '[{"city": "Riyadh", "country": "Saudi Arabia"}, {"city": "Jeddah", "country": "Saudi Arabia"}]'::jsonb,
    82.5,
    3.2,
    94.0,
    14,
    true
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'Suspended Corp',
    'شركة موقوفة',
    ARRAY['suspended-corp.jid.local'],
    'company',
    'suspended',
    false,
    'Former employer profile',
    'ملف صاحب عمل سابق',
    NULL,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    0,
    NULL,
    NULL,
    0,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  entity_state = EXCLUDED.entity_state,
  is_verified = EXCLUDED.is_verified,
  tagline_en = EXCLUDED.tagline_en,
  tagline_ar = EXCLUDED.tagline_ar,
  about_long_en = EXCLUDED.about_long_en,
  founded_year = EXCLUDED.founded_year,
  employee_count_range = EXCLUDED.employee_count_range,
  office_locations = EXCLUDED.office_locations,
  commitment_score = EXCLUDED.commitment_score,
  avg_response_days = EXCLUDED.avg_response_days,
  response_rate_pct = EXCLUDED.response_rate_pct,
  total_jobs_posted_12mo = EXCLUDED.total_jobs_posted_12mo,
  is_on_honor_roll = EXCLUDED.is_on_honor_roll;

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
  'd1000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'company-admin@test.jid.local',
  crypt('TestProfile1!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Company Admin Test"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

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
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.id = 'd1000000-0000-4000-8000-000000000001'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

INSERT INTO public.profiles (id, full_name, role, locale, profile_state, visibility)
VALUES (
  'd1000000-0000-4000-8000-000000000001',
  'Company Admin Test',
  'company_admin',
  'ar',
  'active',
  'private'
)
ON CONFLICT (id) DO UPDATE SET role = 'company_admin', full_name = EXCLUDED.full_name;

INSERT INTO public.claim_requests (
  id,
  user_id,
  company_id,
  company_name,
  business_email,
  claimant_name,
  status,
  claim_type,
  reviewed_at
)
VALUES (
  'd2000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002',
  'Approved Tech Corp',
  'hr@approved-tech.jid.local',
  'Company Admin Test',
  'approved',
  'company',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'approved',
  reviewed_at = now();

-- ---------------------------------------------------------------------------
-- Mentor public-view fixtures (Section 12 Step 11)
-- Test URLs:
--   Approved → /mentors/e0000000-0000-4000-8000-000000000001  (full public profile)
--   Pending  → /mentors/e0000000-0000-4000-8000-000000000002  (404; staff sees profile)
--
-- Approved mentor login: mentor-approved@test.jid.local / TestProfile1!

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
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'e0000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'mentor-approved@test.jid.local',
    crypt('TestProfile1!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ahmed Al-Rashid"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'e0000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'mentor-pending@test.jid.local',
    crypt('TestProfile1!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pending Mentor"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

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
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.id IN (
  'e0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000002'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

INSERT INTO public.profiles (
  id,
  full_name,
  role,
  locale,
  visibility,
  profile_state,
  headline,
  avatar_url
)
VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'Ahmed Al-Rashid',
    'individual',
    'ar',
    'public',
    'active',
    'Former product leader — mentorship for tech careers',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor-approved'
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'Pending Mentor',
    'individual',
    'ar',
    'public',
    'active',
    'Awaiting approval',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  visibility = EXCLUDED.visibility,
  headline = EXCLUDED.headline,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO public.mentor_profiles (
  user_id,
  status,
  headline,
  bio_short,
  bio_long,
  avg_response_hours,
  career_history,
  rating_avg,
  sessions_count,
  expertise_sectors,
  years_experience,
  active_workshop
)
VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'approved',
    'Former product leader at Aramco — I help graduates land their first tech role.',
    'I mentor students transitioning from university to their first software or product role.',
    'Over 15 years in product and engineering leadership across energy and telecom. I focus on portfolio reviews, interview prep, and navigating your first 90 days on the job.',
    4.5,
    '[
      {"title": "Senior Product Manager", "company": "Aramco", "start_year": 2015, "end_year": 2022, "description": "Led digital product squads and graduate hiring programs."},
      {"title": "Product Manager", "company": "STC", "start_year": 2010, "end_year": 2015, "description": "Shipped consumer mobile products."}
    ]'::jsonb,
    4.8,
    47,
    ARRAY['Technology', 'Energy', 'Product Management'],
    15,
    '{
      "title": "Tech Interview Prep Workshop",
      "title_ar": "ورشة التحضير لمقابلات التقنية",
      "scheduled_at": "2026-08-15T17:00:00+00:00",
      "spots_remaining": 12,
      "url": "https://jid.local/workshops/interview-prep"
    }'::jsonb
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'pending',
    'Pending mentor application',
    'Not yet visible to the public.',
    NULL,
    NULL,
    '[]'::jsonb,
    NULL,
    0,
    '{}',
    NULL,
    NULL
  )
ON CONFLICT (user_id) DO UPDATE SET
  status = EXCLUDED.status,
  headline = EXCLUDED.headline,
  bio_short = EXCLUDED.bio_short,
  bio_long = EXCLUDED.bio_long,
  avg_response_hours = EXCLUDED.avg_response_hours,
  career_history = EXCLUDED.career_history,
  rating_avg = EXCLUDED.rating_avg,
  sessions_count = EXCLUDED.sessions_count,
  expertise_sectors = EXCLUDED.expertise_sectors,
  years_experience = EXCLUDED.years_experience,
  active_workshop = EXCLUDED.active_workshop;

INSERT INTO public.mentor_reviews (id, mentor_id, reviewer_id, rating, body, created_at)
VALUES
  (
    'e3000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    5,
    'Ahmed helped me refine my portfolio and I received an offer within six weeks.',
    now() - interval '14 days'
  ),
  (
    'e3000000-0000-4000-8000-000000000002',
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    5,
    'Practical advice on behavioral interviews — highly recommend.',
    now() - interval '30 days'
  ),
  (
    'e3000000-0000-4000-8000-000000000003',
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    4,
    'Great session on career planning in the Saudi tech market.',
    now() - interval '45 days'
  )
ON CONFLICT (id) DO NOTHING;
