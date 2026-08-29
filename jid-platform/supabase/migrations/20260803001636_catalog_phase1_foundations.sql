-- JID Catalog Phase 1 / Session B: secure foundations only.
-- No connector, retrieval, external import, automatic publication, Profile,
-- Verification, ownership, production, or public UI behavior is introduced.

-- ---------------------------------------------------------------------------
-- Capability and function-owner roles
-- ---------------------------------------------------------------------------

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'catalog_worker') THEN
    CREATE ROLE catalog_worker NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION INHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'catalog_function_owner') THEN
    CREATE ROLE catalog_function_owner NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION NOINHERIT;
  END IF;
END
$roles$;

GRANT USAGE ON SCHEMA public TO catalog_worker, catalog_function_owner;

-- ---------------------------------------------------------------------------
-- Exact seven-table adjacent schema
-- ---------------------------------------------------------------------------

CREATE TABLE public.directory_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  program_scope text NOT NULL DEFAULT 'catalog',
  qualification_state text NOT NULL DEFAULT 'pending',
  lifecycle_state text NOT NULL DEFAULT 'inactive',
  licence_reference text NOT NULL,
  reference_url text,
  permitted_fields text[] NOT NULL DEFAULT '{}',
  retention_override_days smallint,
  parser_name text NOT NULL,
  parser_version text NOT NULL,
  health_state text NOT NULL DEFAULT 'unknown',
  responsible_staff_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_sources_key_chk
    CHECK (source_key ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
  CONSTRAINT directory_sources_display_name_chk
    CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 160),
  CONSTRAINT directory_sources_program_scope_chk
    CHECK (program_scope = 'catalog'),
  CONSTRAINT directory_sources_qualification_chk
    CHECK (qualification_state IN ('pending', 'qualified', 'rejected')),
  CONSTRAINT directory_sources_lifecycle_chk
    CHECK (lifecycle_state IN ('inactive', 'active', 'suspended')),
  CONSTRAINT directory_sources_health_chk
    CHECK (health_state IN ('unknown', 'healthy', 'degraded', 'unhealthy')),
  CONSTRAINT directory_sources_licence_chk
    CHECK (char_length(btrim(licence_reference)) BETWEEN 1 AND 500),
  CONSTRAINT directory_sources_parser_chk
    CHECK (
      char_length(btrim(parser_name)) BETWEEN 1 AND 100
      AND char_length(btrim(parser_version)) BETWEEN 1 AND 100
    ),
  CONSTRAINT directory_sources_permitted_fields_chk
    CHECK (
      permitted_fields <@ ARRAY[
        'legal_name', 'name_ar', 'official_domains', 'city', 'entity_creation_date'
      ]::text[]
      AND cardinality(permitted_fields) <= 5
    ),
  CONSTRAINT directory_sources_retention_override_chk
    CHECK (retention_override_days IS NULL OR retention_override_days BETWEEN 1 AND 180),
  CONSTRAINT directory_sources_activation_chk
    CHECK (
      lifecycle_state <> 'active'
      OR (
        qualification_state = 'qualified'
        AND responsible_staff_id IS NOT NULL
        AND cardinality(permitted_fields) > 0
        AND activated_at IS NOT NULL
      )
    ),
  CONSTRAINT directory_sources_suspension_chk
    CHECK (
      lifecycle_state <> 'suspended'
      OR (suspended_at IS NOT NULL AND NULLIF(btrim(suspension_reason), '') IS NOT NULL)
    )
);

CREATE TABLE public.directory_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.directory_sources(id) ON DELETE RESTRICT,
  worker_identity text NOT NULL,
  mode text NOT NULL,
  parser_version text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  accepted_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  dead_letter_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  failure_class text,
  failure_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_sync_runs_source_id_id_key UNIQUE (source_id, id),
  CONSTRAINT directory_sync_runs_worker_chk
    CHECK (char_length(btrim(worker_identity)) BETWEEN 1 AND 160),
  CONSTRAINT directory_sync_runs_mode_chk
    CHECK (mode IN ('full', 'incremental', 'retry')),
  CONSTRAINT directory_sync_runs_status_chk
    CHECK (status IN ('queued', 'intaking', 'completed', 'failed', 'cancelled')),
  CONSTRAINT directory_sync_runs_counts_chk
    CHECK (accepted_count >= 0 AND rejected_count >= 0 AND dead_letter_count >= 0),
  CONSTRAINT directory_sync_runs_completion_chk
    CHECK (
      (status IN ('completed', 'failed', 'cancelled')) = (completed_at IS NOT NULL)
    ),
  CONSTRAINT directory_sync_runs_failure_chk
    CHECK (
      (failure_class IS NULL OR char_length(failure_class) <= 80)
      AND (failure_detail IS NULL OR char_length(failure_detail) <= 500)
    )
);

