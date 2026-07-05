-- Catalog full-text search column (Section 5.3 — enables Supabase textSearch)

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(name_ar, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(description_en, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description_ar, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_companies_search_vector
  ON public.companies USING gin (search_vector);
