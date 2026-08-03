\set ON_ERROR_STOP on

-- Targeted deterministic update_existing proof. All rows and grants roll back.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_value boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT COALESCE(p_value, false) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: %', p_message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'public.directory_import_candidates'::regclass
     AND conname = 'directory_import_candidates_flags_chk') =
  'CHECK ((review_flags <@ ARRAY[''lapsed_registration''::text, ''domain_conflict''::text, ''jurisdiction_mismatch''::text, ''no_domain''::text, ''domain_stale''::text, ''personal_data_review''::text, ''inactive_entity''::text, ''unmapped_region''::text, ''ambiguous_match''::text]))',
  'the production review_flags allowlist remains unchanged'
);

SET session_replication_role = replica;
INSERT INTO public.profiles(id, full_name, role) VALUES
  ('cf710001-0000-4000-8000-000000000001', 'Catalog update reviewer', 'staff'),
  ('cf710002-0000-4000-8000-000000000002', 'Catalog update super admin', 'super_admin');
SET session_replication_role = origin;

CREATE TEMP TABLE fixture_baseline AS
SELECT
  (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.id), '[]'::jsonb) FROM public.profiles p) AS profiles,
  (SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.id), '[]'::jsonb) FROM public.verification_requests v) AS verification_requests,
  (SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.id), '[]'::jsonb) FROM public.business_profiles b) AS business_profiles,
  (SELECT COALESCE(jsonb_agg(to_jsonb(u) ORDER BY u.id), '[]'::jsonb) FROM public.university_profiles u) AS university_profiles,
  (SELECT count(*) FROM public.companies) AS company_count;

CREATE TEMP TABLE fixture_company_ownership_before AS
SELECT id, claimed_by, claim_requested_at, is_verified, entity_state
FROM public.companies;

CREATE ROLE catalog_worker_gleif_fixture LOGIN INHERIT NOBYPASSRLS NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION IN ROLE catalog_worker;
GRANT catalog_worker_gleif_fixture TO postgres;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'cf710002-0000-4000-8000-000000000002', false);
SELECT pg_temp.assert_true(
  (public.configure_catalog_gleif(true, true, 10::smallint, 1::smallint)->>'ok')::boolean,
  'Super Admin enables the transaction-local connector configuration'
);
RESET ROLE;

SET ROLE catalog_worker_gleif_fixture;
SELECT pg_temp.assert_true(
  (public.catalog_begin_gleif_run(
    'cf710101-0000-4000-8000-000000000101',
    'retry',
    'catalog_worker_gleif_fixture'
  )->>'ok')::boolean,
  'worker begins the deterministic fixture run'
);
RESET ROLE;
SELECT set_config(
  'catalog.fixture_run_id',
  (SELECT id::text FROM public.directory_sync_runs
   WHERE external_run_id = 'cf710101-0000-4000-8000-000000000101'),
  false
);

SET ROLE catalog_worker_gleif_fixture;
DO $$
DECLARE
  v_result jsonb;
  v_candidate uuid;
