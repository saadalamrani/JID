\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_value boolean, p_message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT COALESCE(p_value, false) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: %', p_message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.directory_import_candidates WHERE source_record_key='record-concurrent-intake'),
  'concurrent intake creates one candidate'
);
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.directory_raw_evidence WHERE source_record_key='record-concurrent-intake'),
  'concurrent intake creates one evidence row'
);
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='record-concurrent-intake'),
  'concurrent intake creates one review row'
);
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.companies WHERE domains && ARRAY['concurrent-publication.sa']),
  'concurrent publication creates one Directory row'
);
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.audit_logs a JOIN public.directory_import_candidates c ON c.published_directory_id=a.entity_id WHERE a.action='catalog.directory.published' AND c.source_record_key='edge-concurrent-publication'),
  'concurrent publication records one success audit'
);
SELECT pg_temp.assert_true(
  (SELECT status='published' AND publication_company_id IS NOT NULL FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-concurrent-publication'),
  'concurrent review decision remains single and published'
);

UPDATE public.feature_flags
SET is_enabled=false, updated_at=now()
WHERE key='catalog.phase1_ingestion';

SELECT pg_temp.assert_true(
  (SELECT NOT is_enabled FROM public.feature_flags WHERE key='catalog.phase1_ingestion'),
  'Catalog ingestion flag is false after concurrency proof'
);

SELECT 'CATALOG_DISPOSABLE_CONCURRENCY_MATRIX_PASS' AS result;
