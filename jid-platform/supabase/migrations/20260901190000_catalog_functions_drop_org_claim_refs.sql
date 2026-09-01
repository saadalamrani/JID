-- Catalog ingest/publish rewritten off retired Directory ownership columns.
-- Directory publication remains platform-owned and does not grant workspace authority.

CREATE OR REPLACE FUNCTION public.ingest_directory_candidate(p_source_key text, p_run_id uuid, p_source_record_key text, p_idempotency_key text, p_checksum_sha256 text, p_evidence_metadata jsonb, p_candidate jsonb, p_facts jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_source public.directory_sources%ROWTYPE;
  v_run public.directory_sync_runs%ROWTYPE;
  v_existing public.directory_import_candidates%ROWTYPE;
  v_evidence_id uuid;
  v_candidate_id uuid;
  v_queue_id uuid;
  v_fact_key text;
  v_fact jsonb;
  v_retention_deadline timestamptz;
  v_personal boolean := false;
  v_allowed_metadata constant text[] := ARRAY[
    'private_locator', 'content_type', 'content_size_bytes', 'retrieved_at',
    'licence_reference', 'parser_version', 'personal_data_dominated'
  ];
  v_allowed_candidate constant text[] := ARRAY[
    'normalized_identity', 'organization_type', 'deterministic_match_target'
  ];
  v_allowed_facts constant text[] := ARRAY[
    'legal_name', 'name_ar', 'official_domains', 'city', 'entity_creation_date'
  ];
  v_prohibited constant text[] := ARRAY[
    'is_verified', 'slug',
    'profile', 'business_profile', 'university_profile', 'verification_request',
    'owner', 'owner_id', 'email', 'phone', 'officer', 'beneficial_owner',
    'sector_id', 'region_id', 'website_url', 'linkedin_url', 'twitter_url',
    'logo_url', 'cover_url', 'subscription_tier', 'moderation', 'metric'
  ];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.feature_flags
    WHERE key = 'catalog.phase1_ingestion' AND is_enabled = true
  ) THEN
    RETURN public._catalog_reject_intake(
      NULL, NULL, p_source_record_key, p_idempotency_key,
      'feature_disabled', '{}'::jsonb, session_user, false
    );
  END IF;

  SELECT * INTO v_source
  FROM public.directory_sources
  WHERE source_key = p_source_key
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN public._catalog_reject_intake(
      NULL, NULL, p_source_record_key, p_idempotency_key,
      'source_missing', '{}'::jsonb, session_user, false
    );
  END IF;
  IF v_source.program_scope <> 'catalog' THEN
    RETURN public._catalog_reject_intake(v_source.id, NULL, p_source_record_key, p_idempotency_key, 'wrong_program_scope', '{}'::jsonb, session_user, false);
  END IF;
  IF v_source.qualification_state <> 'qualified' THEN
    RETURN public._catalog_reject_intake(v_source.id, NULL, p_source_record_key, p_idempotency_key, 'source_unqualified', '{}'::jsonb, session_user, false);
  END IF;
  IF v_source.lifecycle_state <> 'active' THEN
    RETURN public._catalog_reject_intake(v_source.id, NULL, p_source_record_key, p_idempotency_key, 'source_suspended', '{}'::jsonb, session_user, false);
  END IF;

  SELECT * INTO v_run
  FROM public.directory_sync_runs
  WHERE id = p_run_id AND source_id = v_source.id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN public._catalog_reject_intake(v_source.id, NULL, p_source_record_key, p_idempotency_key, 'run_missing', '{}'::jsonb, session_user, false);
  END IF;
  IF v_run.status NOT IN ('queued', 'intaking') THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'run_ineligible', jsonb_build_object('status', v_run.status), session_user, false);
  END IF;

  IF p_source_record_key IS NULL OR p_source_record_key !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$' THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'invalid_source_record', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF p_idempotency_key IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$' THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'invalid_idempotency_key', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF p_checksum_sha256 IS NULL OR p_checksum_sha256 !~ '^[0-9a-f]{64}$' THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'invalid_checksum', '{}'::jsonb, v_run.worker_identity, false);
  END IF;

  IF p_evidence_metadata IS NULL OR jsonb_typeof(p_evidence_metadata) <> 'object'
     OR p_candidate IS NULL OR jsonb_typeof(p_candidate) <> 'object'
     OR p_facts IS NULL OR jsonb_typeof(p_facts) <> 'object' THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'metadata_invalid', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF pg_column_size(p_evidence_metadata) > 8192 OR pg_column_size(p_candidate) > 8192 OR pg_column_size(p_facts) > 32768 THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'metadata_oversized', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_evidence_metadata) k WHERE k <> ALL(v_allowed_metadata)) THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'metadata_invalid', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_candidate) k WHERE k <> ALL(v_allowed_candidate)) THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'prohibited_field', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_facts) k WHERE k <> ALL(v_allowed_facts)) THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'invalid_fact_field', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_prohibited) prohibited
    WHERE p_candidate ? prohibited OR p_facts ? prohibited OR p_evidence_metadata ? prohibited
  ) THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'prohibited_field', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_facts) k WHERE NOT (k = ANY(v_source.permitted_fields))) THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'invalid_fact_field', '{}'::jsonb, v_run.worker_identity, false);
  END IF;
  IF NULLIF(btrim(p_candidate->>'normalized_identity'), '') IS NULL
     OR p_candidate->>'organization_type' IS DISTINCT FROM 'business' THEN
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'candidate_invalid', '{}'::jsonb, v_run.worker_identity, false);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_source.id::text || ':' || p_source_record_key, 0));

  SELECT * INTO v_existing
  FROM public.directory_import_candidates
  WHERE source_id = v_source.id AND source_record_key = p_source_record_key;
  IF FOUND THEN
    IF v_existing.checksum_sha256 = p_checksum_sha256
       AND v_existing.idempotency_key = p_idempotency_key THEN
      PERFORM public._write_audit_log(
        NULL, 'catalog.intake.replayed', 'directory_import_candidates', v_existing.id,
        NULL, NULL, jsonb_build_object('source_id', v_source.id, 'run_id', v_run.id, 'database_role', session_user)
      );
      RETURN jsonb_build_object('ok', true, 'replayed', true, 'candidate_id', v_existing.id);
    END IF;
    RETURN public._catalog_reject_intake(v_source.id, v_run.id, p_source_record_key, p_idempotency_key, 'checksum_mismatch', '{}'::jsonb, v_run.worker_identity, false);
  END IF;

  v_personal := COALESCE((p_evidence_metadata->>'personal_data_dominated')::boolean, false);
  v_retention_deadline := COALESCE(
    (p_evidence_metadata->>'retrieved_at')::timestamptz,
    now()
  ) + make_interval(days => CASE WHEN v_personal THEN 30 ELSE COALESCE(v_source.retention_override_days, 180) END);

  INSERT INTO public.directory_raw_evidence (
    source_id, run_id, source_record_key, private_locator, content_type,
    content_size_bytes, checksum_sha256, retrieved_at, licence_reference,
    parser_version, retention_state, deletion_eligible_at, personal_data_dominated
  ) VALUES (
    v_source.id, v_run.id, p_source_record_key,
    CASE WHEN v_personal THEN NULL ELSE NULLIF(p_evidence_metadata->>'private_locator', '') END,
    p_evidence_metadata->>'content_type',
    (p_evidence_metadata->>'content_size_bytes')::integer,
    p_checksum_sha256,
    (p_evidence_metadata->>'retrieved_at')::timestamptz,
    COALESCE(NULLIF(p_evidence_metadata->>'licence_reference', ''), v_source.licence_reference),
    COALESCE(NULLIF(p_evidence_metadata->>'parser_version', ''), v_run.parser_version),
    CASE WHEN v_personal THEN 'quarantined' ELSE 'active' END,
    CASE WHEN v_personal THEN v_retention_deadline ELSE NULL END,
    v_personal
  ) RETURNING id INTO v_evidence_id;

  IF v_personal THEN
    RETURN public._catalog_reject_intake(
      v_source.id, v_run.id, p_source_record_key, p_idempotency_key,
      'personal_data_quarantine', jsonb_build_object('evidence_id', v_evidence_id),
      v_run.worker_identity, false
    );
  END IF;

  INSERT INTO public.directory_import_candidates (
    source_id, run_id, evidence_id, source_record_key, normalized_identity,
    organization_type, state, idempotency_key, checksum_sha256, deterministic_match_target
  ) VALUES (
    v_source.id, v_run.id, v_evidence_id, p_source_record_key,
    btrim(p_candidate->>'normalized_identity'), 'business', 'needs_review',
    p_idempotency_key, p_checksum_sha256,
    NULLIF(p_candidate->>'deterministic_match_target', '')::uuid
  ) RETURNING id INTO v_candidate_id;

  FOR v_fact_key, v_fact IN SELECT key, value FROM jsonb_each(p_facts)
  LOOP
    IF jsonb_typeof(v_fact) <> 'object'
       OR EXISTS (
         SELECT 1 FROM jsonb_object_keys(v_fact) k
         WHERE k <> ALL(ARRAY[
           'normalized_value', 'original_value', 'source_field', 'transformation',
           'confidence', 'confidence_reason', 'authority_level', 'observed_at',
           'effective_at', 'reviewer_edit_state'
         ]::text[])
       ) THEN
      RAISE EXCEPTION 'catalog_fact_metadata_invalid:%', v_fact_key;
    END IF;

    INSERT INTO public.directory_candidate_facts (
      candidate_id, evidence_id, source_id, fact_key, normalized_value,
      original_value, source_field, transformation, confidence,
      confidence_reason, authority_level, observed_at, effective_at,
      reviewer_edit_state
    ) VALUES (
      v_candidate_id, v_evidence_id, v_source.id, v_fact_key,
      v_fact->'normalized_value', v_fact->'original_value',
      v_fact->>'source_field', COALESCE(NULLIF(v_fact->>'transformation', ''), 'none'),
      v_fact->>'confidence', v_fact->>'confidence_reason',
      v_fact->>'authority_level', (v_fact->>'observed_at')::timestamptz,
      NULLIF(v_fact->>'effective_at', '')::timestamptz,
      COALESCE(NULLIF(v_fact->>'reviewer_edit_state', ''), 'untouched')
    );
  END LOOP;

  INSERT INTO public.directory_review_queue(candidate_id)
  VALUES (v_candidate_id)
  RETURNING id INTO v_queue_id;

  UPDATE public.directory_sync_runs r
  SET
    status = CASE WHEN r.status = 'queued' THEN 'intaking' ELSE r.status END,
    accepted_count = (
      SELECT count(*)::integer FROM public.directory_import_candidates c WHERE c.run_id = r.id
    ),
    rejected_count = (
      SELECT count(*)::integer FROM public.directory_dead_letters d WHERE d.run_id = r.id
    ),
    dead_letter_count = (
      SELECT count(*)::integer FROM public.directory_dead_letters d WHERE d.run_id = r.id
    )
  WHERE r.id = v_run.id;

  PERFORM public._write_audit_log(
    NULL, 'catalog.intake.accepted', 'directory_import_candidates', v_candidate_id,
    NULL, jsonb_build_object('state', 'needs_review'),
    jsonb_build_object(
      'source_id', v_source.id, 'run_id', v_run.id,
      'evidence_id', v_evidence_id, 'review_queue_id', v_queue_id,
      'database_role', session_user
    )
  );

  RETURN jsonb_build_object(
    'ok', true, 'replayed', false, 'candidate_id', v_candidate_id,
    'evidence_id', v_evidence_id, 'review_queue_id', v_queue_id
  );
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'catalog_fact_metadata_invalid:%' THEN
    RETURN public._catalog_reject_intake(
      CASE WHEN v_source.id IS NULL THEN NULL ELSE v_source.id END,
      CASE WHEN v_run.id IS NULL THEN NULL ELSE v_run.id END,
      p_source_record_key, p_idempotency_key, 'metadata_invalid',
      '{}'::jsonb, COALESCE(v_run.worker_identity, session_user), false
    );
  END IF;
  RETURN public._catalog_reject_intake(
    CASE WHEN v_source.id IS NULL THEN NULL ELSE v_source.id END,
    CASE WHEN v_run.id IS NULL THEN NULL ELSE v_run.id END,
    p_source_record_key, p_idempotency_key, 'unexpected_failure',
    jsonb_build_object('sqlstate', SQLSTATE),
    COALESCE(v_run.worker_identity, session_user), true
  );