CREATE TABLE public.directory_raw_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.directory_sources(id) ON DELETE RESTRICT,
  run_id uuid NOT NULL,
  source_record_key text NOT NULL,
  private_locator text,
  content_type text NOT NULL,
  content_size_bytes integer NOT NULL,
  checksum_sha256 text NOT NULL,
  retrieved_at timestamptz NOT NULL,
  licence_reference text NOT NULL,
  parser_version text NOT NULL,
  retention_state text NOT NULL DEFAULT 'active',
  deletion_eligible_at timestamptz,
  legal_hold boolean NOT NULL DEFAULT false,
  legal_hold_reason text,
  audit_investigation boolean NOT NULL DEFAULT false,
  personal_data_dominated boolean NOT NULL DEFAULT false,
  payload_deleted_at timestamptz,
  payload_deletion_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_raw_evidence_run_source_fkey
    FOREIGN KEY (source_id, run_id)
    REFERENCES public.directory_sync_runs(source_id, id) ON DELETE RESTRICT,
  CONSTRAINT directory_raw_evidence_source_record_chk
    CHECK (source_record_key ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$'),
  CONSTRAINT directory_raw_evidence_content_type_chk
    CHECK (content_type IN ('application/json', 'application/xml', 'text/csv', 'text/html')),
  CONSTRAINT directory_raw_evidence_size_chk
    CHECK (content_size_bytes BETWEEN 0 AND 10485760),
  CONSTRAINT directory_raw_evidence_checksum_chk
    CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT directory_raw_evidence_retention_chk
    CHECK (retention_state IN ('active', 'superseded', 'quarantined', 'payload_deleted')),
  CONSTRAINT directory_raw_evidence_legal_hold_chk
    CHECK (
      (NOT legal_hold AND legal_hold_reason IS NULL)
      OR (legal_hold AND NULLIF(btrim(legal_hold_reason), '') IS NOT NULL)
    ),
  CONSTRAINT directory_raw_evidence_quarantine_chk
    CHECK (
      NOT personal_data_dominated
      OR (
        retention_state = 'quarantined'
        AND private_locator IS NULL
        AND deletion_eligible_at IS NOT NULL
        AND deletion_eligible_at <= retrieved_at + interval '30 days'
      )
    ),
  CONSTRAINT directory_raw_evidence_deletion_chk
    CHECK (
      (retention_state = 'payload_deleted')
        = (payload_deleted_at IS NOT NULL AND payload_deletion_reason IS NOT NULL)
    ),
  CONSTRAINT directory_raw_evidence_locator_chk
    CHECK (private_locator IS NULL OR char_length(private_locator) <= 500),
  CONSTRAINT directory_raw_evidence_licence_chk
    CHECK (char_length(btrim(licence_reference)) BETWEEN 1 AND 500),
  CONSTRAINT directory_raw_evidence_source_checksum_key
    UNIQUE (source_id, source_record_key, checksum_sha256)
);

CREATE TABLE public.directory_import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.directory_sources(id) ON DELETE RESTRICT,
  run_id uuid NOT NULL,
  evidence_id uuid NOT NULL UNIQUE REFERENCES public.directory_raw_evidence(id) ON DELETE RESTRICT,
  source_record_key text NOT NULL,
  normalized_identity text NOT NULL,
  organization_type text NOT NULL,
  state text NOT NULL DEFAULT 'received',
  idempotency_key text NOT NULL,
  checksum_sha256 text NOT NULL,
  deterministic_match_target uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  conflict_state text NOT NULL DEFAULT 'none',
  terminal_reason text,
  published_directory_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_import_candidates_run_source_fkey
    FOREIGN KEY (source_id, run_id)
    REFERENCES public.directory_sync_runs(source_id, id) ON DELETE RESTRICT,
  CONSTRAINT directory_import_candidates_source_record_key
    UNIQUE (source_id, source_record_key),
  CONSTRAINT directory_import_candidates_run_idempotency_key
    UNIQUE (run_id, idempotency_key),
  CONSTRAINT directory_import_candidates_identity_chk
    CHECK (char_length(btrim(normalized_identity)) BETWEEN 2 AND 300),
  CONSTRAINT directory_import_candidates_org_type_chk
    CHECK (organization_type = 'business'),
  CONSTRAINT directory_import_candidates_state_chk
    CHECK (state IN ('received', 'needs_review', 'approved', 'rejected', 'conflict', 'published', 'superseded')),
  CONSTRAINT directory_import_candidates_idempotency_chk
    CHECK (idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$'),
  CONSTRAINT directory_import_candidates_checksum_chk
    CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT directory_import_candidates_conflict_chk
    CHECK (conflict_state IN ('none', 'possible', 'confirmed')),
  CONSTRAINT directory_import_candidates_terminal_chk
    CHECK (
      state NOT IN ('rejected', 'conflict', 'superseded')
      OR NULLIF(btrim(terminal_reason), '') IS NOT NULL
    ),
  CONSTRAINT directory_import_candidates_publication_chk
    CHECK (
      (state = 'published')
        = (published_directory_id IS NOT NULL AND published_at IS NOT NULL)
    )
);

