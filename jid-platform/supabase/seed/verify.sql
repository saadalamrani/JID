-- Post-seed verification queries (Section 9)
-- Run: psql $DATABASE_URL -f supabase/seed/verify.sql

SELECT COUNT(*) AS companies_total FROM public.companies;

SELECT COUNT(*) AS catalog_seed_companies
FROM public.companies
WHERE id::text LIKE 'f3000001%';

SELECT ownership_type, COUNT(*) AS n
FROM public.companies
WHERE id::text LIKE 'f3000001%'
GROUP BY ownership_type
ORDER BY n DESC;

SELECT r.name_en AS region, COUNT(*) AS n
FROM public.companies c
JOIN public.regions r ON r.id = c.region_id
WHERE c.id::text LIKE 'f3000001%'
GROUP BY r.name_en
ORDER BY n DESC
LIMIT 5;

SELECT s.name_en AS sector, COUNT(*) AS n
FROM public.companies c
JOIN public.sectors s ON s.id = c.sector_id
WHERE c.id::text LIKE 'f3000001%'
GROUP BY s.name_en
ORDER BY n DESC
LIMIT 10;

SELECT COUNT(*) AS sectors_total FROM public.sectors;
SELECT COUNT(*) AS regions_total FROM public.regions;
