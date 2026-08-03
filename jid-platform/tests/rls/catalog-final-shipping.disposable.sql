\set ON_ERROR_STOP on

-- Disposable-only proof. Every fixture and role is rolled back.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_value boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT COALESCE(p_value,false) THEN RAISE EXCEPTION 'ASSERTION_FAILED: %',p_message; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.expect_error(p_sql text, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE p_sql; EXCEPTION WHEN OTHERS THEN RETURN; END;
  RAISE EXCEPTION 'EXPECTED_ERROR_NOT_RAISED: %',p_message;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*)=7 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY(ARRAY[
     'directory_sources','directory_sync_runs','directory_raw_evidence',
     'directory_import_candidates','directory_candidate_facts',
     'directory_review_queue','directory_dead_letters'
   ])),
  'exact seven adjacent Catalog tables remain'
);
SELECT pg_temp.assert_true(to_regclass('public.directory_records') IS NULL,'no directory_records');
SELECT pg_temp.assert_true(
  (SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE oid=ANY(ARRAY[
    'public.directory_sources'::regclass,'public.directory_sync_runs'::regclass,
    'public.directory_raw_evidence'::regclass,'public.directory_import_candidates'::regclass,
    'public.directory_candidate_facts'::regclass,'public.directory_review_queue'::regclass,
    'public.directory_dead_letters'::regclass
  ])),
  'forced RLS remains on all adjacent tables'
);
SELECT pg_temp.assert_true(
  NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='catalog_worker_gleif'),
  'LOGIN worker is not migration-created'
);
SELECT pg_temp.assert_true(
  (SELECT is_enabled=false FROM public.feature_flags WHERE key='catalog.phase1_ingestion')
  AND (SELECT is_enabled=false FROM public.feature_flags WHERE key='catalog.gleif_connector_enabled'),
  'both operational flags default off'
);
SELECT pg_temp.assert_true(
  NOT has_schema_privilege('catalog_function_owner','public','CREATE')
  AND NOT pg_has_role('postgres','catalog_function_owner','USAGE'),
  'bounded owner handshake is fully revoked'
);

SET session_replication_role=replica;
INSERT INTO public.profiles(id,full_name,role) VALUES
  ('cf700001-0000-4000-8000-000000000001','Catalog reviewer','staff'),
  ('cf700002-0000-4000-8000-000000000002','Catalog super admin','super_admin'),
  ('cf700003-0000-4000-8000-000000000003','Catalog admin denied','admin'),
  ('cf700004-0000-4000-8000-000000000004','Catalog external actor','individual');
SET session_replication_role=origin;

CREATE ROLE catalog_worker_gleif_fixture LOGIN INHERIT NOBYPASSRLS NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION IN ROLE catalog_worker;
GRANT catalog_worker_gleif_fixture TO postgres;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cf700002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.configure_catalog_gleif(true,true,10::smallint,1::smallint)->>'ok')::boolean,
  'Super Admin enables the bounded ten-record pilot configuration'
);
RESET ROLE;

SET ROLE catalog_worker_gleif_fixture;
SELECT pg_temp.assert_true(
  (public.catalog_begin_gleif_run('DISPOSABLE-GLEIF-001','incremental','catalog_worker_gleif_fixture')->>'ok')::boolean,
  'worker begins one active run'
);
SELECT pg_temp.assert_true(
  public.catalog_begin_gleif_run('DISPOSABLE-GLEIF-002','incremental','catalog_worker_gleif_fixture')->>'code'='already_running',
  'single-flight run boundary rejects a second run'
);
RESET ROLE;
SELECT set_config('catalog.fixture_run_id',(
  SELECT id::text FROM public.directory_sync_runs WHERE external_run_id='DISPOSABLE-GLEIF-001'
),false);
SET ROLE catalog_worker_gleif_fixture;