CREATE INDEX directory_import_candidates_published_directory_idx
  ON public.directory_import_candidates(published_directory_id)
  WHERE published_directory_id IS NOT NULL;

CREATE TABLE public.directory_candidate_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.directory_import_candidates(id) ON DELETE RESTRICT,
  evidence_id uuid NOT NULL REFERENCES public.directory_raw_evidence(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES public.directory_sources(id) ON DELETE RESTRICT,
  fact_key text NOT NULL,
  normalized_value jsonb,
  original_value jsonb,
  source_field text NOT NULL,
  transformation text NOT NULL DEFAULT 'none',
  confidence text NOT NULL,
  confidence_reason text NOT NULL,
  authority_level text NOT NULL,
  observed_at timestamptz NOT NULL,
  effective_at timestamptz,
  reviewer_edit_state text NOT NULL DEFAULT 'untouched',
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_candidate_facts_key_chk
    CHECK (fact_key IN ('legal_name', 'name_ar', 'official_domains', 'city', 'entity_creation_date')),
  CONSTRAINT directory_candidate_facts_source_field_chk
    CHECK (char_length(btrim(source_field)) BETWEEN 1 AND 160),
  CONSTRAINT directory_candidate_facts_transformation_chk
    CHECK (char_length(btrim(transformation)) BETWEEN 1 AND 160),
  CONSTRAINT directory_candidate_facts_confidence_chk
    CHECK (confidence IN ('high', 'medium', 'low')),
  CONSTRAINT directory_candidate_facts_confidence_reason_chk
    CHECK (char_length(btrim(confidence_reason)) BETWEEN 1 AND 500),
  CONSTRAINT directory_candidate_facts_authority_chk
    CHECK (authority_level IN ('secondary', 'official', 'authoritative', 'staff_reviewed')),
  CONSTRAINT directory_candidate_facts_reviewer_edit_chk
    CHECK (reviewer_edit_state IN ('untouched', 'edited', 'accepted', 'rejected')),
  CONSTRAINT directory_candidate_facts_reviewer_chk
    CHECK (
      reviewer_edit_state = 'untouched'
      OR reviewer_id IS NOT NULL
    ),
  CONSTRAINT directory_candidate_facts_state_chk
    CHECK (state IN ('active', 'superseded')),
  CONSTRAINT directory_candidate_facts_value_size_chk
    CHECK (
      pg_column_size(normalized_value) <= 8192
      AND pg_column_size(original_value) <= 8192
    )
);

CREATE UNIQUE INDEX directory_candidate_facts_active_key
  ON public.directory_candidate_facts(candidate_id, fact_key)
  WHERE state = 'active';

CREATE TABLE public.directory_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.directory_import_candidates(id) ON DELETE RESTRICT,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decision text,
  review_notes text,
  assigned_at timestamptz,
  decided_at timestamptz,
  publication_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_review_queue_status_chk
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'published')),
  CONSTRAINT directory_review_queue_decision_chk
    CHECK (decision IS NULL OR decision IN ('approve', 'reject')),
  CONSTRAINT directory_review_queue_assignment_chk
    CHECK ((assigned_to IS NULL) = (assigned_at IS NULL)),
  CONSTRAINT directory_review_queue_review_chk
    CHECK (
      status NOT IN ('approved', 'rejected', 'published')
      OR (
        reviewer_id IS NOT NULL
        AND decision IS NOT NULL
        AND NULLIF(btrim(review_notes), '') IS NOT NULL
        AND decided_at IS NOT NULL
      )
    ),
  CONSTRAINT directory_review_queue_publication_chk
    CHECK (
      (status = 'published')
        = (publication_company_id IS NOT NULL AND published_at IS NOT NULL)
    )
);

