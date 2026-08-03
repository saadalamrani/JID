\set ON_ERROR_STOP on

-- Disposable-local Catalog Phase 1 proof. Never apply to cloud databases.

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
CREATE OR REPLACE FUNCTION pg_temp.expect_error(p_sql text, p_message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
  RAISE EXCEPTION 'EXPECTED_ERROR_NOT_RAISED: %', p_message;
END;
$$;

-- ---------------------------------------------------------------------------
-- Exact object, owner, ACL, role, RLS, and default-off assertions
-- ---------------------------------------------------------------------------

SELECT pg_temp.assert_true(
  (
    SELECT count(*) = 7
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname = ANY (ARRAY[
        'directory_sources', 'directory_sync_runs', 'directory_raw_evidence',
        'directory_import_candidates', 'directory_candidate_facts',
        'directory_review_queue', 'directory_dead_letters'
      ])
  ),
  'exact seven Catalog adjacent tables'
);

SELECT pg_temp.assert_true(
  to_regclass('public.directory_records') IS NULL,
  'directory_records must not exist'
);

SELECT pg_temp.assert_true(
  (
    SELECT bool_and(c.relrowsecurity AND c.relforcerowsecurity)
    FROM pg_class c
    WHERE c.oid = ANY (ARRAY[
      'public.directory_sources'::regclass,
      'public.directory_sync_runs'::regclass,
      'public.directory_raw_evidence'::regclass,
      'public.directory_import_candidates'::regclass,
      'public.directory_candidate_facts'::regclass,
      'public.directory_review_queue'::regclass,
      'public.directory_dead_letters'::regclass
    ])
  ),
  'RLS and FORCE RLS on all seven tables'
);

SELECT pg_temp.assert_true(
  (
    SELECT bool_and(
      NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb
      AND NOT rolcanlogin AND NOT rolreplication AND NOT rolbypassrls
    )
    FROM pg_roles
    WHERE rolname IN ('catalog_worker', 'catalog_function_owner')
  ),
  'Catalog roles are NOLOGIN/NOBYPASSRLS/non-privileged'
);

SELECT pg_temp.assert_true(
  NOT has_schema_privilege('catalog_function_owner', 'public', 'CREATE'),
  'function owner has no final CREATE on public'
);
SELECT pg_temp.assert_true(
  has_schema_privilege('catalog_function_owner', 'public', 'USAGE'),
  'function owner retains only public USAGE'
);
SELECT pg_temp.assert_true(
  NOT has_schema_privilege('catalog_function_owner', 'auth', 'USAGE'),
  'function owner receives no direct auth schema access'
);
SELECT pg_temp.assert_true(
  (
    SELECT n.nspowner <> 'catalog_function_owner'::regrole
    FROM pg_namespace n
    WHERE n.nspname = 'public'
  ),
  'function owner does not own public schema'
);
SELECT pg_temp.assert_true(
  NOT pg_has_role('postgres', 'catalog_function_owner', 'USAGE')
  AND NOT EXISTS (
    SELECT 1 FROM pg_auth_members
    WHERE member = 'catalog_function_owner'::regrole
  ),
  'function owner has no effective inherited privilege path'
);

SELECT pg_temp.assert_true(
  (
    SELECT count(*) = 7
      AND bool_and(p.proowner = 'catalog_function_owner'::regrole)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (
        p.proname LIKE '\_catalog%' ESCAPE '\'
        OR p.proname IN ('ingest_directory_candidate', 'publish_directory_candidate')
      )
  ),
  'function owner owns exactly seven approved Catalog functions'
);

SELECT pg_temp.assert_true(
  NOT has_function_privilege(
    'public',
    'public.ingest_directory_candidate(text,uuid,text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  )
  AND NOT has_function_privilege(
    'public',
    'public.publish_directory_candidate(uuid)',
    'EXECUTE'
  ),
  'PUBLIC cannot execute Catalog RPCs'
);
SELECT pg_temp.assert_true(
  has_function_privilege(
    'catalog_worker',
    'public.ingest_directory_candidate(text,uuid,text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  )
  AND NOT has_function_privilege(
    'catalog_worker',
    'public.publish_directory_candidate(uuid)',
    'EXECUTE'
  ),
  'worker executes intake only'
);
SELECT pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.publish_directory_candidate(uuid)',
    'EXECUTE'
  )
  AND NOT has_function_privilege(
    'authenticated',
    'public.ingest_directory_candidate(text,uuid,text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients expose only the internally authorized publication boundary'
);

SELECT pg_temp.assert_true(
  NOT has_table_privilege('catalog_worker', 'public.directory_sources', 'SELECT')
  AND NOT has_table_privilege('catalog_worker', 'public.directory_import_candidates', 'INSERT')
  AND NOT has_table_privilege('catalog_worker', 'public.companies', 'INSERT')
  AND NOT has_table_privilege('catalog_worker', 'public.audit_logs', 'INSERT')
  AND NOT has_table_privilege('catalog_worker', 'public.business_profiles', 'UPDATE')
  AND NOT has_table_privilege('catalog_worker', 'public.university_profiles', 'UPDATE')
  AND NOT has_table_privilege('catalog_worker', 'public.verification_requests', 'UPDATE'),
  'worker has no direct table, Profile, Verification, company, or audit DML'
);

SELECT pg_temp.assert_true(
  (
    SELECT is_enabled = false
    FROM public.feature_flags
    WHERE key = 'catalog.phase1_ingestion'
  )
  AND (
    SELECT is_enabled = true
    FROM public.feature_flags
    WHERE key = 'catalog'
  ),
  'Phase 1 intake defaults off without changing catalog browse flag'
);

-- ---------------------------------------------------------------------------
-- Synthetic actors and Catalog-only governance fixtures
-- ---------------------------------------------------------------------------

SET session_replication_role = replica;
INSERT INTO public.profiles (id, full_name, role)
VALUES
  ('ca700001-0000-4000-8000-000000000001', 'Catalog Staff Fixture', 'staff'),
  ('ca700002-0000-4000-8000-000000000002', 'Catalog Admin Fixture', 'admin'),
  ('ca700003-0000-4000-8000-000000000003', 'Catalog Super Admin Fixture', 'super_admin'),
  ('ca700004-0000-4000-8000-000000000004', 'Catalog Individual Fixture', 'individual'),
  ('ca700005-0000-4000-8000-000000000005', 'Catalog Business Fixture', 'company_admin'),
  ('ca700006-0000-4000-8000-000000000006', 'Catalog University Fixture', 'university_admin'),
  ('ca700007-0000-4000-8000-000000000007', 'Catalog Entity Fixture', 'entity');
SET session_replication_role = origin;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'catalog_worker_login_fixture') THEN
    CREATE ROLE catalog_worker_login_fixture LOGIN NOBYPASSRLS
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
      IN ROLE catalog_worker;
  END IF;
END;
$$;

GRANT catalog_worker_login_fixture TO postgres;

INSERT INTO public.directory_sources (
  id, source_key, display_name, qualification_state, lifecycle_state,
  licence_reference, permitted_fields, retention_override_days,
  parser_name, parser_version, health_state, responsible_staff_id, activated_at,
  suspended_at, suspension_reason
) VALUES (
  'ca710001-0000-4000-8000-000000000001',
  'catalog.approved', 'Approved Catalog Source', 'qualified', 'active',
  'Synthetic test licence', ARRAY[
    'legal_name', 'name_ar', 'official_domains', 'city', 'entity_creation_date'
  ], NULL, 'catalog-fixture-parser', '1.0.0', 'healthy',
  'ca700001-0000-4000-8000-000000000001', now(), NULL, NULL
), (
  'ca710002-0000-4000-8000-000000000002',
  'catalog.unqualified', 'Unqualified Catalog Source', 'pending', 'inactive',
  'Synthetic test licence', ARRAY['legal_name'], NULL,
  'catalog-fixture-parser', '1.0.0', 'unknown',
  'ca700001-0000-4000-8000-000000000001', NULL, NULL, NULL
), (
  'ca710003-0000-4000-8000-000000000003',
  'catalog.suspended', 'Suspended Catalog Source', 'qualified', 'suspended',
  'Synthetic test licence', ARRAY['legal_name'], 45,
  'catalog-fixture-parser', '1.0.0', 'unhealthy',
  'ca700001-0000-4000-8000-000000000001', now(), now(), 'Synthetic suspension'
);

INSERT INTO public.directory_sync_runs (
  id, source_id, worker_identity, mode, parser_version
) VALUES (
  'ca720001-0000-4000-8000-000000000001',
  'ca710001-0000-4000-8000-000000000001',
  'catalog_worker_login_fixture', 'full', '1.0.0'
), (
  'ca720002-0000-4000-8000-000000000002',
  'ca710002-0000-4000-8000-000000000002',
  'catalog_worker_login_fixture', 'full', '1.0.0'
), (
  'ca720003-0000-4000-8000-000000000003',
  'ca710003-0000-4000-8000-000000000003',
  'catalog_worker_login_fixture', 'full', '1.0.0'
);

-- RLS role matrix: Staff/Super Admin see bounded rows; others see none.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700004-0000-4000-8000-000000000004', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0 FROM public.directory_sources),
  'Individual cannot read adjacent tables'
);
SELECT set_config('request.jwt.claim.sub', 'ca700005-0000-4000-8000-000000000005', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0 FROM public.directory_sources),
  'Business cannot read adjacent tables'
);
SELECT set_config('request.jwt.claim.sub', 'ca700006-0000-4000-8000-000000000006', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0 FROM public.directory_raw_evidence),
  'University cannot read raw evidence'
);
SELECT set_config('request.jwt.claim.sub', 'ca700002-0000-4000-8000-000000000002', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0 FROM public.directory_sources),
  'Admin has no Catalog Staff read authority'
);
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 FROM public.directory_sources),
  'Staff has bounded Catalog review read'
);
SELECT set_config('request.jwt.claim.sub', 'ca700003-0000-4000-8000-000000000003', false);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 FROM public.directory_sources),
  'Super Admin has bounded Catalog review read'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  NOT has_table_privilege('anon', 'public.directory_sources', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public.directory_sources', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.companies', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.companies', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.companies', 'DELETE'),
  'anon/client Catalog and companies writes are denied'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.expect_error(
  $sql$INSERT INTO public.audit_logs(action,entity_type) VALUES ('forged','catalog')$sql$,
  'Staff direct audit insert'
);
RESET ROLE;