DO $$
DECLARE v_run uuid; v_result jsonb; v_candidate uuid;
BEGIN
  v_run:=current_setting('catalog.fixture_run_id')::uuid;
  v_result:=public.ingest_directory_candidate(
    'gleif.lei-records-v1',v_run,'9845003OC587591DQ586:disposable','gleif:9845003OC587591DQ586:disposable',
    repeat('a',64),
    jsonb_build_object('content_type','application/json','content_size_bytes',512,
      'retrieved_at','2026-08-03T00:00:00Z','licence_reference','GLEIF test evidence',
      'parser_version','1.0.0','personal_data_dominated',false),
    jsonb_build_object('normalized_identity','disposable gleif business','organization_type','business'),
    jsonb_build_object(
      'legal_name',jsonb_build_object('normalized_value','Disposable GLEIF Business','original_value','Disposable GLEIF Business','source_field','entity.legalName.name','transformation','nfc_trim','confidence','high','confidence_reason','Direct test fixture','authority_level','authoritative','observed_at','2026-08-03T00:00:00Z','reviewer_edit_state','proposed'),
      'city',jsonb_build_object('normalized_value','Riyadh','original_value','Riyadh','source_field','entity.legalAddress.city','transformation','nfc_trim','confidence','high','confidence_reason','Direct test fixture','authority_level','authoritative','observed_at','2026-08-03T00:00:00Z','reviewer_edit_state','proposed'),
      'entity_creation_date',jsonb_build_object('normalized_value','2020-01-02','original_value','2020-01-02','source_field','entity.creationDate','transformation','extract_year_exact_entity_creation_date','confidence','high','confidence_reason','Direct test fixture','authority_level','authoritative','observed_at','2026-08-03T00:00:00Z','reviewer_edit_state','proposed')
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'worker intake accepted');
  v_candidate:=(v_result->>'candidate_id')::uuid;
  PERFORM pg_temp.assert_true((public.catalog_capture_gleif_facts(v_candidate,jsonb_build_object(
    'lei',jsonb_build_object('normalized_value','9845003OC587591DQ586','original_value','9845003OC587591DQ586','source_field','lei','transformation','uppercase','confidence','high','confidence_reason','Direct test fixture','authority_level','authoritative','observed_at','2026-08-03T00:00:00Z'),
    'registration_status',jsonb_build_object('normalized_value','ISSUED','original_value','ISSUED','source_field','registration.status','transformation','uppercase','confidence','high','confidence_reason','Direct test fixture','authority_level','authoritative','observed_at','2026-08-03T00:00:00Z')
  ))->>'ok')::boolean,'extended source facts captured');
  PERFORM pg_temp.assert_true((public.catalog_capture_gleif_metadata(
    v_candidate,'9845003OC587591DQ586','1010000000','RA000513','new','[]','{}','ACTIVE','ISSUED',
    '{"attributes":{"lei":"9845003OC587591DQ586","entity":{"legalName":{"name":"Disposable GLEIF Business"}}}}'
  )->>'ok')::boolean,'immutable evidence payload and matching metadata captured');
  v_result:=public.ingest_directory_candidate(
    'gleif.lei-records-v1',v_run,'invalid-checksum-record','gleif:invalid-checksum-record',
    'invalid','{"content_type":"application/json"}','{"normalized_identity":"Invalid","organization_type":"business"}','{}'
  );
  PERFORM pg_temp.assert_true(NOT (v_result->>'ok')::boolean,'invalid input is dead-lettered');
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  NOT has_table_privilege('catalog_worker_gleif_fixture','public.companies','INSERT')
  AND NOT has_table_privilege('catalog_worker_gleif_fixture','public.companies','UPDATE')
  AND NOT has_table_privilege('catalog_worker_gleif_fixture','public.verification_requests','UPDATE')
  AND has_function_privilege('catalog_worker_gleif_fixture','public.ingest_directory_candidate(text,uuid,text,text,text,jsonb,jsonb,jsonb)','EXECUTE'),
  'LOGIN fixture inherits only Catalog worker functions and no product writes'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cf700004-0000-4000-8000-000000000004',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.directory_import_candidates)
  AND (SELECT count(*)=0 FROM public.directory_raw_evidence),
  'ordinary authenticated actor sees no Catalog internals'
);
SELECT set_config('request.jwt.claim.sub','cf700003-0000-4000-8000-000000000003',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.directory_import_candidates)
  AND public.claim_directory_candidate((SELECT id FROM public.directory_review_queue LIMIT 1))->>'code'='catalog_review_forbidden',
  'admin is denied from Catalog review'
);
SELECT set_config('request.jwt.claim.sub','cf700001-0000-4000-8000-000000000001',false);
DO $$
DECLARE v_queue uuid; v_result jsonb;
BEGIN
  SELECT id INTO v_queue FROM public.directory_review_queue LIMIT 1;
  v_result:=public.claim_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'staff claims queue item');
  v_result:=public.review_directory_candidate(v_queue,'approve_pending_domain','Reviewed legal evidence; official domain remains pending.',NULL,NULL,NULL);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'human reviewer can approve pending domain');
  v_result:=public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true(NOT (v_result->>'ok')::boolean,'pending-domain candidate cannot publish');
  v_result:=public.review_directory_candidate(v_queue,'validate_domain','Official site identifies the same legal entity.','disposable-gleif.test','https://registry.test/disposable',NULL);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'reviewer validates cited domain and advances approval');
  v_result:=public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'explicit staff publication succeeds');
  v_result:=public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND (v_result->>'replayed')::boolean,'publication replay is idempotent');
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.companies WHERE name='Disposable GLEIF Business'
    AND name_ar IS NULL AND domains=ARRAY['disposable-gleif.test'] AND entity_type='business'
    AND city='Riyadh' AND founded_year=2020 AND is_active AND link_status='pending'
    AND claimed_by IS NULL AND claim_requested_at IS NULL AND NOT is_verified AND entity_state='unclaimed'),
  'publication writes only the allowlisted unowned Directory projection'
);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.verification_requests WHERE applicant_user_id IN (
    'cf700001-0000-4000-8000-000000000001','cf700002-0000-4000-8000-000000000002'))
  AND (SELECT count(*)=0 FROM public.business_profiles WHERE owner_user_id IN (
    'cf700001-0000-4000-8000-000000000001','cf700002-0000-4000-8000-000000000002'))
  AND (SELECT count(*)=0 FROM public.university_profiles WHERE owner_user_id IN (
    'cf700001-0000-4000-8000-000000000001','cf700002-0000-4000-8000-000000000002')),
  'Catalog causes zero Verification or Profile side effects'
);
SELECT pg_temp.expect_error(
  $sql$UPDATE public.directory_raw_evidence SET source_payload='{"tampered":true}'$sql$,
  'captured raw evidence payload is immutable'
);