CREATE TABLE public.directory_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.directory_sources(id) ON DELETE RESTRICT,
  run_id uuid REFERENCES public.directory_sync_runs(id) ON DELETE RESTRICT,
  source_record_key text,
  idempotency_key text,
  error_class text NOT NULL,
  sanitized_details jsonb NOT NULL DEFAULT '{}',
  retry_state text NOT NULL DEFAULT 'not_retryable',
  retry_count smallint NOT NULL DEFAULT 0,
  attributed_worker_identity text NOT NULL,
  last_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_dead_letters_error_class_chk
    CHECK (error_class IN (
      'feature_disabled', 'source_missing', 'source_unqualified', 'source_suspended',
      'wrong_program_scope', 'run_missing', 'run_ineligible', 'invalid_source_record',
      'invalid_idempotency_key', 'invalid_checksum', 'checksum_mismatch',
      'metadata_invalid', 'metadata_oversized', 'candidate_invalid',
      'invalid_fact_field', 'prohibited_field', 'personal_data_quarantine',
      'concurrent_conflict', 'unexpected_failure'
    )),
  CONSTRAINT directory_dead_letters_details_chk
    CHECK (jsonb_typeof(sanitized_details) = 'object' AND pg_column_size(sanitized_details) <= 4096),
  CONSTRAINT directory_dead_letters_retry_state_chk
    CHECK (retry_state IN ('not_retryable', 'pending', 'in_progress', 'succeeded', 'exhausted')),
  CONSTRAINT directory_dead_letters_retry_count_chk
    CHECK (retry_count BETWEEN 0 AND 3),
  CONSTRAINT directory_dead_letters_worker_chk
    CHECK (char_length(btrim(attributed_worker_identity)) BETWEEN 1 AND 160)
);

CREATE INDEX directory_sources_governance_idx
  ON public.directory_sources(program_scope, qualification_state, lifecycle_state);
CREATE INDEX directory_sync_runs_source_status_idx
  ON public.directory_sync_runs(source_id, status, started_at DESC);
CREATE INDEX directory_raw_evidence_retention_idx
  ON public.directory_raw_evidence(retention_state, deletion_eligible_at)
  WHERE payload_deleted_at IS NULL;
CREATE INDEX directory_raw_evidence_run_idx
  ON public.directory_raw_evidence(run_id);
CREATE INDEX directory_import_candidates_state_idx
  ON public.directory_import_candidates(state, created_at);
CREATE INDEX directory_import_candidates_match_idx
  ON public.directory_import_candidates(deterministic_match_target)
  WHERE deterministic_match_target IS NOT NULL;
CREATE INDEX directory_candidate_facts_evidence_idx
  ON public.directory_candidate_facts(evidence_id, state);
CREATE INDEX directory_review_queue_work_idx
  ON public.directory_review_queue(status, assigned_to, created_at);
CREATE INDEX directory_dead_letters_retry_idx
  ON public.directory_dead_letters(retry_state, retry_count, created_at);

COMMENT ON TABLE public.directory_sources IS
  'Catalog source governance metadata only. Contains no retrieved organization payload.';
COMMENT ON TABLE public.directory_raw_evidence IS
  'Private Catalog evidence metadata only. No public read and no payload retrieval in Phase 1 Session B.';
COMMENT ON TABLE public.directory_import_candidates IS
  'Human-review candidate staging. No state transition can publish automatically.';
COMMENT ON TABLE public.directory_review_queue IS
  'Catalog human-review decisions. Publication is possible only through publish_directory_candidate.';

-- ---------------------------------------------------------------------------
-- State guards and server timestamps
-- ---------------------------------------------------------------------------