-- ---------------------------------------------------------------------------
-- Intake: disabled, governance denials, validation, accept, replay, quarantine
-- ---------------------------------------------------------------------------

SET ROLE catalog_worker_login_fixture;
DO $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.ingest_directory_candidate(
    'catalog.approved',
    'ca720001-0000-4000-8000-000000000001',
    'record-disabled', 'idem-disabled-0001',
    repeat('1', 64),
    '{"content_type":"application/json","content_size_bytes":100,"retrieved_at":"2026-08-03T00:00:00Z","parser_version":"1.0.0"}',
    '{"normalized_identity":"Disabled Fixture","organization_type":"business"}',
    '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'feature_disabled', 'disabled flag blocks intake');
END;
$$;
RESET ROLE;

UPDATE public.feature_flags
SET is_enabled = true, updated_at = now()
WHERE key = 'catalog.phase1_ingestion';

SET ROLE catalog_worker_login_fixture;
DO $$
DECLARE
  v_result jsonb;
  v_metadata jsonb := '{"content_type":"application/json","content_size_bytes":512,"retrieved_at":"2026-08-03T00:00:00Z","licence_reference":"Synthetic test licence","parser_version":"1.0.0","personal_data_dominated":false}';
  v_candidate jsonb := '{"normalized_identity":"Acme Recovery Ltd","organization_type":"business"}';
  v_facts jsonb := '{
    "legal_name":{
      "normalized_value":"Acme Recovery Ltd","original_value":"ACME RECOVERY LTD",
      "source_field":"legal_name","transformation":"trim",
      "confidence":"high","confidence_reason":"Exact authoritative registry value",
      "authority_level":"authoritative","observed_at":"2026-08-03T00:00:00Z"
    },
    "name_ar":{
      "normalized_value":"شركة أكمي للتعافي","original_value":"شركة أكمي للتعافي",
      "source_field":"legal_name_ar","transformation":"none",
      "confidence":"high","confidence_reason":"Authoritative Arabic registry value",
      "authority_level":"authoritative","observed_at":"2026-08-03T00:00:00Z"
    },
    "official_domains":{
      "normalized_value":["acme-recovery.sa"],"original_value":["ACME-RECOVERY.SA"],
      "source_field":"official_domain","transformation":"lowercase",
      "confidence":"high","confidence_reason":"Official domain evidence",
      "authority_level":"authoritative","observed_at":"2026-08-03T00:00:00Z"
    },
    "city":{
      "normalized_value":"Riyadh","original_value":"Riyadh",
      "source_field":"legal_address.city","transformation":"none",
      "confidence":"high","confidence_reason":"Approved legal-address locality",
      "authority_level":"authoritative","observed_at":"2026-08-03T00:00:00Z"
    },
    "entity_creation_date":{
      "normalized_value":"2020-04-15","original_value":"2020-04-15",
      "source_field":"entity_creation_date","transformation":"extract_year_exact_entity_creation_date",
      "confidence":"high","confidence_reason":"Exact entity-creation date",
      "authority_level":"authoritative","observed_at":"2026-08-03T00:00:00Z",
      "effective_at":"2020-04-15T00:00:00Z"
    }
  }';