BEGIN
  v_result := public.ingest_directory_candidate(
    'gleif.lei-records-v1',
    current_setting('catalog.fixture_run_id')::uuid,
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:A:9845003OC587591DQ586',
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:A:9845003OC587591DQ586',
    repeat('b', 64),
    jsonb_build_object(
      'content_type', 'application/json',
      'content_size_bytes', 512,
      'retrieved_at', '2026-08-03T00:00:00Z',
      'licence_reference', 'GLEIF test evidence',
      'parser_version', '1.0.0',
      'personal_data_dominated', false
    ),
    jsonb_build_object(
      'normalized_identity', 'disposable gleif update business',
      'organization_type', 'business'
    ),
    jsonb_build_object(
      'legal_name', jsonb_build_object(
        'normalized_value', 'Disposable GLEIF Update Business',
        'original_value', 'Disposable GLEIF Update Business',
        'source_field', 'entity.legalName.name',
        'transformation', 'nfc_trim',
        'confidence', 'high',
        'confidence_reason', 'Direct test fixture',
        'authority_level', 'authoritative',
        'observed_at', '2026-08-03T00:00:00Z',
        'reviewer_edit_state', 'proposed'
      ),
      'city', jsonb_build_object(
        'normalized_value', 'Riyadh',
        'original_value', 'Riyadh',
        'source_field', 'entity.legalAddress.city',
        'transformation', 'nfc_trim',
        'confidence', 'high',
        'confidence_reason', 'Direct test fixture',
        'authority_level', 'authoritative',
        'observed_at', '2026-08-03T00:00:00Z',
        'reviewer_edit_state', 'proposed'
      )
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean, 'Candidate A intake succeeds');
  v_candidate := (v_result->>'candidate_id')::uuid;
  PERFORM set_config('catalog.fixture_candidate_a', v_candidate::text, false);
  PERFORM pg_temp.assert_true(
    (public.catalog_capture_gleif_metadata(
      v_candidate,
      '9845003OC587591DQ586',
      '1010000000',
      'RA000513',
      'new',
      '[]'::jsonb,
      ARRAY[]::text[],
      'ACTIVE',
      'ISSUED',
      '{"attributes":{"lei":"9845003OC587591DQ586"}}'::jsonb
    )->>'ok')::boolean,
    'Candidate A metadata uses an empty semantic review flag set'
  );
END;
$$;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'cf710001-0000-4000-8000-000000000001', false);
DO $$
DECLARE
  v_queue uuid;
  v_result jsonb;
BEGIN
  SELECT id INTO v_queue
  FROM public.directory_review_queue
  WHERE candidate_id = current_setting('catalog.fixture_candidate_a')::uuid;
  PERFORM pg_temp.assert_true(
    (public.claim_directory_candidate(v_queue)->>'ok')::boolean,
    'Staff claims Candidate A'
  );
  PERFORM pg_temp.assert_true(
    (public.review_directory_candidate(
      v_queue,
      'validate_domain',
      'Official domain evidence reviewed for the disposable transaction.',
      'disposable-gleif.test',
      'https://registry.test/disposable',
      NULL
    )->>'ok')::boolean,
    'Candidate A domain evidence is accepted'
  );
  PERFORM pg_temp.assert_true(
    (public.review_directory_candidate(
      v_queue,
      'approve',
      'Legal identity and domain evidence reviewed.',
      NULL,
      NULL,
      NULL
    )->>'ok')::boolean,
    'Candidate A is human-approved'
  );
  v_result := public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean, 'Candidate A publishes successfully');
  PERFORM set_config('catalog.fixture_company_id', v_result->>'company_id', false);
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*) = (SELECT company_count + 1 FROM fixture_baseline) FROM public.companies),
  'Candidate A creates exactly one Directory company'
);
SELECT pg_temp.assert_true(
  (SELECT review_flags = ARRAY[]::text[] AND match_outcome = 'new'
   FROM public.directory_import_candidates
   WHERE id = current_setting('catalog.fixture_candidate_a')::uuid),
  'Candidate A preserves an empty review flag set'
);

SET ROLE catalog_worker_gleif_fixture;
DO $$
DECLARE
  v_result jsonb;
  v_candidate uuid;