CREATE FUNCTION public._catalog_guard_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW)->>'created_at') IS DISTINCT FROM (to_jsonb(OLD)->>'created_at') THEN
      RAISE EXCEPTION 'catalog_created_at_immutable';
    END IF;

    IF TG_TABLE_NAME = 'directory_import_candidates'
       AND (to_jsonb(NEW)->>'state') IS DISTINCT FROM (to_jsonb(OLD)->>'state')
       AND NOT (
         (to_jsonb(OLD)->>'state' = 'received' AND to_jsonb(NEW)->>'state' IN ('needs_review', 'conflict', 'rejected'))
         OR (to_jsonb(OLD)->>'state' = 'needs_review' AND to_jsonb(NEW)->>'state' IN ('approved', 'conflict', 'rejected'))
         OR (to_jsonb(OLD)->>'state' = 'approved' AND to_jsonb(NEW)->>'state' IN ('published', 'rejected'))
       ) THEN
      RAISE EXCEPTION 'catalog_candidate_transition_denied:%->%', to_jsonb(OLD)->>'state', to_jsonb(NEW)->>'state';
    ELSIF TG_TABLE_NAME = 'directory_review_queue'
       AND (to_jsonb(NEW)->>'status') IS DISTINCT FROM (to_jsonb(OLD)->>'status')
       AND NOT (
         (to_jsonb(OLD)->>'status' = 'pending' AND to_jsonb(NEW)->>'status' IN ('in_review', 'approved', 'rejected'))
         OR (to_jsonb(OLD)->>'status' = 'in_review' AND to_jsonb(NEW)->>'status' IN ('approved', 'rejected'))
         OR (to_jsonb(OLD)->>'status' = 'approved' AND to_jsonb(NEW)->>'status' = 'published')
       ) THEN
      RAISE EXCEPTION 'catalog_review_transition_denied:%->%', to_jsonb(OLD)->>'status', to_jsonb(NEW)->>'status';
    ELSIF TG_TABLE_NAME = 'directory_raw_evidence'
       AND (to_jsonb(NEW)->>'retention_state') IS DISTINCT FROM (to_jsonb(OLD)->>'retention_state')
       AND NOT (
         (to_jsonb(OLD)->>'retention_state' = 'active' AND to_jsonb(NEW)->>'retention_state' IN ('superseded', 'quarantined'))
         OR (to_jsonb(OLD)->>'retention_state' IN ('superseded', 'quarantined') AND to_jsonb(NEW)->>'retention_state' = 'payload_deleted')
       ) THEN
      RAISE EXCEPTION 'catalog_retention_transition_denied:%->%', to_jsonb(OLD)->>'retention_state', to_jsonb(NEW)->>'retention_state';
    ELSIF TG_TABLE_NAME = 'directory_sync_runs'
       AND (to_jsonb(NEW)->>'status') IS DISTINCT FROM (to_jsonb(OLD)->>'status')
       AND NOT (
         (to_jsonb(OLD)->>'status' = 'queued' AND to_jsonb(NEW)->>'status' IN ('intaking', 'failed', 'cancelled'))
         OR (to_jsonb(OLD)->>'status' = 'intaking' AND to_jsonb(NEW)->>'status' IN ('completed', 'failed', 'cancelled'))
       ) THEN
      RAISE EXCEPTION 'catalog_run_transition_denied:%->%', to_jsonb(OLD)->>'status', to_jsonb(NEW)->>'status';
    ELSIF TG_TABLE_NAME = 'directory_dead_letters'
       AND (to_jsonb(NEW)->>'retry_state') IS DISTINCT FROM (to_jsonb(OLD)->>'retry_state')
       AND NOT (
         (to_jsonb(OLD)->>'retry_state' = 'pending' AND to_jsonb(NEW)->>'retry_state' IN ('in_progress', 'exhausted'))
         OR (to_jsonb(OLD)->>'retry_state' = 'in_progress' AND to_jsonb(NEW)->>'retry_state' IN ('pending', 'succeeded', 'exhausted'))
       ) THEN
      RAISE EXCEPTION 'catalog_retry_transition_denied:%->%', to_jsonb(OLD)->>'retry_state', to_jsonb(NEW)->>'retry_state';
    END IF;

    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END
$function$;

CREATE TRIGGER directory_sources_guard
  BEFORE UPDATE ON public.directory_sources
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_raw_evidence_guard
  BEFORE UPDATE ON public.directory_raw_evidence
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_import_candidates_guard
  BEFORE UPDATE ON public.directory_import_candidates
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_candidate_facts_guard
  BEFORE UPDATE ON public.directory_candidate_facts
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_review_queue_guard
  BEFORE UPDATE ON public.directory_review_queue
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_dead_letters_guard
  BEFORE UPDATE ON public.directory_dead_letters
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();
CREATE TRIGGER directory_sync_runs_guard
  BEFORE UPDATE ON public.directory_sync_runs
  FOR EACH ROW EXECUTE FUNCTION public._catalog_guard_transition();

-- ---------------------------------------------------------------------------
-- Existing immutable audit integration
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public._write_audit_log(
  uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text
) TO catalog_function_owner;

CREATE FUNCTION public._catalog_audit_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_old jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_action text := 'catalog.' || TG_TABLE_NAME || '.' || lower(TG_OP);
  v_entity_id uuid := COALESCE((v_new->>'id')::uuid, (v_old->>'id')::uuid);
  v_old_bounded jsonb;
  v_new_bounded jsonb;
