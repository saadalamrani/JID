-- University Pillar MVP — Day 1 / Task 4
-- Extend profiles with university catalog relations + student lifecycle fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university_id uuid,
  ADD COLUMN IF NOT EXISTS college_id uuid,
  ADD COLUMN IF NOT EXISTS major_id uuid,
  ADD COLUMN IF NOT EXISTS graduation_year smallint,
  ADD COLUMN IF NOT EXISTS student_status text;

-- Move existing profile foreign keys to catalog tables when those FKs exist.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_university_id_fkey,
  DROP CONSTRAINT IF EXISTS profiles_college_id_fkey,
  DROP CONSTRAINT IF EXISTS profiles_major_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_university_id_fkey
  FOREIGN KEY (university_id) REFERENCES public.universities_catalog (id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_college_id_fkey
  FOREIGN KEY (college_id) REFERENCES public.colleges_catalog (id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_major_id_fkey
  FOREIGN KEY (major_id) REFERENCES public.majors_catalog (id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_graduation_year_chk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_graduation_year_chk
  CHECK (graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2100));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_student_status_chk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_student_status_chk
  CHECK (
    student_status IS NULL
    OR student_status IN (
      'current_student',
      'expected_graduate',
      'graduate',
      'alumni',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS idx_profiles_university_id
  ON public.profiles (university_id);

CREATE INDEX IF NOT EXISTS idx_profiles_college_id
  ON public.profiles (college_id);

CREATE INDEX IF NOT EXISTS idx_profiles_major_id
  ON public.profiles (major_id);

CREATE INDEX IF NOT EXISTS idx_profiles_graduation_year
  ON public.profiles (graduation_year);

CREATE INDEX IF NOT EXISTS idx_profiles_student_status
  ON public.profiles (student_status);
