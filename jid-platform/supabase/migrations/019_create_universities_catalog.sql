-- University Pillar MVP — Day 1 / Task 2
-- Canonical universities catalog.

CREATE TABLE IF NOT EXISTS public.universities_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  city_ar text,
  city_en text,
  website_url text,
  established_year integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT universities_catalog_short_code_format_chk CHECK (short_code ~ '^[A-Z0-9]{2,16}$')
);

CREATE INDEX IF NOT EXISTS idx_universities_catalog_is_active
  ON public.universities_catalog (is_active);

CREATE INDEX IF NOT EXISTS idx_universities_catalog_name_en
  ON public.universities_catalog (name_en);

CREATE INDEX IF NOT EXISTS idx_universities_catalog_name_ar
  ON public.universities_catalog (name_ar);

-- Seed: top Saudi universities for MVP verification.
INSERT INTO public.universities_catalog (
  short_code,
  slug,
  name_ar,
  name_en,
  city_ar,
  city_en,
  website_url,
  established_year
)
VALUES
  (
    'KSU',
    'king-saud-university',
    'جامعة الملك سعود',
    'King Saud University',
    'الرياض',
    'Riyadh',
    'https://www.ksu.edu.sa',
    1957
  ),
  (
    'KFUPM',
    'king-fahd-university-of-petroleum-and-minerals',
    'جامعة الملك فهد للبترول والمعادن',
    'King Fahd University of Petroleum and Minerals',
    'الظهران',
    'Dhahran',
    'https://www.kfupm.edu.sa',
    1963
  ),
  (
    'KAU',
    'king-abdulaziz-university',
    'جامعة الملك عبدالعزيز',
    'King Abdulaziz University',
    'جدة',
    'Jeddah',
    'https://www.kau.edu.sa',
    1967
  ),
  (
    'IMAMU',
    'imam-mohammad-ibn-saud-islamic-university',
    'جامعة الإمام محمد بن سعود الإسلامية',
    'Imam Mohammad Ibn Saud Islamic University',
    'الرياض',
    'Riyadh',
    'https://imamu.edu.sa',
    1974
  ),
  (
    'PNU',
    'princess-nourah-bint-abdulrahman-university',
    'جامعة الأميرة نورة بنت عبدالرحمن',
    'Princess Nourah bint Abdulrahman University',
    'الرياض',
    'Riyadh',
    'https://www.pnu.edu.sa',
    2008
  )
ON CONFLICT (short_code) DO UPDATE
SET
  slug = EXCLUDED.slug,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  city_ar = EXCLUDED.city_ar,
  city_en = EXCLUDED.city_en,
  website_url = EXCLUDED.website_url,
  established_year = EXCLUDED.established_year,
  updated_at = now();