BEGIN
  v_old_bounded := CASE WHEN v_old IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
    'id', v_old->'id', 'source_id', v_old->'source_id', 'candidate_id', v_old->'candidate_id',
    'state', v_old->'state', 'status', v_old->'status', 'lifecycle_state', v_old->'lifecycle_state',
    'retention_state', v_old->'retention_state', 'retry_state', v_old->'retry_state',
    'legal_hold', v_old->'legal_hold', 'payload_deleted_at', v_old->'payload_deleted_at',
    'decision', v_old->'decision', 'assigned_to', v_old->'assigned_to',
    'publication_company_id', v_old->'publication_company_id'
  )) END;
  v_new_bounded := CASE WHEN v_new IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
    'id', v_new->'id', 'source_id', v_new->'source_id', 'candidate_id', v_new->'candidate_id',
    'state', v_new->'state', 'status', v_new->'status', 'lifecycle_state', v_new->'lifecycle_state',
    'retention_state', v_new->'retention_state', 'retry_state', v_new->'retry_state',
    'legal_hold', v_new->'legal_hold', 'payload_deleted_at', v_new->'payload_deleted_at',
    'decision', v_new->'decision', 'assigned_to', v_new->'assigned_to',
    'publication_company_id', v_new->'publication_company_id'
  )) END;

  IF TG_TABLE_NAME = 'directory_sources'
     AND TG_OP = 'UPDATE'
     AND v_new->>'lifecycle_state' IS DISTINCT FROM v_old->>'lifecycle_state' THEN
    v_action := 'catalog.source.lifecycle_changed';
  ELSIF TG_TABLE_NAME = 'directory_import_candidates'
     AND TG_OP = 'UPDATE'
     AND v_new->>'state' IS DISTINCT FROM v_old->>'state' THEN
    v_action := 'catalog.candidate.state_changed';
  ELSIF TG_TABLE_NAME = 'directory_review_queue'
     AND TG_OP = 'UPDATE'
     AND v_new->>'decision' IS DISTINCT FROM v_old->>'decision' THEN
    v_action := 'catalog.review.decision';
  ELSIF TG_TABLE_NAME = 'directory_review_queue'
     AND TG_OP = 'UPDATE'
     AND v_new->>'assigned_to' IS DISTINCT FROM v_old->>'assigned_to' THEN
    v_action := 'catalog.review.assignment';
  ELSIF TG_TABLE_NAME = 'directory_raw_evidence'
     AND TG_OP = 'UPDATE' THEN
    v_action := 'catalog.evidence.retention_changed';
  ELSIF TG_TABLE_NAME = 'directory_dead_letters'
     AND TG_OP = 'UPDATE' THEN
    v_action := 'catalog.dead_letter.retry';
  END IF;

  PERFORM public._write_audit_log(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    v_action, TG_TABLE_NAME, v_entity_id,
    v_old_bounded, v_new_bounded,
    jsonb_build_object('database_role', current_user)
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public._catalog_guard_transition() FROM PUBLIC, anon, authenticated, service_role, catalog_worker;
REVOKE ALL ON FUNCTION public._catalog_audit_transition() FROM PUBLIC, anon, authenticated, service_role, catalog_worker;

CREATE TRIGGER directory_sources_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_sources
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_sync_runs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_sync_runs
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_raw_evidence_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_raw_evidence
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_import_candidates_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_import_candidates
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_candidate_facts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_candidate_facts
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_review_queue_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_review_queue
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();
CREATE TRIGGER directory_dead_letters_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.directory_dead_letters
  FOR EACH ROW EXECUTE FUNCTION public._catalog_audit_transition();

-- ---------------------------------------------------------------------------
-- RLS: default deny; Staff/Super Admin bounded reads; no client mutations
-- ---------------------------------------------------------------------------

ALTER TABLE public.directory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_sync_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_raw_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_raw_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_import_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_import_candidates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_candidate_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_candidate_facts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_review_queue FORCE ROW LEVEL SECURITY;
ALTER TABLE public.directory_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_dead_letters FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.directory_sources,
  public.directory_sync_runs,
  public.directory_raw_evidence,
  public.directory_import_candidates,
  public.directory_candidate_facts,
  public.directory_review_queue,
  public.directory_dead_letters
FROM PUBLIC, anon, authenticated, service_role, catalog_worker;

GRANT SELECT ON TABLE
  public.directory_sources,
  public.directory_sync_runs,
  public.directory_raw_evidence,
  public.directory_import_candidates,
  public.directory_candidate_facts,
  public.directory_review_queue,
  public.directory_dead_letters
TO authenticated;

DO $policies$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'directory_sources', 'directory_sync_runs', 'directory_raw_evidence',
    'directory_import_candidates', 'directory_candidate_facts',
    'directory_review_queue', 'directory_dead_letters'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''staff'', ''super_admin''))',
      v_table || '_staff_read', v_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO catalog_function_owner USING (true) WITH CHECK (true)',
      v_table || '_function_boundary', v_table
    );
  END LOOP;
END
$policies$;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public.directory_sources,
  public.directory_sync_runs,
  public.directory_raw_evidence,
  public.directory_import_candidates,
  public.directory_candidate_facts,
  public.directory_review_queue,
  public.directory_dead_letters
TO catalog_function_owner;

GRANT SELECT ON TABLE public.feature_flags TO catalog_function_owner;
GRANT SELECT (id, role) ON TABLE public.profiles TO catalog_function_owner;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO catalog_function_owner;

CREATE POLICY catalog_function_owner_catalog_flag_select
  ON public.feature_flags
  FOR SELECT
  TO catalog_function_owner
  USING (key = 'catalog.phase1_ingestion');