BEGIN
  v_result := public.ingest_directory_candidate(
    'gleif.lei-records-v1',
    current_setting('catalog.fixture_run_id')::uuid,
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:B:9845003OC587591DQ586',
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:B:9845003OC587591DQ586',
    repeat('c', 64),
    jsonb_build_object(
      'content_type', 'application/json',
      'content_size_bytes', 513,
      'retrieved_at', '2026-08-03T00:01:00Z',
      'licence_reference', 'GLEIF test evidence',
      'parser_version', '1.0.0',
      'personal_data_dominated', false
    ),
    jsonb_build_object(
      'normalized_identity', 'disposable gleif update business',
      'organization_type', 'business'
    ),
    jsonb_build_object(
      'legal_name', jsonb_build_object(
        'normalized_value', 'Disposable GLEIF Update Business',
        'original_value', 'Disposable GLEIF Update Business',
        'source_field', 'entity.legalName.name',
        'transformation', 'nfc_trim',
        'confidence', 'high',
        'confidence_reason', 'Direct test fixture',
        'authority_level', 'authoritative',
        'observed_at', '2026-08-03T00:01:00Z',
        'reviewer_edit_state', 'proposed'
      ),
      'city', jsonb_build_object(
        'normalized_value', 'Riyadh',
        'original_value', 'Riyadh',
        'source_field', 'entity.legalAddress.city',
        'transformation', 'nfc_trim',
        'confidence', 'high',
        'confidence_reason', 'Direct test fixture',
        'authority_level', 'authoritative',
        'observed_at', '2026-08-03T00:01:00Z',
        'reviewer_edit_state', 'proposed'
      )
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean, 'Candidate B intake succeeds');
  v_candidate := (v_result->>'candidate_id')::uuid;
  PERFORM set_config('catalog.fixture_candidate_b', v_candidate::text, false);
  PERFORM pg_temp.assert_true(
    (public.catalog_capture_gleif_metadata(
      v_candidate,
      NULL,
      '1010000000',
      'RA000513',
      'new',
      '[]'::jsonb,
      ARRAY[]::text[],
      'ACTIVE',
      'ISSUED',
      '{"attributes":{"lei":"9845003OC587591DQ586"}}'::jsonb
    )->>'ok')::boolean,
    'Candidate B reuses the valid registration identifier with an empty semantic review flag set'
  );

  v_result := public.ingest_directory_candidate(
    'gleif.lei-records-v1',
    current_setting('catalog.fixture_run_id')::uuid,
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:B:9845003OC587591DQ586',
    'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1:B:9845003OC587591DQ586',
    repeat('c', 64),
    jsonb_build_object(
      'content_type', 'application/json',
      'content_size_bytes', 513,
      'retrieved_at', '2026-08-03T00:01:00Z',
      'licence_reference', 'GLEIF test evidence',
      'parser_version', '1.0.0',
      'personal_data_dominated', false
    ),
    jsonb_build_object(
      'normalized_identity', 'disposable gleif update business',
      'organization_type', 'business'
    ),
    '{}'::jsonb
  );
  PERFORM pg_temp.assert_true(
    (v_result->>'ok')::boolean
      AND (v_result->>'replayed')::boolean
      AND (v_result->>'candidate_id')::uuid = v_candidate,
    'Candidate B intake replay returns the same candidate without duplication'
  );
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT match_outcome = 'update_existing'
      AND deterministic_match_target = current_setting('catalog.fixture_company_id')::uuid
      AND review_flags = ARRAY[]::text[]
      AND registration_identifier = '1010000000'
   FROM public.directory_import_candidates
   WHERE id = current_setting('catalog.fixture_candidate_b')::uuid),
  'Candidate B resolves to update_existing against Candidate A company'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'cf710001-0000-4000-8000-000000000001', false);
DO $$
DECLARE
  v_queue uuid;
  v_result jsonb;
BEGIN
  SELECT id INTO v_queue
  FROM public.directory_review_queue
  WHERE candidate_id = current_setting('catalog.fixture_candidate_b')::uuid;
  PERFORM pg_temp.assert_true(
    (public.claim_directory_candidate(v_queue)->>'ok')::boolean,
    'Staff claims Candidate B'
  );
  PERFORM pg_temp.assert_true(
    (public.review_directory_candidate(
      v_queue,
      'validate_domain',
      'Official domain evidence reviewed for the deterministic update.',
      'disposable-gleif.test',
      'https://registry.test/disposable',
      NULL
    )->>'ok')::boolean,
    'Candidate B domain evidence is accepted for the same target'
  );
  PERFORM pg_temp.assert_true(
    (public.review_directory_candidate(
      v_queue,
      'approve',
      'Deterministic identifier match and domain evidence reviewed.',
      NULL,
      NULL,
      NULL
    )->>'ok')::boolean,
    'Candidate B is human-approved'
  );
  v_result := public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true(
    (v_result->>'ok')::boolean
      AND (v_result->>'company_id')::uuid = current_setting('catalog.fixture_company_id')::uuid,
    'Candidate B publishes into Candidate A company'
  );
  v_result := public.publish_directory_candidate(v_queue);
  PERFORM pg_temp.assert_true(
    (v_result->>'ok')::boolean
      AND (v_result->>'replayed')::boolean
      AND (v_result->>'company_id')::uuid = current_setting('catalog.fixture_company_id')::uuid,
    'publication replay is idempotent'
  );