BEGIN
  v_result := public.ingest_directory_candidate(
    'catalog.unqualified', 'ca720002-0000-4000-8000-000000000002',
    'record-unqualified', 'idem-unqualified-01', repeat('2', 64),
    v_metadata, v_candidate, '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'source_unqualified', 'unqualified source denied');

  v_result := public.ingest_directory_candidate(
    'catalog.suspended', 'ca720003-0000-4000-8000-000000000003',
    'record-suspended', 'idem-suspended-0001', repeat('3', 64),
    v_metadata, v_candidate, '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'source_suspended', 'suspended source denied');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'bad key spaces', 'idem-invalid-record', repeat('4', 64),
    v_metadata, v_candidate, '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'invalid_source_record', 'invalid source-record denied');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-oversized', 'idem-oversized-001', repeat('5', 64),
    jsonb_build_object(
      'content_type', 'application/json', 'content_size_bytes', 100,
      'retrieved_at', '2026-08-03T00:00:00Z', 'private_locator', repeat('x', 9000)
    ),
    v_candidate, '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'metadata_oversized', 'oversized metadata denied');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-prohibited', 'idem-prohibited-01', repeat('6', 64),
    v_metadata, v_candidate || '{"claimed_by":"ca700005-0000-4000-8000-000000000005"}', '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'prohibited_field', 'prohibited field denied');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-invalid-fact', 'idem-invalid-fact1', repeat('7', 64),
    v_metadata, v_candidate, '{"email":{"normalized_value":"not-allowed"}}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'invalid_fact_field', 'invalid fact field denied');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-personal', 'idem-personal-0001', repeat('8', 64),
    v_metadata || '{"personal_data_dominated":true}',
    v_candidate, '{}'
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'personal_data_quarantine', 'personal data quarantined');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-acme-001', 'idem-acme-000001', repeat('a', 64),
    v_metadata, v_candidate, v_facts
  );
  PERFORM pg_temp.assert_true(v_result->>'ok' = 'true' AND v_result->>'replayed' = 'false', 'approved intake accepted');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-acme-001', 'idem-acme-000001', repeat('a', 64),
    v_metadata, v_candidate, v_facts
  );
  PERFORM pg_temp.assert_true(v_result->>'ok' = 'true' AND v_result->>'replayed' = 'true', 'idempotent replay');

  v_result := public.ingest_directory_candidate(
    'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
    'record-acme-001', 'idem-acme-mismatch', repeat('b', 64),
    v_metadata, v_candidate, v_facts
  );
  PERFORM pg_temp.assert_true(v_result->>'code' = 'checksum_mismatch', 'checksum mismatch dead-lettered');
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (
    SELECT retention_state = 'quarantined'
      AND personal_data_dominated
      AND private_locator IS NULL
      AND deletion_eligible_at <= retrieved_at + interval '30 days'
    FROM public.directory_raw_evidence
    WHERE source_record_key = 'record-personal'
  ),
  'personal-data evidence quarantined with 30-day review'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) >= 8 FROM public.directory_dead_letters),
  'validation failures create bounded dead letters'
);
SELECT pg_temp.assert_true(
  (
    SELECT accepted_count = (
      SELECT count(*) FROM public.directory_import_candidates c WHERE c.run_id = r.id
    )
    AND rejected_count = (
      SELECT count(*) FROM public.directory_dead_letters d WHERE d.run_id = r.id
    )
    AND dead_letter_count = rejected_count
    FROM public.directory_sync_runs r
    WHERE id = 'ca720001-0000-4000-8000-000000000001'
  ),
  'run counters derive from real rows'
);