UPDATE public.directory_raw_evidence SET
  legal_hold=true,legal_hold_reason='Disposable retention proof',deletion_eligible_at=now()-interval '1 day'
WHERE source_payload IS NOT NULL;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cf700002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.execute_catalog_retention()->>'payloads_deleted')::integer=0,
  'legal hold blocks evidence payload retention deletion'
);
SELECT pg_temp.assert_true(
  (public.redrive_catalog_dead_letter((SELECT id FROM public.directory_dead_letters ORDER BY created_at DESC LIMIT 1))->>'ok')::boolean,
  'Super Admin initiates a bounded dead-letter re-drive'
);
RESET ROLE;
UPDATE public.directory_raw_evidence SET legal_hold=false,legal_hold_reason=NULL
WHERE source_payload IS NOT NULL;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cf700002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.execute_catalog_retention()->>'payloads_deleted')::integer=1,
  'eligible non-held payload is deleted while metadata remains'
);
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.directory_raw_evidence
   WHERE retention_state='payload_deleted' AND source_payload IS NULL
     AND payload_deleted_at IS NOT NULL AND checksum_sha256=repeat('a',64)),
  'retention preserves evidence metadata and checksum'
);

SET ROLE catalog_worker_gleif_fixture;
SELECT pg_temp.assert_true((public.catalog_finish_gleif_run(
  current_setting('catalog.fixture_run_id')::uuid,
  'succeeded',1,0,1,0,'{"page":1}',NULL,NULL
)->>'ok')::boolean,'worker finalizes run with real counters');
RESET ROLE;

SELECT 'CATALOG_FINAL_DISPOSABLE_PASS' AS result;
ROLLBACK;