END
$function$


CREATE OR REPLACE FUNCTION public.publish_directory_candidate(p_review_queue_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_actor_id uuid := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  v_actor_role public.user_role_enum;
  v_queue public.directory_review_queue%ROWTYPE;
  v_candidate public.directory_import_candidates%ROWTYPE;
  v_source public.directory_sources%ROWTYPE;
  v_evidence public.directory_raw_evidence%ROWTYPE;
  v_target public.companies%ROWTYPE;
  v_company_id uuid;
  v_company_name text;
  v_name_ar text;
  v_city text;
  v_domains text[];
  v_founded_year smallint;
  v_slug text;
  v_duplicate_id uuid;
  v_fact record;
  v_previous record;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'catalog_authentication_required';
  END IF;

  v_actor_role := public.current_user_role();

  IF v_actor_role NOT IN ('staff', 'super_admin') THEN
    RETURN public._catalog_publication_denied(v_actor_id, p_review_queue_id, 'catalog_publication_forbidden');
  END IF;

  SELECT * INTO v_queue
  FROM public.directory_review_queue
  WHERE id = p_review_queue_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN public._catalog_publication_denied(v_actor_id, p_review_queue_id, 'review_queue_not_found');
  END IF;
  IF v_queue.status = 'published' AND v_queue.publication_company_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'replayed', true, 'company_id', v_queue.publication_company_id);
  END IF;
  IF v_queue.status <> 'approved' OR v_queue.decision <> 'approve'
     OR NULLIF(btrim(v_queue.review_notes), '') IS NULL THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'review_not_approved');
  END IF;

  SELECT * INTO v_candidate
  FROM public.directory_import_candidates
  WHERE id = v_queue.candidate_id
  FOR UPDATE;
  IF NOT FOUND OR v_candidate.state <> 'approved' THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'candidate_not_approved');
  END IF;

  SELECT * INTO v_source
  FROM public.directory_sources
  WHERE id = v_candidate.source_id
  FOR SHARE;
  IF NOT FOUND OR v_source.program_scope <> 'catalog'
     OR v_source.qualification_state <> 'qualified'
     OR v_source.lifecycle_state <> 'active' THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'source_not_active');
  END IF;

  SELECT * INTO v_evidence
  FROM public.directory_raw_evidence
  WHERE id = v_candidate.evidence_id
  FOR SHARE;
  IF NOT FOUND OR v_evidence.retention_state <> 'active'
     OR v_evidence.personal_data_dominated
     OR v_evidence.payload_deleted_at IS NOT NULL
     OR (v_evidence.deletion_eligible_at IS NOT NULL AND v_evidence.deletion_eligible_at <= now()) THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'evidence_not_current');
  END IF;

  SELECT normalized_value #>> '{}'
  INTO v_company_name
  FROM public.directory_candidate_facts
  WHERE candidate_id = v_candidate.id AND fact_key = 'legal_name' AND state = 'active';
  IF NULLIF(btrim(v_company_name), '') IS NULL THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'legal_name_missing');
  END IF;

  SELECT array_agg(lower(btrim(value)))
  INTO v_domains
  FROM public.directory_candidate_facts f,
       LATERAL jsonb_array_elements_text(f.normalized_value) value
  WHERE f.candidate_id = v_candidate.id
    AND f.fact_key = 'official_domains'
    AND f.state = 'active';

  IF v_domains IS NULL OR cardinality(v_domains) = 0
     OR EXISTS (
       SELECT 1 FROM unnest(v_domains) domain
       WHERE domain = ''
          OR domain IN ('stub.local', 'localhost', 'example.com', 'placeholder.local')
          OR domain LIKE '%.local'
          OR domain !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
     ) THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'official_domain_invalid');
  END IF;
  SELECT array_agg(DISTINCT domain ORDER BY domain) INTO v_domains FROM unnest(v_domains) domain;

  SELECT CASE
      WHEN authority_level IN ('authoritative', 'staff_reviewed')
           AND (authority_level <> 'staff_reviewed' OR (reviewer_id = v_actor_id AND reviewer_edit_state = 'accepted'))
      THEN NULLIF(btrim(normalized_value #>> '{}'), '')
      ELSE NULL
    END
  INTO v_name_ar
  FROM public.directory_candidate_facts
  WHERE candidate_id = v_candidate.id AND fact_key = 'name_ar' AND state = 'active';

  SELECT NULLIF(btrim(normalized_value #>> '{}'), '')
  INTO v_city
  FROM public.directory_candidate_facts
  WHERE candidate_id = v_candidate.id AND fact_key = 'city' AND state = 'active';

  SELECT CASE
      WHEN transformation = 'extract_year_exact_entity_creation_date'
           AND (normalized_value #>> '{}') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      THEN extract(year FROM (normalized_value #>> '{}')::date)::smallint
      ELSE NULL
    END
  INTO v_founded_year
  FROM public.directory_candidate_facts
  WHERE candidate_id = v_candidate.id AND fact_key = 'entity_creation_date' AND state = 'active';

  IF v_candidate.organization_type <> 'business' THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'organization_type_not_business');
  END IF;

  IF v_candidate.deterministic_match_target IS NULL THEN
    SELECT id INTO v_duplicate_id
    FROM public.companies
    WHERE lower(name) = lower(v_company_name) OR domains && v_domains
    ORDER BY id
    LIMIT 1
    FOR UPDATE;
    IF FOUND THEN
      RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'duplicate_identity_requires_exact_target');
    END IF;

    v_company_id := gen_random_uuid();
    v_slug := left(
      COALESCE(NULLIF(trim(both '-' FROM regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g')), ''), 'business'),
      70
    ) || '-' || left(replace(v_company_id::text, '-', ''), 12);

    INSERT INTO public.companies (
      id, name, name_ar, domains, entity_type, city, founded_year,
      slug, is_active, link_status, updated_at
    ) VALUES (
      v_company_id, v_company_name, v_name_ar, v_domains,
      'business', v_city, v_founded_year, v_slug, true, 'pending', now()
    );

    SELECT * INTO v_target FROM public.companies WHERE id = v_company_id;
    IF v_target.is_verified
       OR EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.directory_id = v_target.id)
       OR EXISTS (SELECT 1 FROM public.university_profiles up WHERE up.directory_id = v_target.id) THEN
      RAISE EXCEPTION 'catalog_pinned_directory_fields_violated';
    END IF;
  ELSE
    SELECT * INTO v_target
    FROM public.companies
    WHERE id = v_candidate.deterministic_match_target
    FOR UPDATE;
    IF NOT FOUND OR v_target.entity_type <> 'business' THEN
      RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'identity_target_mismatch');
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.directory_import_candidates previous_candidate
      WHERE previous_candidate.published_directory_id = v_target.id
        AND previous_candidate.state = 'published'
    ) THEN
      RETURN public._catalog_publication_denied(
        v_actor_id, v_queue.id, 'existing_target_lacks_catalog_provenance'
      );
    END IF;

    FOR v_fact IN
      SELECT fact_key, authority_level, observed_at, normalized_value
      FROM public.directory_candidate_facts
      WHERE candidate_id = v_candidate.id AND state = 'active'
        AND fact_key IN ('legal_name', 'name_ar', 'official_domains', 'city', 'entity_creation_date')
    LOOP
      SELECT f.authority_level, f.observed_at INTO v_previous
      FROM public.directory_import_candidates c
      JOIN public.directory_candidate_facts f ON f.candidate_id = c.id AND f.fact_key = v_fact.fact_key
      WHERE c.published_directory_id = v_target.id AND c.state = 'published'
      ORDER BY public._catalog_authority_rank(f.authority_level) DESC, f.observed_at DESC
      LIMIT 1;
      IF FOUND AND (
        public._catalog_authority_rank(v_fact.authority_level) < public._catalog_authority_rank(v_previous.authority_level)
        OR v_fact.observed_at < v_previous.observed_at
      ) THEN
        RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'lower_or_older_authority_overwrite');
      END IF;
    END LOOP;

    v_company_id := v_target.id;
    UPDATE public.companies
    SET
      name = v_company_name,
      name_ar = COALESCE(v_name_ar, name_ar),
      domains = v_domains,
      city = COALESCE(v_city, city),
      founded_year = COALESCE(v_founded_year, founded_year),
      updated_at = now()
    WHERE id = v_company_id;
  END IF;

  UPDATE public.directory_import_candidates
  SET state = 'published', published_directory_id = v_company_id, published_at = now()
  WHERE id = v_candidate.id AND state = 'approved';
  IF NOT FOUND THEN
    RETURN public._catalog_publication_denied(v_actor_id, v_queue.id, 'concurrent_publication_conflict');
  END IF;

  UPDATE public.directory_review_queue
  SET status = 'published', publication_company_id = v_company_id, published_at = now()
  WHERE id = v_queue.id AND status = 'approved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'catalog_review_concurrency_conflict';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id, 'catalog.directory.published', 'company', v_company_id,
    NULL, jsonb_build_object(
      'name', v_company_name, 'name_ar', v_name_ar, 'domains', v_domains,
      'entity_type', 'business', 'city', v_city, 'founded_year', v_founded_year,
      'is_active', true, 'link_status', 'pending', 'is_verified', false
    ),
    jsonb_build_object(
      'source_id', v_source.id, 'candidate_id', v_candidate.id,
      'review_queue_id', v_queue.id, 'evidence_id', v_evidence.id,
      'operation', CASE WHEN v_candidate.deterministic_match_target IS NULL THEN 'insert' ELSE 'update' END
    )
  );

  RETURN jsonb_build_object('ok', true, 'replayed', false, 'company_id', v_company_id);
END
$function$


DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private', 'jid_private')
    AND p.prokind = 'f'
    AND p.prosrc ~* 'claimed_by|claim_requested_at|c\\.entity_state|companies\\.entity_state';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ORG_CLAIM_FUNCTION_DEPENDENCIES=%', v_count;
  END IF;
END;
$$;
