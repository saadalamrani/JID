-- Section 4.7 — job detail required skills chips
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS required_skills text[] NOT NULL DEFAULT '{}';