-- Program-scope constraint makes wrong-scope sources impossible at rest.
SELECT pg_temp.expect_error(
  $sql$INSERT INTO public.directory_sources (
    source_key, display_name, program_scope, qualification_state, lifecycle_state,
    licence_reference, permitted_fields, parser_name, parser_version
  ) VALUES (
    'catalog.wrong-scope', 'Wrong Scope', 'other', 'pending', 'inactive',
    'Synthetic', ARRAY['legal_name'], 'fixture', '1'
  )$sql$,
  'wrong program scope constraint'
);
SELECT pg_temp.expect_error(
  $sql$INSERT INTO public.directory_sources (
    source_key, display_name, qualification_state, lifecycle_state,
    licence_reference, permitted_fields, parser_name, parser_version
  ) VALUES (
    'catalog.approved', 'Duplicate Source', 'pending', 'inactive',
    'Synthetic', ARRAY['legal_name'], 'fixture', '1'
  )$sql$,
  'duplicate source key'
);

-- ---------------------------------------------------------------------------
-- Human publication: role denial, state/evidence gates, exact allowlist/pins
-- ---------------------------------------------------------------------------

SELECT pg_temp.expect_error(
  $sql$UPDATE public.directory_review_queue
    SET status='approved', reviewer_id='ca700001-0000-4000-8000-000000000001',
        decision='approve', decided_at=now()
    WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    )$sql$,
  'approved review requires notes'
);

