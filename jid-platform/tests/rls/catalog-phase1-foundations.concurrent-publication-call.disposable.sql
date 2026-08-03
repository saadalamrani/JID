\set ON_ERROR_STOP on

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT public.publish_directory_candidate(
  (
    SELECT q.id
    FROM public.directory_review_queue q
    JOIN public.directory_import_candidates c ON c.id = q.candidate_id
    WHERE c.source_record_key = 'edge-concurrent-publication'
  )
) AS concurrent_publication_result;
