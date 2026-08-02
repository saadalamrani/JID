-- Post-Spec 09 remediation: university_dashboard_view ownership gate.
-- Reconcile active claimed_by residue to owned university_profiles.owner_user_id.
-- Directory (companies) remains a reference; ownership is Profile-scoped.
-- Does not expose individual graduate rows; view still projects aggregate snapshot KPIs.

DROP VIEW IF EXISTS public.university_dashboard_view;

CREATE VIEW public.university_dashboard_view AS
SELECT uds.*
FROM public.university_dashboard_snapshot uds
JOIN public.universities_catalog uc
  ON uc.id = uds.university_id
WHERE EXISTS (
  SELECT 1
  FROM public.university_profiles up
  JOIN public.companies c
    ON c.id = up.directory_id
  WHERE up.owner_user_id = auth.uid()
    AND c.entity_type = 'university'
    AND c.university_short_code IS NOT NULL
    AND upper(c.university_short_code) = upper(uc.short_code)
);

GRANT SELECT ON public.university_dashboard_view TO authenticated;

COMMENT ON VIEW public.university_dashboard_view IS
  'Owner-scoped university dashboard snapshot read via university_profiles.owner_user_id (not companies.claimed_by).';
