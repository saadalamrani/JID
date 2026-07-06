-- Section 7.8 — organization city/country for experience entries

ALTER TABLE public.cv_experience
  ADD COLUMN IF NOT EXISTS company_city text,
  ADD COLUMN IF NOT EXISTS company_country text;