UPDATE public.directory_import_candidates
SET state = 'approved'
WHERE source_record_key = 'record-acme-001';
UPDATE public.directory_review_queue
SET
  status = 'approved',
  reviewer_id = 'ca700001-0000-4000-8000-000000000001',
  decision = 'approve',
  review_notes = 'Synthetic human review approved exact evidence.',
  decided_at = now()
WHERE candidate_id = (
  SELECT id FROM public.directory_import_candidates WHERE source_record_key = 'record-acme-001'
);

-- Admin and external actors can invoke the exposed RPC but are denied internally.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700002-0000-4000-8000-000000000002', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'catalog_publication_forbidden',
  'Admin publication denied'
);
SELECT set_config('request.jwt.claim.sub', 'ca700004-0000-4000-8000-000000000004', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'catalog_publication_forbidden',
  'Individual publication denied'
);
SELECT set_config('request.jwt.claim.sub', 'ca700005-0000-4000-8000-000000000005', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'catalog_publication_forbidden',
  'Business publication denied'
);
SELECT set_config('request.jwt.claim.sub', 'ca700006-0000-4000-8000-000000000006', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'catalog_publication_forbidden',
  'University publication denied'
);
RESET ROLE;

-- Source suspension after intake blocks publication, then a Staff-governed
-- reactivation restores only the already-approved candidate boundary.
UPDATE public.directory_sources
SET lifecycle_state='suspended', suspended_at=now(), suspension_reason='Post-intake test suspension'
WHERE id='ca710001-0000-4000-8000-000000000001';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'source_not_active',
  'source suspension after intake blocks publication'
);
RESET ROLE;
UPDATE public.directory_sources
SET lifecycle_state='active'
WHERE id='ca710001-0000-4000-8000-000000000001';

