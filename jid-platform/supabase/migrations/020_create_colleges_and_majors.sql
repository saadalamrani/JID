-- University Pillar MVP — Day 1 / Task 3
-- Colleges + majors catalogs with seed data.

CREATE TABLE IF NOT EXISTS public.colleges_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_colleges_catalog_university_id
  ON public.colleges_catalog (university_id);

CREATE INDEX IF NOT EXISTS idx_colleges_catalog_is_active
  ON public.colleges_catalog (is_active);

CREATE TABLE IF NOT EXISTS public.majors_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges_catalog (id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  cip_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_majors_catalog_college_id
  ON public.majors_catalog (college_id);

CREATE INDEX IF NOT EXISTS idx_majors_catalog_is_active
  ON public.majors_catalog (is_active);

WITH seeded_colleges AS (
  INSERT INTO public.colleges_catalog (university_id, slug, name_ar, name_en)
  SELECT u.id, x.slug, x.name_ar, x.name_en
  FROM public.universities_catalog u
  JOIN (
    VALUES
      ('KSU', 'college-of-computer-and-information-sciences', 'كلية علوم الحاسب والمعلومات', 'College of Computer and Information Sciences'),
      ('KSU', 'college-of-engineering', 'كلية الهندسة', 'College of Engineering'),
      ('KFUPM', 'college-of-computing-and-mathematics', 'كلية الحوسبة والرياضيات', 'College of Computing and Mathematics'),
      ('KFUPM', 'college-of-engineering-and-physics', 'كلية الهندسة والفيزياء', 'College of Engineering and Physics'),
      ('KAU', 'faculty-of-computing-and-information-technology', 'كلية الحاسبات وتقنية المعلومات', 'Faculty of Computing and Information Technology'),
      ('KAU', 'faculty-of-engineering', 'كلية الهندسة', 'Faculty of Engineering'),
      ('IMAMU', 'college-of-computer-and-information-sciences', 'كلية علوم الحاسب والمعلومات', 'College of Computer and Information Sciences'),
      ('PNU', 'college-of-computer-and-information-sciences', 'كلية علوم الحاسب والمعلومات', 'College of Computer and Information Sciences')
  ) AS x (short_code, slug, name_ar, name_en)
    ON u.short_code = x.short_code
  ON CONFLICT (university_id, slug) DO UPDATE
  SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    updated_at = now()
  RETURNING id, slug
)
INSERT INTO public.majors_catalog (college_id, slug, name_ar, name_en, cip_code)
SELECT c.id, m.slug, m.name_ar, m.name_en, m.cip_code
FROM public.colleges_catalog c
JOIN (
  VALUES
    ('college-of-computer-and-information-sciences', 'computer-science', 'علوم الحاسب', 'Computer Science', '11.0701'),
    ('college-of-computer-and-information-sciences', 'software-engineering', 'هندسة البرمجيات', 'Software Engineering', '14.0903'),
    ('college-of-computer-and-information-sciences', 'information-systems', 'نظم المعلومات', 'Information Systems', '11.0401'),
    ('college-of-computer-and-information-sciences', 'cybersecurity', 'الأمن السيبراني', 'Cybersecurity', '11.1003'),
    ('college-of-computer-and-information-sciences', 'artificial-intelligence', 'الذكاء الاصطناعي', 'Artificial Intelligence', '11.0102'),
    ('college-of-computing-and-mathematics', 'computer-engineering', 'هندسة الحاسب', 'Computer Engineering', '14.0901'),
    ('college-of-engineering', 'mechanical-engineering', 'الهندسة الميكانيكية', 'Mechanical Engineering', '14.1901'),
    ('college-of-engineering', 'electrical-engineering', 'الهندسة الكهربائية', 'Electrical Engineering', '14.1001'),
    ('faculty-of-engineering', 'civil-engineering', 'الهندسة المدنية', 'Civil Engineering', '14.0801')
) AS m (college_slug, slug, name_ar, name_en, cip_code)
  ON c.slug = m.college_slug
ON CONFLICT (college_id, slug) DO UPDATE
SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  cip_code = EXCLUDED.cip_code,
  updated_at = now();
