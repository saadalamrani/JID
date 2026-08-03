\set ON_ERROR_STOP on

SELECT public.ingest_directory_candidate(
  'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
  'record-concurrent-intake', 'idem-concurrent-intake', repeat('f', 64),
  '{"content_type":"application/json","content_size_bytes":100,"retrieved_at":"2026-08-04T00:00:00Z"}',
  '{"normalized_identity":"concurrent intake proof","organization_type":"business"}',
  '{"legal_name":{"normalized_value":"Concurrent Intake Ltd","original_value":"Concurrent Intake Ltd","source_field":"legal_name","transformation":"none","confidence":"high","confidence_reason":"Synthetic concurrency proof","authority_level":"authoritative","observed_at":"2026-08-04T00:00:00Z"},"official_domains":{"normalized_value":["concurrent-intake.sa"],"original_value":["concurrent-intake.sa"],"source_field":"official_domain","transformation":"lowercase","confidence":"high","confidence_reason":"Synthetic concurrency proof","authority_level":"authoritative","observed_at":"2026-08-04T00:00:00Z"}}'
) AS concurrent_intake_result;