END;
$$;
RESET ROLE;

SET ROLE catalog_worker_gleif_fixture;
SELECT pg_temp.assert_true(
  (public.catalog_finish_gleif_run(
    current_setting('catalog.fixture_run_id')::uuid,
    'succeeded',
    2,
    0,
    1,
    0,
    '{"page":1}'::jsonb,
    NULL,
    NULL
  )->>'ok')::boolean,
  'worker finalizes the deterministic fixture run'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*) = (SELECT company_count + 1 FROM fixture_baseline) FROM public.companies),
  'Candidate B and both replays create no second company'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM public.directory_import_candidates
   WHERE left(source_record_key, length('JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1')) =
     'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1'),
  'exactly two fixture candidates exist before rollback'
);
SELECT pg_temp.assert_true(
  (SELECT published_directory_id = current_setting('catalog.fixture_company_id')::uuid
   FROM public.directory_import_candidates
   WHERE id = current_setting('catalog.fixture_candidate_a')::uuid)
  AND
  (SELECT published_directory_id = current_setting('catalog.fixture_company_id')::uuid
   FROM public.directory_import_candidates
   WHERE id = current_setting('catalog.fixture_candidate_b')::uuid),
  'Candidates A and B publish to the same companies.id'
);
SELECT pg_temp.assert_true(
  (SELECT profiles = (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.id), '[]'::jsonb)
                      FROM public.profiles p)
      AND verification_requests =
        (SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.id), '[]'::jsonb)
         FROM public.verification_requests v)
      AND business_profiles =
        (SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.id), '[]'::jsonb)
         FROM public.business_profiles b)
      AND university_profiles =
        (SELECT COALESCE(jsonb_agg(to_jsonb(u) ORDER BY u.id), '[]'::jsonb)
         FROM public.university_profiles u)
   FROM fixture_baseline),
  'Profiles, Verification, and owned Profile tables remain byte-for-byte unchanged'
);
SELECT pg_temp.assert_true(
  NOT EXISTS (
    SELECT 1
    FROM fixture_company_ownership_before before
    JOIN public.companies company USING (id)
    WHERE company.claimed_by IS DISTINCT FROM before.claimed_by
       OR company.claim_requested_at IS DISTINCT FROM before.claim_requested_at
       OR company.is_verified IS DISTINCT FROM before.is_verified
       OR company.entity_state IS DISTINCT FROM before.entity_state
  )
  AND (SELECT claimed_by IS NULL
        AND claim_requested_at IS NULL
        AND NOT is_verified
        AND entity_state = 'unclaimed'
       FROM public.companies
       WHERE id = current_setting('catalog.fixture_company_id')::uuid),
  'ownership and claimed_by remain unchanged and the new Directory row stays unowned'
);

SELECT 'JID_CATALOG_UPDATE_FIXTURE_TRANSACTION_PASS' AS result;
ROLLBACK;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.directory_import_candidates
    WHERE left(source_record_key, length('JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1')) =
      'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1'
  ) OR EXISTS (
    SELECT 1 FROM public.directory_raw_evidence
    WHERE left(source_record_key, length('JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1')) =
      'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1'
  ) OR EXISTS (
    SELECT 1 FROM public.directory_dead_letters
    WHERE left(COALESCE(source_record_key, ''), length('JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1')) =
      'JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id IN (
      'cf710001-0000-4000-8000-000000000001',
      'cf710002-0000-4000-8000-000000000002'
    )
  ) OR EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'catalog_worker_gleif_fixture'
  ) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: disposable fixture residue remains after rollback';
  END IF;
END;
$$;

SELECT 'JID_CATALOG_UPDATE_FIXTURE_PREFLIGHT_PASS' AS result;
