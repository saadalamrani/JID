-- CV Module — Section 5.1 (tables + indexes) + Section 5.2 (RLS)
-- Reconciles cvs stub from 026_badges_system.sql.

-- ---------------------------------------------------------------------------
-- ENUMs (Section 5.1)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.cv_status_enum AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.additional_category_enum AS ENUM (
    'certification',
    'language',
    'project',
    'award',
    'volunteer',
    'publication',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.cv_generation_status_enum AS ENUM (
    'pending',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- cvs — extend 026 stub
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS status public.cv_status_enum NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS template_key text NOT NULL DEFAULT 'classic';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cvs_email_format_chk'
  ) THEN
    ALTER TABLE public.cvs
      ADD CONSTRAINT cvs_email_format_chk
      CHECK (
        email IS NULL
        OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cvs_summary_length_chk'
  ) THEN
    ALTER TABLE public.cvs
      ADD CONSTRAINT cvs_summary_length_chk
      CHECK (summary IS NULL OR char_length(summary) <= 2000);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cvs_user_primary
  ON public.cvs (user_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_cvs_user_updated
  ON public.cvs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cvs_status
  ON public.cvs (status);

-- ---------------------------------------------------------------------------
-- cv_education
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cv_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  degree text,
  field_of_study text,
  graduation_year smallint,
  gpa_value numeric(4, 2),
  gpa_scale numeric(4, 2),
  start_month smallint,
  start_year smallint,
  end_month smallint,
  end_year smallint,
  is_current boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_education_start_month_chk
    CHECK (start_month IS NULL OR (start_month >= 1 AND start_month <= 12)),
  CONSTRAINT cv_education_end_month_chk
    CHECK (end_month IS NULL OR (end_month >= 1 AND end_month <= 12)),
  CONSTRAINT cv_education_gpa_value_range_chk
    CHECK (gpa_value IS NULL OR gpa_value >= 0),
  CONSTRAINT cv_education_gpa_scale_range_chk
    CHECK (gpa_scale IS NULL OR gpa_scale > 0),
  CONSTRAINT cv_education_graduation_year_chk
    CHECK (
      graduation_year IS NULL
      OR (graduation_year >= 1950 AND graduation_year <= 2100)
    )
);

CREATE INDEX IF NOT EXISTS idx_cv_education_cv_sort
  ON public.cv_education (cv_id, sort_order);

-- ---------------------------------------------------------------------------
-- cv_experience
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cv_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_title text NOT NULL,
  location text,
  employment_type text,
  start_month smallint,
  start_year smallint,
  end_month smallint,
  end_year smallint,
  is_current boolean NOT NULL DEFAULT false,
  bullets text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_experience_start_month_chk
    CHECK (start_month IS NULL OR (start_month >= 1 AND start_month <= 12)),
  CONSTRAINT cv_experience_end_month_chk
    CHECK (end_month IS NULL OR (end_month >= 1 AND end_month <= 12)),
  CONSTRAINT cv_experience_bullets_max_chk
    CHECK (cardinality(bullets) <= 20)
);

CREATE INDEX IF NOT EXISTS idx_cv_experience_cv_sort
  ON public.cv_experience (cv_id, sort_order);

-- ---------------------------------------------------------------------------
-- cv_skills
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cv_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_skills_name_length_chk
    CHECK (char_length(trim(skill_name)) >= 1 AND char_length(skill_name) <= 80)
);

CREATE INDEX IF NOT EXISTS idx_cv_skills_cv_sort
  ON public.cv_skills (cv_id, sort_order);

-- ---------------------------------------------------------------------------
-- cv_additional
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cv_additional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  category public.additional_category_enum NOT NULL,
  title text NOT NULL,
  issuer text,
  description text,
  start_date date,
  end_date date,
  url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_additional_title_length_chk
    CHECK (char_length(trim(title)) >= 1 AND char_length(title) <= 200),
  CONSTRAINT cv_additional_description_length_chk
    CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_cv_additional_cv_sort
  ON public.cv_additional (cv_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_cv_additional_category
  ON public.cv_additional (cv_id, category);

-- ---------------------------------------------------------------------------
-- cv_generations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cv_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  section text NOT NULL,
  prompt text,
  model text,
  status public.cv_generation_status_enum NOT NULL DEFAULT 'pending',
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_snapshot jsonb,
  tokens_used integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT cv_generations_tokens_used_chk
    CHECK (tokens_used IS NULL OR tokens_used >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cv_generations_cv_created
  ON public.cv_generations (cv_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_generations_user_created
  ON public.cv_generations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_generations_status
  ON public.cv_generations (status)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Section 5.2 — RLS (profiles.role subquery pattern)
-- ---------------------------------------------------------------------------

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_additional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cvs_select_own ON public.cvs;
DROP POLICY IF EXISTS cvs_insert_own ON public.cvs;
DROP POLICY IF EXISTS cvs_update_own ON public.cvs;
DROP POLICY IF EXISTS cvs_delete_own ON public.cvs;
DROP POLICY IF EXISTS cvs_staff_all ON public.cvs;

CREATE POLICY cvs_select_own
  ON public.cvs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cvs_insert_own
  ON public.cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY cvs_update_own
  ON public.cvs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cvs_delete_own
  ON public.cvs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cvs_staff_all
  ON public.cvs
  FOR ALL
  TO authenticated
  USING (
    (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

-- cv_education
DROP POLICY IF EXISTS cv_education_select ON public.cv_education;
DROP POLICY IF EXISTS cv_education_mutate ON public.cv_education;

CREATE POLICY cv_education_select
  ON public.cv_education
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_education.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cv_education_mutate
  ON public.cv_education
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_education.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_education.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

-- cv_experience
DROP POLICY IF EXISTS cv_experience_select ON public.cv_experience;
DROP POLICY IF EXISTS cv_experience_mutate ON public.cv_experience;

CREATE POLICY cv_experience_select
  ON public.cv_experience
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_experience.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cv_experience_mutate
  ON public.cv_experience
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_experience.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_experience.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

-- cv_skills
DROP POLICY IF EXISTS cv_skills_select ON public.cv_skills;
DROP POLICY IF EXISTS cv_skills_mutate ON public.cv_skills;

CREATE POLICY cv_skills_select
  ON public.cv_skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_skills.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cv_skills_mutate
  ON public.cv_skills
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_skills.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_skills.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

-- cv_additional
DROP POLICY IF EXISTS cv_additional_select ON public.cv_additional;
DROP POLICY IF EXISTS cv_additional_mutate ON public.cv_additional;

CREATE POLICY cv_additional_select
  ON public.cv_additional
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_additional.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cv_additional_mutate
  ON public.cv_additional
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_additional.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cvs c
      WHERE c.id = cv_additional.cv_id
        AND c.user_id = auth.uid()
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

-- cv_generations
DROP POLICY IF EXISTS cv_generations_select ON public.cv_generations;
DROP POLICY IF EXISTS cv_generations_insert ON public.cv_generations;
DROP POLICY IF EXISTS cv_generations_update ON public.cv_generations;

CREATE POLICY cv_generations_select
  ON public.cv_generations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );

CREATE POLICY cv_generations_insert
  ON public.cv_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY cv_generations_update
  ON public.cv_generations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('staff', 'admin', 'super_admin')
  );
