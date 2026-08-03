\set ON_ERROR_STOP on

-- Runs after catalog-phase1-foundations.disposable.sql in the same disposable DB.

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

CREATE OR REPLACE FUNCTION pg_temp.create_publication_fixture(
  p_case_key text,
  p_company_name text,
  p_domains jsonb,
  p_authority text DEFAULT 'authoritative',
  p_observed_at timestamptz DEFAULT '2026-08-04T00:00:00Z',
  p_target uuid DEFAULT NULL,
  p_evidence_state text DEFAULT 'active',
  p_review_status text DEFAULT 'approved'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_evidence_id uuid := gen_random_uuid();
  v_candidate_id uuid := gen_random_uuid();
  v_queue_id uuid := gen_random_uuid();
  v_checksum text := md5(p_case_key) || md5(p_case_key);
BEGIN
  INSERT INTO public.directory_raw_evidence (
    id, source_id, run_id, source_record_key, content_type, content_size_bytes,
    checksum_sha256, retrieved_at, licence_reference, parser_version,
    retention_state, deletion_eligible_at
  ) VALUES (
    v_evidence_id,
    'ca710001-0000-4000-8000-000000000001',
    'ca720001-0000-4000-8000-000000000001',
    'edge-' || p_case_key, 'application/json', 100, v_checksum,
    '2026-08-04T00:00:00Z', 'Synthetic test licence', '1.0.0',
    p_evidence_state,
    CASE WHEN p_evidence_state = 'active' THEN NULL ELSE now() + interval '180 days' END
  );

  INSERT INTO public.directory_import_candidates (
    id, source_id, run_id, evidence_id, source_record_key,
    normalized_identity, organization_type, state, idempotency_key,
    checksum_sha256, deterministic_match_target
  ) VALUES (
    v_candidate_id,
    'ca710001-0000-4000-8000-000000000001',
    'ca720001-0000-4000-8000-000000000001',
    v_evidence_id, 'edge-' || p_case_key, lower(p_company_name),
    'business', 'approved', 'edge-idem-' || p_case_key, v_checksum, p_target
  );

  INSERT INTO public.directory_candidate_facts (
    candidate_id, evidence_id, source_id, fact_key, normalized_value,
    original_value, source_field, transformation, confidence,
    confidence_reason, authority_level, observed_at
  ) VALUES (
    v_candidate_id, v_evidence_id,
    'ca710001-0000-4000-8000-000000000001',
    'legal_name', to_jsonb(p_company_name), to_jsonb(p_company_name),
    'legal_name', 'none', 'high', 'Synthetic edge proof',
    p_authority, p_observed_at
  );

  IF p_domains IS NOT NULL THEN
    INSERT INTO public.directory_candidate_facts (
      candidate_id, evidence_id, source_id, fact_key, normalized_value,
      original_value, source_field, transformation, confidence,
      confidence_reason, authority_level, observed_at
    ) VALUES (
      v_candidate_id, v_evidence_id,
      'ca710001-0000-4000-8000-000000000001',
      'official_domains', p_domains, p_domains, 'official_domain',
      'lowercase', 'high', 'Synthetic edge proof', p_authority, p_observed_at
    );
  END IF;

  INSERT INTO public.directory_review_queue (
    id, candidate_id, status, reviewer_id, decision, review_notes, decided_at
  ) VALUES (
    v_queue_id, v_candidate_id, p_review_status,
    CASE WHEN p_review_status = 'approved' THEN 'ca700001-0000-4000-8000-000000000001'::uuid ELSE NULL END,
    CASE WHEN p_review_status = 'approved' THEN 'approve' ELSE NULL END,
    CASE WHEN p_review_status = 'approved' THEN 'Synthetic edge review approval.' ELSE NULL END,
    CASE WHEN p_review_status = 'approved' THEN now() ELSE NULL END
  );

  RETURN v_queue_id;
END;
$$;

UPDATE public.feature_flags
SET is_enabled = true, updated_at = now()
WHERE key = 'catalog.phase1_ingestion';

GRANT catalog_worker_login_fixture TO postgres;

-- Transaction rollback: accepted intake, evidence, queue, counters, and audit
-- all disappear together.
BEGIN;
SET ROLE catalog_worker_login_fixture;
SELECT public.ingest_directory_candidate(
  'catalog.approved', 'ca720001-0000-4000-8000-000000000001',
  'record-rollback', 'idem-rollback-001', repeat('e', 64),
  '{"content_type":"application/json","content_size_bytes":100,"retrieved_at":"2026-08-04T00:00:00Z"}',
  '{"normalized_identity":"rollback proof","organization_type":"business"}',
  '{"legal_name":{"normalized_value":"Rollback Proof Ltd","original_value":"Rollback Proof Ltd","source_field":"legal_name","transformation":"none","confidence":"high","confidence_reason":"Synthetic rollback proof","authority_level":"authoritative","observed_at":"2026-08-04T00:00:00Z"},"official_domains":{"normalized_value":["rollback-proof.sa"],"original_value":["rollback-proof.sa"],"source_field":"official_domain","transformation":"lowercase","confidence":"high","confidence_reason":"Synthetic rollback proof","authority_level":"authoritative","observed_at":"2026-08-04T00:00:00Z"}}'
);
RESET ROLE;
ROLLBACK;
REVOKE catalog_worker_login_fixture FROM postgres;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.directory_import_candidates WHERE source_record_key = 'record-rollback'),
  'intake transaction rollback leaves no candidate'
);
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.directory_raw_evidence WHERE source_record_key = 'record-rollback'),
  'intake transaction rollback leaves no evidence'
);

