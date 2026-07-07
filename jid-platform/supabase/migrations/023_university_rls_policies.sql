-- University Pillar MVP — Day 2 / Task 2
-- Secure wrapper views for university dashboard access.

DROP VIEW IF EXISTS public.university_dashboard_view;
DROP VIEW IF EXISTS public.university_dashboard_view_admin;

CREATE VIEW public.university_dashboard_view AS
SELECT uds.*
FROM public.university_dashboard_snapshot uds
JOIN public.universities_catalog uc
  ON uc.id = uds.university_id
WHERE EXISTS (
  SELECT 1
  FROM public.companies c
  WHERE c.claimed_by = auth.uid()
    AND c.entity_type = 'university'
    AND c.university_short_code IS NOT NULL
    AND upper(c.university_short_code) = upper(uc.short_code)
);

CREATE VIEW public.university_dashboard_view_admin AS
SELECT uds.*
FROM public.university_dashboard_snapshot uds
WHERE (
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
) IN ('super_admin', 'staff');

GRANT SELECT ON public.university_dashboard_view TO authenticated;
GRANT SELECT ON public.university_dashboard_view_admin TO authenticated;
