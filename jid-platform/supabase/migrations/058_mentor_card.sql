-- Section 4.4 / 4.5 — mentor card & crown badge fields

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS is_mentor_of_month boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_mentor_of_month
  ON public.mentor_profiles (is_mentor_of_month)
  WHERE is_mentor_of_month = true AND status = 'approved';