-- Review and evidence boundary cases.
SELECT pg_temp.create_publication_fixture('review-pending', 'Review Pending Ltd', '["review-pending.sa"]', p_review_status => 'pending');
SELECT pg_temp.create_publication_fixture('domain-missing', 'Missing Domain Ltd', NULL);
SELECT pg_temp.create_publication_fixture('domain-empty', 'Empty Domain Ltd', '[]');
SELECT pg_temp.create_publication_fixture('domain-stub', 'Stub Domain Ltd', '["stub.local"]');
SELECT pg_temp.create_publication_fixture('domain-placeholder', 'Placeholder Domain Ltd', '["example.com"]');
SELECT pg_temp.create_publication_fixture('evidence-superseded', 'Superseded Evidence Ltd', '["superseded-evidence.sa"]', p_evidence_state => 'superseded');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-review-pending'))->>'code') = 'review_not_approved',
  'unapproved review state blocks publication'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-domain-missing'))->>'code') = 'official_domain_invalid',
  'missing domain blocks publication'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-domain-empty'))->>'code') = 'official_domain_invalid',
  'empty domain blocks publication'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-domain-stub'))->>'code') = 'official_domain_invalid',
  'stub.local blocks publication'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-domain-placeholder'))->>'code') = 'official_domain_invalid',
  'placeholder domain blocks publication'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-evidence-superseded'))->>'code') = 'evidence_not_current',
  'superseded evidence blocks publication'
);
RESET ROLE;

-- Both the candidate organization type and an exact target identity are pinned.
SELECT pg_temp.expect_error(
  $sql$UPDATE public.directory_import_candidates SET organization_type='university' WHERE source_record_key='edge-domain-empty'$sql$,
  'wrong organization type rejected by constraint'
);
SELECT pg_temp.create_publication_fixture(
  'target-university', 'Wrong Target Ltd', '["wrong-target.sa"]',
  p_target => (SELECT id FROM public.companies WHERE entity_type='university' ORDER BY id LIMIT 1)
);
SELECT pg_temp.create_publication_fixture(
  'target-no-provenance', 'No Provenance Target Ltd', '["no-provenance-target.sa"]',
  p_target => (SELECT id FROM public.companies WHERE entity_type='business' AND name <> 'Acme Recovery Ltd' ORDER BY id LIMIT 1)
);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-target-university'))->>'code') = 'identity_target_mismatch',
  'non-business deterministic target is rejected'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-target-no-provenance'))->>'code') = 'existing_target_lacks_catalog_provenance',
  'target without Catalog provenance is rejected'
);
RESET ROLE;

