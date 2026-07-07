-- University Pillar MVP — Day 1 / Task 1
-- Adds typed entity classification + university-specific company fields.

DO $$
BEGIN
  CREATE TYPE public.entity_type_enum AS ENUM ('company', 'university');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS entity_type public.entity_type_enum NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS university_short_code text,
  ADD COLUMN IF NOT EXISTS total_students_claimed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

-- If legacy schema stored entity_type as text, normalize to enum safely.
DO $$
DECLARE
  v_data_type text;
BEGIN
  SELECT c.data_type
  INTO v_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'companies'
    AND c.column_name = 'entity_type';

  IF v_data_type = 'text' THEN
    ALTER TABLE public.companies
      ALTER COLUMN entity_type DROP DEFAULT;

    UPDATE public.companies
    SET entity_type = 'company'
    WHERE entity_type IS NULL
       OR entity_type::text NOT IN ('company', 'university');

    ALTER TABLE public.companies
      ALTER COLUMN entity_type TYPE public.entity_type_enum
      USING entity_type::public.entity_type_enum;

    ALTER TABLE public.companies
      ALTER COLUMN entity_type SET DEFAULT 'company'::public.entity_type_enum;
  END IF;
END;
$$;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_total_students_claimed_nonnegative_chk;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_total_students_claimed_nonnegative_chk
  CHECK (total_students_claimed >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_university_short_code_unique
  ON public.companies (university_short_code)
  WHERE entity_type = 'university'::public.entity_type_enum
    AND university_short_code IS NOT NULL;