-- Catalog publication is RPC-only. Existing SECURITY DEFINER maintenance
-- boundaries remain functional through their owners; client roles retain no
-- direct Directory mutation privilege.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.companies
  FROM PUBLIC, anon, authenticated, catalog_worker;

GRANT SELECT ON TABLE public.companies TO catalog_function_owner;
GRANT INSERT (
  id, name, name_ar, domains, entity_type, city, founded_year,
  slug, is_active, link_status, updated_at
) ON public.companies TO catalog_function_owner;
GRANT UPDATE (
  name, name_ar, domains, city, founded_year, updated_at
) ON public.companies TO catalog_function_owner;

CREATE POLICY directory_catalog_function_select
  ON public.companies FOR SELECT TO catalog_function_owner USING (true);
CREATE POLICY directory_catalog_function_insert
  ON public.companies FOR INSERT TO catalog_function_owner
  WITH CHECK (
    entity_type = 'business'
    AND claimed_by IS NULL
    AND claim_requested_at IS NULL
    AND is_verified = false
    AND entity_state = 'unclaimed'
    AND is_active = true
    AND link_status = 'pending'
  );
CREATE POLICY directory_catalog_function_update
  ON public.companies FOR UPDATE TO catalog_function_owner
  USING (entity_type = 'business')
  WITH CHECK (entity_type = 'business');

-- ---------------------------------------------------------------------------
-- Default-off feature flag (does not alter the existing `catalog` flag)
-- ---------------------------------------------------------------------------

INSERT INTO public.feature_flags (
  key, is_enabled, description, label_ar, label_en,
  description_ar, description_en, category, min_role
)
VALUES (
  'catalog.phase1_ingestion', false,
  'Catalog Phase 1 candidate intake boundary. Default off.',
  'Ø¥Ø¯Ø®Ø§Ù„ Ù…Ø±Ø´Ø­ÙŠ Ø§Ù„Ø¯Ù„ÙŠÙ„ â€” Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰',
  'Catalog Phase 1 ingestion',
  'Ø¨ÙˆØ§Ø¨Ø© Ø¥Ø¯Ø®Ø§Ù„ Ù…Ø±Ø´Ø­ÙŠ Ø§Ù„Ø¯Ù„ÙŠÙ„ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙÙ‚Ø·. Ù…Ø¹Ø·Ù„Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹.',
  'Candidate intake for human review only. Disabled by default.',
  'catalog', 'super_admin'
)
ON CONFLICT (key) DO UPDATE SET
  is_enabled = false,
  description = EXCLUDED.description,
  label_ar = EXCLUDED.label_ar,
  label_en = EXCLUDED.label_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  category = EXCLUDED.category,
  min_role = EXCLUDED.min_role,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Worker-only intake boundary
-- ---------------------------------------------------------------------------