-- Duplicate identity, authority comparison, and exact deterministic update.
SELECT pg_temp.create_publication_fixture('duplicate-identity', 'Acme Recovery Ltd', '["acme-recovery.sa"]');
SELECT pg_temp.create_publication_fixture(
  'lower-authority', 'Lower Authority Overwrite Ltd', '["acme-recovery.sa"]',
  p_authority => 'secondary',
  p_target => (SELECT published_directory_id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001')
);
SELECT pg_temp.create_publication_fixture(
  'exact-update', 'Acme Recovery Holdings Ltd', '["acme-recovery.sa"]',
  p_authority => 'authoritative', p_observed_at => '2026-08-05T00:00:00Z',
  p_target => (SELECT published_directory_id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001')
);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700001-0000-4000-8000-000000000001', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-duplicate-identity'))->>'code') = 'duplicate_identity_requires_exact_target',
  'duplicate identity cannot publish without exact target'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-lower-authority'))->>'code') = 'lower_or_older_authority_overwrite',
  'lower-authority overwrite is rejected'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-exact-update'))->>'ok') = 'true',
  'exact deterministic higher-authority update succeeds'
);
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT name='Acme Recovery Holdings Ltd' AND domains=ARRAY['acme-recovery.sa'] AND entity_type='business' AND claimed_by IS NULL AND NOT is_verified AND entity_state='unclaimed' FROM public.companies WHERE id=(SELECT published_directory_id FROM public.directory_import_candidates WHERE source_record_key='record-acme-001')),
  'deterministic update changes only approved fields and preserves pins'
);

-- Super Admin success uses the same bounded RPC; a second call is a replay.
SELECT pg_temp.create_publication_fixture('superadmin-success', 'Super Admin Published Ltd', '["superadmin-published.sa"]');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'ca700003-0000-4000-8000-000000000003', false);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-superadmin-success'))->>'ok') = 'true',
  'Super Admin publishes through the same approved boundary'
);
SELECT pg_temp.assert_true(
  (public.publish_directory_candidate((SELECT q.id FROM public.directory_review_queue q JOIN public.directory_import_candidates c ON c.id=q.candidate_id WHERE c.source_record_key='edge-superadmin-success'))->>'replayed') = 'true',
  'Super Admin publication replay is idempotent'
);
RESET ROLE;

-- Bounded retry state and attribution proof.
INSERT INTO public.directory_dead_letters (
  source_id, run_id, source_record_key, idempotency_key, error_class,
  sanitized_details, retry_state, attributed_worker_identity
) VALUES (
  'ca710001-0000-4000-8000-000000000001',
  'ca720001-0000-4000-8000-000000000001',
  'edge-retry', 'edge-idem-retry', 'unexpected_failure',
  '{"sqlstate":"40001"}', 'pending', 'catalog_worker_login_fixture'
);
UPDATE public.directory_dead_letters
SET retry_state='in_progress', retry_count=1, last_retry_at=now()
WHERE source_record_key='edge-retry';
UPDATE public.directory_dead_letters
SET retry_state='succeeded'
WHERE source_record_key='edge-retry';
SELECT pg_temp.assert_true(
  (SELECT retry_state='succeeded' AND retry_count=1 AND attributed_worker_identity='catalog_worker_login_fixture' FROM public.directory_dead_letters WHERE source_record_key='edge-retry'),
  'dead-letter retry is bounded and attributable'
);
SELECT pg_temp.expect_error(
  $sql$UPDATE public.directory_dead_letters SET retry_count=4 WHERE source_record_key='edge-retry'$sql$,
  'retry count cannot exceed three'
);

-- Leave two approved fixtures for external concurrent publication and keep
-- intake enabled until the external concurrency probe completes.
SELECT pg_temp.create_publication_fixture('concurrent-publication', 'Concurrent Publication Ltd', '["concurrent-publication.sa"]');

SELECT 'CATALOG_DISPOSABLE_EDGE_MATRIX_READY_FOR_CONCURRENCY' AS result;
