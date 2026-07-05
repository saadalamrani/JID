-- Section 9 — 13 Saudi administrative regions

INSERT INTO public.regions (id, slug, name_en, name_ar)
VALUES
  ('f2000001-0000-4000-8000-000000000001', 'riyadh', 'Riyadh', 'الرياض'),
  ('f2000001-0000-4000-8000-000000000002', 'makkah', 'Makkah', 'مكة المكرمة'),
  ('f2000001-0000-4000-8000-000000000003', 'madinah', 'Madinah', 'المدينة المنورة'),
  ('f2000001-0000-4000-8000-000000000004', 'qassim', 'Qassim', 'القصيم'),
  ('f2000001-0000-4000-8000-000000000005', 'eastern-province', 'Eastern Province', 'المنطقة الشرقية'),
  ('f2000001-0000-4000-8000-000000000006', 'asir', 'Asir', 'عسير'),
  ('f2000001-0000-4000-8000-000000000007', 'tabuk', 'Tabuk', 'تبوك'),
  ('f2000001-0000-4000-8000-000000000008', 'hail', 'Hail', 'حائل'),
  ('f2000001-0000-4000-8000-000000000009', 'northern-borders', 'Northern Borders', 'الحدود الشمالية'),
  ('f2000001-0000-4000-8000-000000000010', 'jazan', 'Jazan', 'جازان'),
  ('f2000001-0000-4000-8000-000000000011', 'najran', 'Najran', 'نجران'),
  ('f2000001-0000-4000-8000-000000000012', 'al-bahah', 'Al Bahah', 'الباحة'),
  ('f2000001-0000-4000-8000-000000000013', 'al-jawf', 'Al Jawf', 'الجوف')
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar;