-- Stale evidence is rejected without publication.
UPDATE public.directory_raw_evidence
SET deletion_eligible_at = now() - interval '1 second'
WHERE source_record_key='record-acme-001';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'code') = 'evidence_not_current',
  'stale evidence blocks publication'
);
RESET ROLE;
UPDATE public.directory_raw_evidence
SET deletion_eligible_at = NULL
WHERE source_record_key='record-acme-001';

CREATE TEMP TABLE catalog_side_effect_baseline AS
SELECT
  (SELECT count(*) FROM public.business_profiles) AS business_profiles_count,
  (SELECT count(*) FROM public.university_profiles) AS university_profiles_count,
  (SELECT count(*) FROM public.verification_requests) AS verification_count;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'ok') = 'true',
  'Staff publishes an approved candidate post-revoke'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate(
    (SELECT id FROM public.directory_review_queue WHERE candidate_id=(
      SELECT id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001'
    ))
  )->>'replayed') = 'true',
  'publication replay is idempotent'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  (
    SELECT
      name = 'Acme Recovery Ltd'
      AND name_ar = 'شركة أكمي للتعافي'
      AND domains = ARRAY['acme-recovery.sa']
      AND entity_type = 'business'
      AND city = 'Riyadh'
      AND founded_year = 2020
      AND slug IS NOT NULL
      AND is_active
      AND link_status = 'pending'
      AND claimed_by IS NULL
      AND claim_requested_at IS NULL
      AND NOT is_verified
      AND entity_state = 'unclaimed'
    FROM public.companies
    WHERE id = (
      SELECT published_directory_id
      FROM public.directory_import_candidates
      WHERE source_record_key='record-acme-001'
    )
  ),
  'publication writes exact allowlist and pinned values'
);

SELECT pg_temp.assert_true(
  (
    SELECT
      business_profiles_count = (SELECT count(*) FROM public.business_profiles)
      AND university_profiles_count = (SELECT count(*) FROM public.university_profiles)
      AND verification_count = (SELECT count(*) FROM public.verification_requests)
    FROM catalog_side_effect_baseline
  ),
  'publication has no Profile or Verification side effect'
);
SELECT pg_temp.assert_true(
  (
    SELECT count(*) = 1
    FROM public.audit_logs
    WHERE action='catalog.directory.published'
      AND entity_id=(
        SELECT published_directory_id
        FROM public.directory_import_candidates
        WHERE source_record_key='record-acme-001'
      )
  ),
  'single publication success audit'
);
SELECT pg_temp.expect_error(
  $sql$UPDATE public.audit_logs SET action='forged' WHERE action='catalog.directory.published'$sql$,
  'audit immutability'
);

