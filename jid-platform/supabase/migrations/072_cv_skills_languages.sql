-- Section 7.9 — technical skills + languages on CV row

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS technical_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  ALTER TYPE public.additional_category_enum ADD VALUE IF NOT EXISTS 'leadership';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
