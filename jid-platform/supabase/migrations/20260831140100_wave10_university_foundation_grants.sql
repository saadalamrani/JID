-- Wave 10 corrective: table writes stay RPC-only. Default privileges may grant ALL
-- to authenticated on new public tables. Forward-only; DATA_LOSS=0.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_identity_mappings FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_affiliations FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_cohorts FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_cohort_memberships FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_outcome_evidence FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_metric_definitions FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.university_identity_mappings TO authenticated;
GRANT SELECT ON TABLE public.university_affiliations TO authenticated;
GRANT SELECT ON TABLE public.university_cohorts TO authenticated;
GRANT SELECT ON TABLE public.university_cohort_memberships TO authenticated;
GRANT SELECT ON TABLE public.university_outcome_evidence TO authenticated;
GRANT SELECT ON TABLE public.university_metric_definitions TO authenticated;

REVOKE ALL ON TABLE public.university_identity_mappings FROM anon;
REVOKE ALL ON TABLE public.university_affiliations FROM anon;
REVOKE ALL ON TABLE public.university_cohorts FROM anon;
REVOKE ALL ON TABLE public.university_cohort_memberships FROM anon;
REVOKE ALL ON TABLE public.university_outcome_evidence FROM anon;
REVOKE ALL ON TABLE public.university_metric_definitions FROM anon;