-- ---------------------------------------------------------------------------
-- Retention and provenance metadata
-- ---------------------------------------------------------------------------

INSERT INTO public.directory_raw_evidence (
  id, source_id, run_id, source_record_key, content_type, content_size_bytes,
  checksum_sha256, retrieved_at, licence_reference, parser_version,
  retention_state, deletion_eligible_at
) VALUES (
  'ca730001-0000-4000-8000-000000000001',
  'ca710001-0000-4000-8000-000000000001',
  'ca720001-0000-4000-8000-000000000001',
  'record-retention-180', 'application/json', 0, repeat('c',64),
  now(), 'Synthetic test licence', '1.0.0', 'superseded', now() + interval '180 days'
), (
  'ca730002-0000-4000-8000-000000000002',
  'ca710003-0000-4000-8000-000000000003',
  'ca720003-0000-4000-8000-000000000003',
  'record-retention-short', 'application/json', 0, repeat('d',64),
  now(), 'Synthetic shorter licence', '1.0.0', 'superseded', now() + interval '45 days'
);

SELECT pg_temp.assert_true(
  (
    SELECT retention_state='active' AND deletion_eligible_at IS NULL
    FROM public.directory_raw_evidence WHERE source_record_key='record-acme-001'
  ),
  'referenced evidence retained'
);
SELECT pg_temp.assert_true(
  (
    SELECT deletion_eligible_at BETWEEN created_at + interval '179 days'
                                    AND created_at + interval '181 days'
    FROM public.directory_raw_evidence WHERE source_record_key='record-retention-180'
  ),
  'unreferenced superseded evidence has 180-day default metadata'
);
SELECT pg_temp.assert_true(
  (
    SELECT deletion_eligible_at BETWEEN created_at + interval '44 days'
                                    AND created_at + interval '46 days'
    FROM public.directory_raw_evidence WHERE source_record_key='record-retention-short'
  ),
  'shorter retention override metadata retained'
);

UPDATE public.directory_raw_evidence
SET legal_hold=true, legal_hold_reason='Synthetic legal hold'
WHERE source_record_key='record-retention-180';
SELECT pg_temp.assert_true(
  (
    SELECT legal_hold AND payload_deleted_at IS NULL
    FROM public.directory_raw_evidence WHERE source_record_key='record-retention-180'
  ),
  'legal hold pauses deletion'
);

UPDATE public.directory_raw_evidence
SET
  retention_state='payload_deleted',
  payload_deleted_at=now(),
  payload_deletion_reason='Synthetic retention proof'
WHERE source_record_key='record-retention-short';
SELECT pg_temp.assert_true(
  (
    SELECT
      retention_state='payload_deleted'
      AND checksum_sha256=repeat('d',64)
      AND source_id='ca710003-0000-4000-8000-000000000003'
      AND retrieved_at IS NOT NULL
      AND parser_version='1.0.0'
      AND licence_reference='Synthetic shorter licence'
      AND payload_deleted_at IS NOT NULL
      AND payload_deletion_reason='Synthetic retention proof'
    FROM public.directory_raw_evidence WHERE source_record_key='record-retention-short'
  ),
  'payload deletion retains immutable provenance metadata'
);

-- Direct function-owner DML exists only for function bodies; the role cannot
-- be used as a client because it is NOLOGIN.
SELECT pg_temp.assert_true(
  NOT (SELECT rolcanlogin FROM pg_roles WHERE rolname='catalog_function_owner'),
  'function owner cannot authenticate directly'
);

-- Leave flag off and expose deterministic fixture IDs for external concurrency probes.
UPDATE public.feature_flags
SET is_enabled=false, updated_at=now()
WHERE key='catalog.phase1_ingestion';

REVOKE catalog_worker_login_fixture FROM postgres;

SELECT 'CATALOG_DISPOSABLE_MATRIX_PASS' AS result;
