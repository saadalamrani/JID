-- Section 7.7 — institution location, honors, relevant coursework

ALTER TABLE public.cv_education
  ADD COLUMN IF NOT EXISTS institution_city text,
  ADD COLUMN IF NOT EXISTS institution_country text,
  ADD COLUMN IF NOT EXISTS honors text,
  ADD COLUMN IF NOT EXISTS relevant_coursework text;