CREATE FUNCTION public._catalog_reject_intake(
  p_source_id uuid,
  p_run_id uuid,
  p_source_record_key text,
  p_idempotency_key text,
  p_error_class text,
  p_details jsonb,
  p_worker_identity text,
  p_retryable boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_dead_id uuid;
BEGIN
  INSERT INTO public.directory_dead_letters (
    source_id, run_id, source_record_key, idempotency_key, error_class,
    sanitized_details, retry_state, attributed_worker_identity
  ) VALUES (
    p_source_id, p_run_id,
    left(NULLIF(p_source_record_key, ''), 200),
    left(NULLIF(p_idempotency_key, ''), 200),
    p_error_class,
    COALESCE(p_details, '{}'::jsonb),
    CASE WHEN p_retryable THEN 'pending' ELSE 'not_retryable' END,
    left(COALESCE(NULLIF(p_worker_identity, ''), session_user), 160)
  ) RETURNING id INTO v_dead_id;

  IF p_run_id IS NOT NULL THEN
    UPDATE public.directory_sync_runs r
    SET
      rejected_count = (
        SELECT count(*)::integer FROM public.directory_dead_letters d WHERE d.run_id = r.id
      ),
      dead_letter_count = (
        SELECT count(*)::integer FROM public.directory_dead_letters d WHERE d.run_id = r.id
      )
    WHERE r.id = p_run_id;
  END IF;

  PERFORM public._write_audit_log(
    NULL, 'catalog.intake.rejected', 'directory_dead_letters', v_dead_id,
    NULL, jsonb_build_object('error_class', p_error_class),
    jsonb_build_object('source_id', p_source_id, 'run_id', p_run_id, 'database_role', session_user)
  );

  RETURN jsonb_build_object('ok', false, 'code', p_error_class, 'dead_letter_id', v_dead_id);
END
$function$;

CREATE FUNCTION public.ingest_directory_candidate(
  p_source_key text,
  p_run_id uuid,
  p_source_record_key text,
  p_idempotency_key text,
  p_checksum_sha256 text,
  p_evidence_metadata jsonb,
  p_candidate jsonb,
  p_facts jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    'claimed_by', 'claim_requested_at', 'is_verified', 'entity_state', 'slug',
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
$function$;

-- ---------------------------------------------------------------------------
-- Authenticated Staff/Super Admin human-publication boundary
-- ---------------------------------------------------------------------------

CREATE FUNCTION public._catalog_authority_rank(p_authority text)
RETURNS smallint
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT CASE p_authority
    WHEN 'secondary' THEN 1
    WHEN 'official' THEN 2
    WHEN 'authoritative' THEN 3
    WHEN 'staff_reviewed' THEN 4
    ELSE 0
  END::smallint
$function$;

CREATE FUNCTION public._catalog_publication_denied(
  p_actor_id uuid,
  p_queue_id uuid,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  PERFORM public._write_audit_log(
    p_actor_id, 'catalog.publication.denied', 'directory_review_queue', p_queue_id,
    NULL, NULL, jsonb_build_object('code', left(p_code, 100))
  );
  RETURN jsonb_build_object('ok', false, 'code', p_code);
END
$function$;

CREATE FUNCTION public.publish_directory_candidate(p_review_queue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    IF v_target.claimed_by IS NOT NULL OR v_target.claim_requested_at IS NOT NULL
       OR v_target.is_verified OR v_target.entity_state <> 'unclaimed' THEN
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
      'is_active', true, 'link_status', 'pending', 'claimed_by', NULL,
      'claim_requested_at', NULL, 'is_verified', false, 'entity_state', 'unclaimed'
    ),
    jsonb_build_object(
      'source_id', v_source.id, 'candidate_id', v_candidate.id,
      'review_queue_id', v_queue.id, 'evidence_id', v_evidence.id,
      'operation', CASE WHEN v_candidate.deterministic_match_target IS NULL THEN 'insert' ELSE 'update' END
    )
  );

  RETURN jsonb_build_object('ok', true, 'replayed', false, 'company_id', v_company_id);
END
$function$;

REVOKE ALL ON FUNCTION public._catalog_reject_intake(uuid, uuid, text, text, text, jsonb, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role, catalog_worker;
REVOKE ALL ON FUNCTION public._catalog_authority_rank(text)
  FROM PUBLIC, anon, authenticated, service_role, catalog_worker;
REVOKE ALL ON FUNCTION public._catalog_publication_denied(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role, catalog_worker;
REVOKE ALL ON FUNCTION public.ingest_directory_candidate(text, uuid, text, text, text, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.publish_directory_candidate(uuid)
  FROM PUBLIC, anon, service_role, catalog_worker;

GRANT EXECUTE ON FUNCTION public.ingest_directory_candidate(
  text, uuid, text, text, text, jsonb, jsonb, jsonb
) TO catalog_worker;
GRANT EXECUTE ON FUNCTION public.publish_directory_candidate(uuid) TO authenticated;

COMMENT ON FUNCTION public.ingest_directory_candidate(text, uuid, text, text, text, jsonb, jsonb, jsonb) IS
  'catalog_worker-only candidate intake. Never writes companies, Profiles, Verification, ownership, or publication state.';
COMMENT ON FUNCTION public.publish_directory_candidate(uuid) IS
  'Authenticated human Staff/Super Admin boundary. Publishes only exact allowlisted Directory fields after approved review.';

-- PostgreSQL requires both SET ROLE ability and target-schema CREATE during an
-- ownership transfer. Keep both privileges migration-local: CREATE is granted
-- directly (never inherited), only the seven approved Catalog functions are
-- transferred, and both temporary privileges are immediately revoked.
GRANT catalog_function_owner TO postgres;
GRANT CREATE ON SCHEMA public TO catalog_function_owner;

ALTER FUNCTION public._catalog_guard_transition() OWNER TO catalog_function_owner;
ALTER FUNCTION public._catalog_audit_transition() OWNER TO catalog_function_owner;
ALTER FUNCTION public._catalog_reject_intake(uuid, uuid, text, text, text, jsonb, text, boolean)
  OWNER TO catalog_function_owner;
ALTER FUNCTION public.ingest_directory_candidate(text, uuid, text, text, text, jsonb, jsonb, jsonb)
  OWNER TO catalog_function_owner;
ALTER FUNCTION public._catalog_authority_rank(text) OWNER TO catalog_function_owner;
ALTER FUNCTION public._catalog_publication_denied(uuid, uuid, text) OWNER TO catalog_function_owner;
ALTER FUNCTION public.publish_directory_candidate(uuid) OWNER TO catalog_function_owner;

REVOKE CREATE ON SCHEMA public FROM catalog_function_owner;
REVOKE catalog_function_owner FROM postgres;

NOTIFY pgrst, 'reload schema';
;
