-- Wave 12: table writes stay RPC-only. Forward-only; DATA_LOSS=0.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_report_snapshots FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_report_methodology_versions FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.university_benchmark_reference_sets FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.university_report_snapshots TO authenticated;
GRANT SELECT ON TABLE public.university_report_methodology_versions TO authenticated;
GRANT SELECT ON TABLE public.university_benchmark_reference_sets TO authenticated;

REVOKE ALL ON TABLE public.university_report_snapshots FROM anon;
REVOKE ALL ON TABLE public.university_report_methodology_versions FROM anon;
REVOKE ALL ON TABLE public.university_benchmark_reference_sets FROM anon;
