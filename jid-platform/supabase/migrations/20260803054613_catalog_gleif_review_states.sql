-- JID Catalog Phase 1 final shipping: GLEIF operations and human review.
-- Extends the seven adjacent Foundations tables only. The existing publication
-- boundary remains the sole path into companies.

ALTER TABLE public.directory_sources
  ADD COLUMN connector_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN connector_kind text NOT NULL DEFAULT 'manual',
  ADD COLUMN schedule_cron text NOT NULL DEFAULT '0 2 * * 1',
  ADD COLUMN api_base_url text,
  ADD COLUMN page_size smallint NOT NULL DEFAULT 100,
  ADD COLUMN max_pages_per_run smallint NOT NULL DEFAULT 2,
  ADD COLUMN last_successful_sync timestamptz,
  ADD COLUMN consecutive_failure_count smallint NOT NULL DEFAULT 0;

ALTER TABLE public.directory_sources
  ADD CONSTRAINT directory_sources_connector_kind_chk
    CHECK (connector_kind IN ('manual', 'gleif')),
  ADD CONSTRAINT directory_sources_page_budget_chk
    CHECK (page_size BETWEEN 1 AND 200 AND max_pages_per_run BETWEEN 1 AND 20),
  ADD CONSTRAINT directory_sources_failure_count_chk
    CHECK (consecutive_failure_count BETWEEN 0 AND 100),
  ADD CONSTRAINT directory_sources_connector_url_chk
    CHECK (api_base_url IS NULL OR api_base_url ~ '^https://');

ALTER TABLE public.directory_sync_runs
  DROP CONSTRAINT directory_sync_runs_status_chk,
  DROP CONSTRAINT directory_sync_runs_completion_chk;

ALTER TABLE public.directory_sync_runs
  ADD COLUMN external_run_id text,
  ADD COLUMN checkpoint jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN retrieved_count integer NOT NULL DEFAULT 0,
  ADD COLUMN skipped_count integer NOT NULL DEFAULT 0,
  ADD COLUMN page_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN retry_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN heartbeat_at timestamptz,
  ADD CONSTRAINT directory_sync_runs_external_run_key UNIQUE (source_id, external_run_id),
  ADD CONSTRAINT directory_sync_runs_status_chk
    CHECK (status IN (
      'queued', 'created', 'intaking', 'running', 'completed', 'succeeded',
      'succeeded_partial', 'failed', 'failed_partial', 'cancelled', 'skipped'
    )),
  ADD CONSTRAINT directory_sync_runs_completion_chk
    CHECK (
      (status IN ('completed', 'succeeded', 'succeeded_partial', 'failed', 'failed_partial', 'cancelled', 'skipped'))
        = (completed_at IS NOT NULL)
    ),
  ADD CONSTRAINT directory_sync_runs_operational_counts_chk
    CHECK (retrieved_count >= 0 AND skipped_count >= 0 AND page_count >= 0 AND retry_count >= 0),
  ADD CONSTRAINT directory_sync_runs_checkpoint_chk
    CHECK (jsonb_typeof(checkpoint) = 'object' AND pg_column_size(checkpoint) <= 8192);

CREATE UNIQUE INDEX directory_sync_runs_one_active_gleif
  ON public.directory_sync_runs(source_id)
  WHERE status IN ('created', 'queued', 'intaking', 'running');

ALTER TABLE public.directory_raw_evidence
  ADD COLUMN source_payload jsonb,
  ADD COLUMN payload_captured_at timestamptz,
  ADD CONSTRAINT directory_raw_evidence_payload_chk
    CHECK (
      (source_payload IS NULL AND payload_captured_at IS NULL)
      OR (
        jsonb_typeof(source_payload) = 'object'
        AND pg_column_size(source_payload) <= 262144
        AND payload_captured_at IS NOT NULL
      )
    );

ALTER TABLE public.directory_import_candidates
  DROP CONSTRAINT directory_import_candidates_state_chk,
  DROP CONSTRAINT directory_import_candidates_terminal_chk;

ALTER TABLE public.directory_import_candidates
  ADD COLUMN lei text,
  ADD COLUMN registration_identifier text,
  ADD COLUMN registration_authority text,
  ADD COLUMN match_outcome text NOT NULL DEFAULT 'new',
  ADD COLUMN match_reasons jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN review_flags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN source_entity_status text,
  ADD COLUMN source_registration_status text,
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD CONSTRAINT directory_import_candidates_lei_chk
    CHECK (lei IS NULL OR lei ~ '^[A-Z0-9]{20}$'),
  ADD CONSTRAINT directory_import_candidates_match_chk
    CHECK (match_outcome IN ('new', 'update_existing', 'ambiguous', 'duplicate_candidate', 'quarantined')),
  ADD CONSTRAINT directory_import_candidates_match_reasons_chk
    CHECK (jsonb_typeof(match_reasons) = 'array' AND pg_column_size(match_reasons) <= 8192),
  ADD CONSTRAINT directory_import_candidates_flags_chk
    CHECK (review_flags <@ ARRAY[
      'lapsed_registration', 'domain_conflict', 'jurisdiction_mismatch',
      'no_domain', 'domain_stale', 'personal_data_review', 'inactive_entity',
      'unmapped_region', 'ambiguous_match'
    ]::text[]),
  ADD CONSTRAINT directory_import_candidates_state_chk
    CHECK (state IN (
      'received', 'needs_review', 'approved_pending_domain', 'approved',
      'rejected', 'conflict', 'quarantined', 'published', 'superseded'
    )),
  ADD CONSTRAINT directory_import_candidates_terminal_chk
    CHECK (
      state NOT IN ('rejected', 'conflict', 'quarantined', 'superseded')
      OR NULLIF(btrim(terminal_reason), '') IS NOT NULL
    );

CREATE UNIQUE INDEX directory_import_candidates_active_lei
  ON public.directory_import_candidates(lei)
  WHERE lei IS NOT NULL AND state NOT IN ('rejected', 'superseded');

ALTER TABLE public.directory_candidate_facts
  DROP CONSTRAINT directory_candidate_facts_key_chk,
  DROP CONSTRAINT directory_candidate_facts_reviewer_edit_chk,
  DROP CONSTRAINT directory_candidate_facts_reviewer_chk;

ALTER TABLE public.directory_candidate_facts
  ADD COLUMN provenance_url text,
  ADD COLUMN reviewer_attestation text,
  ADD COLUMN assist_results jsonb NOT NULL DEFAULT '{}',
  ADD CONSTRAINT directory_candidate_facts_key_chk
    CHECK (fact_key IN (
      'lei', 'legal_name', 'legal_name_language', 'other_names', 'transliterated_names',
      'address_country', 'address_region', 'city', 'address_raw', 'entity_status',
      'registration_status', 'registration_identifier', 'registration_authority',
      'legal_form', 'entity_creation_date', 'jurisdiction', 'parent_leis',
      'name_ar', 'official_domains'
    )),
  ADD CONSTRAINT directory_candidate_facts_reviewer_edit_chk
    CHECK (reviewer_edit_state IN ('untouched', 'proposed', 'edited', 'accepted', 'rejected')),
  ADD CONSTRAINT directory_candidate_facts_reviewer_chk
    CHECK (reviewer_edit_state IN ('untouched','proposed') OR reviewer_id IS NOT NULL),
  ADD CONSTRAINT directory_candidate_facts_provenance_url_chk
    CHECK (provenance_url IS NULL OR provenance_url ~ '^https://'),
  ADD CONSTRAINT directory_candidate_facts_assist_chk
    CHECK (jsonb_typeof(assist_results) = 'object' AND pg_column_size(assist_results) <= 8192);

ALTER TABLE public.directory_review_queue
  DROP CONSTRAINT directory_review_queue_status_chk,
  DROP CONSTRAINT directory_review_queue_decision_chk,
  DROP CONSTRAINT directory_review_queue_review_chk;

ALTER TABLE public.directory_review_queue
  ADD COLUMN returned_at timestamptz,
  ADD COLUMN return_reason text,
  ADD CONSTRAINT directory_review_queue_status_chk
    CHECK (status IN (
      'pending', 'in_review', 'approved_pending_domain', 'approved',
      'rejected', 'returned', 'quarantined', 'published'
    )),
  ADD CONSTRAINT directory_review_queue_decision_chk
    CHECK (decision IS NULL OR decision IN ('approve', 'approve_pending_domain', 'reject', 'return')),
  ADD CONSTRAINT directory_review_queue_review_chk
    CHECK (
      status NOT IN ('approved_pending_domain', 'approved', 'rejected', 'returned', 'published')
      OR (
        reviewer_id IS NOT NULL
        AND decision IS NOT NULL
        AND NULLIF(btrim(review_notes), '') IS NOT NULL
        AND decided_at IS NOT NULL
      )
    );

INSERT INTO public.feature_flags (
  key, is_enabled, description, label_ar, label_en,
  description_ar, description_en, category, min_role
)
VALUES (
  'catalog.gleif_connector_enabled', false,
  'GLEIF retrieval kill switch. Default off and independent from review.',
  'Ù…ÙˆØµÙ„ GLEIF', 'GLEIF connector',
  'Ù…ÙØªØ§Ø­ Ø¥ÙŠÙ‚Ø§Ù Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª GLEIF. Ù…Ø¹Ø·Ù„ Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹.',
  'Retrieval-only kill switch. Disabled by default.',
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

CREATE POLICY catalog_function_owner_gleif_flag_select
  ON public.feature_flags FOR SELECT TO catalog_function_owner
  USING (key = 'catalog.gleif_connector_enabled');
CREATE POLICY catalog_function_owner_catalog_flags_update
  ON public.feature_flags FOR UPDATE TO catalog_function_owner
  USING (key IN ('catalog.phase1_ingestion','catalog.gleif_connector_enabled'))
  WITH CHECK (key IN ('catalog.phase1_ingestion','catalog.gleif_connector_enabled'));

GRANT UPDATE (is_enabled,updated_at) ON public.feature_flags TO catalog_function_owner;

-- Authenticated Catalog operations remain RLS-bound. These grants are limited
-- to the columns used by the Staff/Super Admin RPCs below so those RPCs can run
-- as SECURITY INVOKER without introducing additional Advisor exceptions.
GRANT UPDATE (assigned_to,assigned_at,status,reviewer_id,decision,review_notes,decided_at,returned_at,return_reason)
  ON public.directory_review_queue TO authenticated;
GRANT UPDATE (state,terminal_reason,review_flags)
  ON public.directory_import_candidates TO authenticated;
GRANT UPDATE (state) ON public.directory_candidate_facts TO authenticated;
GRANT INSERT (
  candidate_id,evidence_id,source_id,fact_key,normalized_value,original_value,
  source_field,transformation,confidence,confidence_reason,authority_level,
  observed_at,reviewer_edit_state,reviewer_id,provenance_url,reviewer_attestation
) ON public.directory_candidate_facts TO authenticated;
GRANT UPDATE (
  connector_enabled,page_size,max_pages_per_run,responsible_staff_id,
  lifecycle_state,activated_at,suspended_at,suspension_reason
) ON public.directory_sources TO authenticated;
GRANT UPDATE (is_enabled,updated_at) ON public.feature_flags TO authenticated;
GRANT UPDATE (retry_state,retry_count,last_retry_at)
  ON public.directory_dead_letters TO authenticated;
GRANT UPDATE (
  source_payload,payload_captured_at,retention_state,payload_deleted_at,
  payload_deletion_reason
) ON public.directory_raw_evidence TO authenticated;

CREATE POLICY directory_review_queue_assigned_reviewer_update
  ON public.directory_review_queue FOR UPDATE TO authenticated
  USING (
    public.current_user_role()='super_admin'
    OR (public.current_user_role()='staff' AND assigned_to=auth.uid())
    OR (public.current_user_role() IN ('staff','super_admin') AND assigned_to IS NULL)
  )
  WITH CHECK (
    public.current_user_role()='super_admin'
    OR (public.current_user_role()='staff' AND assigned_to=auth.uid())
  );

CREATE POLICY directory_import_candidates_assigned_reviewer_update
  ON public.directory_import_candidates FOR UPDATE TO authenticated
  USING (
    public.current_user_role()='super_admin'
    OR (
      public.current_user_role()='staff'
      AND EXISTS (
        SELECT 1 FROM public.directory_review_queue queue
        WHERE queue.candidate_id=directory_import_candidates.id
          AND queue.assigned_to=auth.uid()
      )
    )
  )
  WITH CHECK (
    public.current_user_role()='super_admin'
    OR (
      public.current_user_role()='staff'
      AND EXISTS (
        SELECT 1 FROM public.directory_review_queue queue
        WHERE queue.candidate_id=directory_import_candidates.id
          AND queue.assigned_to=auth.uid()
      )
    )
  );

CREATE POLICY directory_candidate_facts_assigned_reviewer_insert
  ON public.directory_candidate_facts FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role()='super_admin'
    OR (
      public.current_user_role()='staff'
      AND EXISTS (
        SELECT 1 FROM public.directory_review_queue queue
        WHERE queue.candidate_id=directory_candidate_facts.candidate_id
          AND queue.assigned_to=auth.uid()
      )
    )
  );
CREATE POLICY directory_candidate_facts_assigned_reviewer_update
  ON public.directory_candidate_facts FOR UPDATE TO authenticated
  USING (
    public.current_user_role()='super_admin'
    OR (
      public.current_user_role()='staff'
      AND EXISTS (
        SELECT 1 FROM public.directory_review_queue queue
        WHERE queue.candidate_id=directory_candidate_facts.candidate_id
          AND queue.assigned_to=auth.uid()
      )
    )
  )
  WITH CHECK (
    public.current_user_role()='super_admin'
    OR (
      public.current_user_role()='staff'
      AND EXISTS (
        SELECT 1 FROM public.directory_review_queue queue
        WHERE queue.candidate_id=directory_candidate_facts.candidate_id
          AND queue.assigned_to=auth.uid()
      )
    )
  );

CREATE POLICY directory_sources_super_admin_update
  ON public.directory_sources FOR UPDATE TO authenticated
  USING (public.current_user_role()='super_admin')
  WITH CHECK (public.current_user_role()='super_admin');
CREATE POLICY catalog_flags_super_admin_update
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (
    public.current_user_role()='super_admin'
    AND key IN ('catalog.phase1_ingestion','catalog.gleif_connector_enabled')
  )
  WITH CHECK (
    public.current_user_role()='super_admin'
    AND key IN ('catalog.phase1_ingestion','catalog.gleif_connector_enabled')
  );
CREATE POLICY directory_dead_letters_super_admin_update
  ON public.directory_dead_letters FOR UPDATE TO authenticated
  USING (public.current_user_role()='super_admin')
  WITH CHECK (public.current_user_role()='super_admin');
CREATE POLICY directory_raw_evidence_super_admin_retention_update
  ON public.directory_raw_evidence FOR UPDATE TO authenticated
  USING (public.current_user_role()='super_admin')
  WITH CHECK (public.current_user_role()='super_admin');

-- The Foundations constraint allowed five publishable facts. The connector
-- records the complete source-supported review contract while publication still
-- reads only the original five allowlisted facts.
ALTER TABLE public.directory_sources
  DROP CONSTRAINT directory_sources_permitted_fields_chk;
ALTER TABLE public.directory_sources
  ADD CONSTRAINT directory_sources_permitted_fields_chk CHECK (
    permitted_fields <@ ARRAY[
      'lei', 'legal_name', 'legal_name_language', 'other_names', 'transliterated_names',
      'address_country', 'address_region', 'city', 'address_raw', 'entity_status',
      'registration_status', 'registration_identifier', 'registration_authority',
      'legal_form', 'entity_creation_date', 'jurisdiction', 'parent_leis',
      'name_ar', 'official_domains'
    ]::text[] AND cardinality(permitted_fields) <= 19
  );

INSERT INTO public.directory_sources (
  source_key, display_name, qualification_state, lifecycle_state,
  licence_reference, reference_url, permitted_fields, parser_name,
  parser_version, health_state, connector_enabled, connector_kind,
  api_base_url, page_size, max_pages_per_run
)
VALUES (
  'gleif.lei-records-v1', 'GLEIF LEI Records API', 'qualified', 'inactive',
  'GLEIF API Terms of Use and LEI data licence',
  'https://www.gleif.org/en/lei-data/gleif-api',
  ARRAY[
    'lei', 'legal_name', 'legal_name_language', 'other_names', 'transliterated_names',
    'address_country', 'address_region', 'city', 'address_raw', 'entity_status',
    'registration_status', 'registration_identifier', 'registration_authority',
    'legal_form', 'entity_creation_date', 'jurisdiction', 'parent_leis',
    'name_ar', 'official_domains'
  ],
  'gleif-lei-records', '1.0.0', 'unknown', false, 'gleif',
  'https://api.gleif.org/api/v1/lei-records', 100, 2
)
ON CONFLICT (source_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  licence_reference = EXCLUDED.licence_reference,
  reference_url = EXCLUDED.reference_url,
  permitted_fields = EXCLUDED.permitted_fields,
  parser_name = EXCLUDED.parser_name,
  parser_version = EXCLUDED.parser_version,
  connector_kind = EXCLUDED.connector_kind,
  api_base_url = EXCLUDED.api_base_url,
  updated_at = now();

-- The Foundations migration immediately revoked the ownership-transfer
-- handshake. Re-open it only for this bounded replacement/new-function set.
GRANT catalog_function_owner TO postgres;
GRANT CREATE ON SCHEMA public TO catalog_function_owner;
SET ROLE catalog_function_owner;

CREATE OR REPLACE FUNCTION public._catalog_guard_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW)->>'created_at') IS DISTINCT FROM (to_jsonb(OLD)->>'created_at') THEN
      RAISE EXCEPTION 'catalog_created_at_immutable';
    END IF;
    IF TG_TABLE_NAME = 'directory_raw_evidence'
       AND (to_jsonb(OLD)->'source_payload') IS NOT NULL
       AND (to_jsonb(OLD)->'source_payload') <> 'null'::jsonb
       AND (to_jsonb(NEW)->'source_payload') IS DISTINCT FROM (to_jsonb(OLD)->'source_payload') THEN
      IF NOT (
        to_jsonb(NEW)->>'retention_state' = 'payload_deleted'
        AND (to_jsonb(NEW)->'source_payload') = 'null'::jsonb
        AND NULLIF(to_jsonb(NEW)->>'payload_deletion_reason','') IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'catalog_evidence_payload_immutable';
      END IF;
    END IF;
    IF TG_TABLE_NAME = 'directory_import_candidates'
       AND (to_jsonb(NEW)->>'state') IS DISTINCT FROM (to_jsonb(OLD)->>'state')
       AND NOT (
         (to_jsonb(OLD)->>'state' = 'received' AND to_jsonb(NEW)->>'state' IN ('needs_review','conflict','quarantined','rejected'))
         OR (to_jsonb(OLD)->>'state' = 'needs_review' AND to_jsonb(NEW)->>'state' IN ('approved_pending_domain','approved','conflict','quarantined','rejected','superseded'))
         OR (to_jsonb(OLD)->>'state' = 'approved_pending_domain' AND to_jsonb(NEW)->>'state' IN ('approved','needs_review','rejected','superseded'))
         OR (to_jsonb(OLD)->>'state' = 'approved' AND to_jsonb(NEW)->>'state' IN ('published','needs_review','rejected','superseded'))
         OR (to_jsonb(OLD)->>'state' = 'quarantined' AND to_jsonb(NEW)->>'state' = 'needs_review')
       ) THEN
      RAISE EXCEPTION 'catalog_candidate_transition_denied:%->%', to_jsonb(OLD)->>'state', to_jsonb(NEW)->>'state';
    ELSIF TG_TABLE_NAME = 'directory_review_queue'
       AND (to_jsonb(NEW)->>'status') IS DISTINCT FROM (to_jsonb(OLD)->>'status')
       AND NOT (
         (to_jsonb(OLD)->>'status' = 'pending' AND to_jsonb(NEW)->>'status' IN ('in_review','approved_pending_domain','approved','rejected','quarantined'))
         OR (to_jsonb(OLD)->>'status' = 'in_review' AND to_jsonb(NEW)->>'status' IN ('pending','approved_pending_domain','approved','rejected','returned','quarantined'))
         OR (to_jsonb(OLD)->>'status' IN ('approved_pending_domain','approved') AND to_jsonb(NEW)->>'status' IN ('approved','returned','published'))
         OR (to_jsonb(OLD)->>'status' = 'returned' AND to_jsonb(NEW)->>'status' IN ('pending','in_review'))
         OR (to_jsonb(OLD)->>'status' = 'quarantined' AND to_jsonb(NEW)->>'status' = 'pending')
       ) THEN
      RAISE EXCEPTION 'catalog_review_transition_denied:%->%', to_jsonb(OLD)->>'status', to_jsonb(NEW)->>'status';
    ELSIF TG_TABLE_NAME = 'directory_sync_runs'
       AND (to_jsonb(NEW)->>'status') IS DISTINCT FROM (to_jsonb(OLD)->>'status')
       AND NOT (
         (to_jsonb(OLD)->>'status' IN ('created','queued') AND to_jsonb(NEW)->>'status' IN ('running','intaking','skipped','cancelled'))
         OR (to_jsonb(OLD)->>'status' IN ('running','intaking') AND to_jsonb(NEW)->>'status' IN ('succeeded','succeeded_partial','completed','failed','failed_partial','cancelled'))
       ) THEN
      RAISE EXCEPTION 'catalog_run_transition_denied:%->%', to_jsonb(OLD)->>'status', to_jsonb(NEW)->>'status';
    ELSIF TG_TABLE_NAME = 'directory_dead_letters'
       AND (to_jsonb(NEW)->>'retry_state') IS DISTINCT FROM (to_jsonb(OLD)->>'retry_state')
       AND NOT (
         (to_jsonb(OLD)->>'retry_state' IN ('pending','not_retryable') AND to_jsonb(NEW)->>'retry_state' IN ('in_progress','exhausted'))
         OR (to_jsonb(OLD)->>'retry_state' = 'in_progress' AND to_jsonb(NEW)->>'retry_state' IN ('succeeded','pending','exhausted'))
       ) THEN
      RAISE EXCEPTION 'catalog_retry_transition_denied:%->%', to_jsonb(OLD)->>'retry_state', to_jsonb(NEW)->>'retry_state';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$function$;

RESET ROLE;

CREATE FUNCTION public.catalog_capture_gleif_facts(p_candidate_id uuid, p_facts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_candidate public.directory_import_candidates%ROWTYPE;
  v_key text;
  v_fact jsonb;
  v_allowed constant text[] := ARRAY[
    'lei','legal_name_language','other_names','transliterated_names','address_country',
    'address_region','address_raw','entity_status','registration_status',
    'registration_identifier','registration_authority','legal_form','jurisdiction','parent_leis'
  ];
BEGIN
  IF jsonb_typeof(p_facts)<>'object' OR pg_column_size(p_facts)>32768 THEN
    RETURN jsonb_build_object('ok',false,'code','extended_facts_invalid');
  END IF;
  SELECT * INTO v_candidate FROM public.directory_import_candidates WHERE id=p_candidate_id FOR UPDATE;
  IF NOT FOUND OR v_candidate.state NOT IN ('needs_review','quarantined') THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_editable');
  END IF;
  FOR v_key,v_fact IN SELECT key,value FROM jsonb_each(p_facts) LOOP
    IF NOT (v_key=ANY(v_allowed)) OR jsonb_typeof(v_fact)<>'object' THEN
      RETURN jsonb_build_object('ok',false,'code','extended_fact_not_allowed');
    END IF;
    INSERT INTO public.directory_candidate_facts(
      candidate_id,evidence_id,source_id,fact_key,normalized_value,original_value,
      source_field,transformation,confidence,confidence_reason,authority_level,
      observed_at,effective_at,reviewer_edit_state
    ) VALUES (
      v_candidate.id,v_candidate.evidence_id,v_candidate.source_id,v_key,
      v_fact->'normalized_value',v_fact->'original_value',left(v_fact->>'source_field',160),
      COALESCE(NULLIF(left(v_fact->>'transformation',160),''),'none'),
      COALESCE(NULLIF(v_fact->>'confidence',''),'high'),
      left(COALESCE(NULLIF(v_fact->>'confidence_reason',''),'GLEIF authoritative registry data'),500),
      COALESCE(NULLIF(v_fact->>'authority_level',''),'authoritative'),
      COALESCE(NULLIF(v_fact->>'observed_at','')::timestamptz,now()),
      NULLIF(v_fact->>'effective_at','')::timestamptz,'proposed'
    );
  END LOOP;
  RETURN jsonb_build_object(
    'ok',true,
    'fact_count',(SELECT count(*) FROM jsonb_object_keys(p_facts))
  );
END
$function$;

CREATE FUNCTION public.catalog_begin_gleif_run(
  p_external_run_id text,
  p_mode text DEFAULT 'incremental',
  p_worker_identity text DEFAULT 'catalog_worker_gleif'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_source public.directory_sources%ROWTYPE;
  v_run_id uuid;
BEGIN
  SELECT * INTO v_source FROM public.directory_sources
  WHERE source_key = 'gleif.lei-records-v1' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'source_missing'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key='catalog.phase1_ingestion' AND is_enabled)
     OR NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key='catalog.gleif_connector_enabled' AND is_enabled)
     OR NOT v_source.connector_enabled OR v_source.lifecycle_state <> 'active' THEN
    PERFORM public._write_audit_log(NULL, 'catalog.sync_run_skipped', 'directory_sources', v_source.id,
      NULL, NULL, jsonb_build_object('reason','disabled','external_run_id',left(p_external_run_id,100)));
    RETURN jsonb_build_object('ok', false, 'code', 'disabled');
  END IF;
  BEGIN
    INSERT INTO public.directory_sync_runs(
      source_id, worker_identity, mode, parser_version, status, external_run_id, heartbeat_at
    ) VALUES (
      v_source.id, left(p_worker_identity,160), p_mode, v_source.parser_version,
      'intaking', left(p_external_run_id,160), now()
    ) RETURNING id INTO v_run_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'code', 'already_running');
  END;
  PERFORM public._write_audit_log(NULL, 'catalog.sync_run_started', 'directory_sync_runs', v_run_id,
    NULL, jsonb_build_object('status','intaking'), jsonb_build_object('external_run_id',p_external_run_id));
  RETURN jsonb_build_object(
    'ok', true, 'run_id', v_run_id, 'page_size', v_source.page_size,
    'max_pages', v_source.max_pages_per_run, 'api_base_url', v_source.api_base_url
  );
END
$function$;

CREATE FUNCTION public.catalog_capture_gleif_metadata(
  p_candidate_id uuid,
  p_lei text,
  p_registration_identifier text,
  p_registration_authority text,
  p_match_outcome text,
  p_match_reasons jsonb,
  p_review_flags text[],
  p_entity_status text,
  p_registration_status text,
  p_source_payload jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE v_evidence_id uuid;
  v_target uuid;
  v_legal_name text;
  v_city text;
  v_resolved_outcome text := p_match_outcome;
BEGIN
  SELECT published_directory_id INTO v_target
  FROM public.directory_import_candidates
  WHERE lei=p_lei AND state='published' AND published_directory_id IS NOT NULL
  ORDER BY published_at DESC LIMIT 1;
  IF v_target IS NULL AND NULLIF(p_registration_identifier,'') IS NOT NULL THEN
    SELECT published_directory_id INTO v_target
    FROM public.directory_import_candidates
    WHERE registration_identifier=p_registration_identifier
      AND registration_authority IS NOT DISTINCT FROM p_registration_authority
      AND state='published' AND published_directory_id IS NOT NULL
    ORDER BY published_at DESC LIMIT 1;
  END IF;
  IF v_target IS NOT NULL THEN
    v_resolved_outcome := 'update_existing';
  ELSE
    SELECT normalized_value #>> '{}' INTO v_legal_name
    FROM public.directory_candidate_facts
    WHERE candidate_id=p_candidate_id AND fact_key='legal_name' AND state='active';
    SELECT normalized_value #>> '{}' INTO v_city
    FROM public.directory_candidate_facts
    WHERE candidate_id=p_candidate_id AND fact_key='city' AND state='active';
    IF EXISTS (
      SELECT 1 FROM public.companies
      WHERE lower(regexp_replace(name,'[^[:alnum:]]','','g')) = lower(regexp_replace(v_legal_name,'[^[:alnum:]]','','g'))
        AND (city IS NULL OR v_city IS NULL OR lower(city)=lower(v_city))
    ) THEN
      v_resolved_outcome := 'ambiguous';
      p_review_flags := array_append(array_remove(COALESCE(p_review_flags,'{}'),'ambiguous_match'),'ambiguous_match');
    END IF;
  END IF;
  UPDATE public.directory_import_candidates SET
    lei=p_lei, registration_identifier=p_registration_identifier,
    registration_authority=p_registration_authority, match_outcome=v_resolved_outcome,
    match_reasons=COALESCE(p_match_reasons,'[]'), review_flags=COALESCE(p_review_flags,'{}'),
    source_entity_status=p_entity_status, source_registration_status=p_registration_status,
    deterministic_match_target=v_target,
    state=CASE WHEN p_entity_status='INACTIVE' OR p_registration_status IN ('RETIRED','MERGED') THEN 'quarantined' ELSE state END,
    terminal_reason=CASE WHEN p_entity_status='INACTIVE' OR p_registration_status IN ('RETIRED','MERGED') THEN 'source status requires Phase-1 quarantine' ELSE terminal_reason END
  WHERE id=p_candidate_id AND lei IS NULL
  RETURNING evidence_id INTO v_evidence_id;
  IF v_evidence_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','candidate_missing_or_locked'); END IF;
  UPDATE public.directory_raw_evidence SET source_payload=p_source_payload, payload_captured_at=now()
  WHERE id=v_evidence_id AND source_payload IS NULL;
  IF p_entity_status='INACTIVE' OR p_registration_status IN ('RETIRED','MERGED') THEN
    UPDATE public.directory_review_queue SET status='quarantined' WHERE candidate_id=p_candidate_id;
  END IF;
  PERFORM public._write_audit_log(NULL,'catalog.evidence_captured','directory_raw_evidence',v_evidence_id,
    NULL,NULL,jsonb_build_object('candidate_id',p_candidate_id,'lei',p_lei));
  RETURN jsonb_build_object('ok',true,'evidence_id',v_evidence_id);
END
$function$;

CREATE FUNCTION public.catalog_finish_gleif_run(
  p_run_id uuid,
  p_status text,
  p_retrieved_count integer,
  p_skipped_count integer,
  p_page_count integer,
  p_retry_count integer,
  p_checkpoint jsonb DEFAULT '{}',
  p_failure_class text DEFAULT NULL,
  p_failure_detail text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE v_source_id uuid;
BEGIN
  IF p_status NOT IN ('succeeded','succeeded_partial','failed','failed_partial') THEN
    RETURN jsonb_build_object('ok',false,'code','invalid_status');
  END IF;
  UPDATE public.directory_sync_runs SET
    status=p_status, retrieved_count=GREATEST(p_retrieved_count,0),
    skipped_count=GREATEST(p_skipped_count,0), page_count=GREATEST(p_page_count,0),
    retry_count=GREATEST(p_retry_count,0), checkpoint=COALESCE(p_checkpoint,'{}'),
    failure_class=left(p_failure_class,80), failure_detail=left(p_failure_detail,500),
    completed_at=now(), heartbeat_at=now()
  WHERE id=p_run_id AND status IN ('running','intaking') RETURNING source_id INTO v_source_id;
  IF v_source_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','run_not_active'); END IF;
  UPDATE public.directory_sources SET
    last_successful_sync=CASE WHEN p_status IN ('succeeded','succeeded_partial') THEN now() ELSE last_successful_sync END,
    consecutive_failure_count=CASE WHEN p_status IN ('succeeded','succeeded_partial') THEN 0 ELSE consecutive_failure_count+1 END,
    health_state=CASE WHEN p_status='succeeded' THEN 'healthy' WHEN p_status='succeeded_partial' THEN 'degraded' ELSE 'unhealthy' END
  WHERE id=v_source_id;
  UPDATE public.directory_sources SET lifecycle_state='suspended', connector_enabled=false,
    suspended_at=now(), suspension_reason='automatic suspension after 3 consecutive failed runs'
  WHERE id=v_source_id AND consecutive_failure_count>=3;
  PERFORM public._write_audit_log(NULL,'catalog.sync_run_completed','directory_sync_runs',p_run_id,
    NULL,jsonb_build_object('status',p_status),jsonb_build_object('retrieved_count',p_retrieved_count,'page_count',p_page_count));
  RETURN jsonb_build_object('ok',true,'run_id',p_run_id);
END
$function$;

CREATE FUNCTION public.claim_directory_candidate(p_review_queue_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_role public.user_role_enum;
  v_assigned uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'catalog_authentication_required'; END IF;
  v_role := public.current_user_role();
  IF v_role NOT IN ('staff','super_admin') THEN RETURN jsonb_build_object('ok',false,'code','catalog_review_forbidden'); END IF;
  SELECT assigned_to INTO v_assigned
  FROM public.directory_review_queue
  WHERE id=p_review_queue_id AND status IN ('pending','in_review','returned');
  IF v_assigned IS NOT NULL AND v_assigned<>v_actor AND v_role<>'super_admin' THEN
    RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',true);
  END IF;
  UPDATE public.directory_review_queue SET
    assigned_to=COALESCE(assigned_to,v_actor), assigned_at=COALESCE(assigned_at,now()),
    status=CASE WHEN status IN ('pending','returned') THEN 'in_review' ELSE status END
  WHERE id=p_review_queue_id AND status IN ('pending','in_review','returned')
  RETURNING assigned_to INTO v_assigned;
  IF v_assigned IS NULL THEN RETURN jsonb_build_object('ok',false,'code','queue_item_not_claimable'); END IF;
  RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',v_assigned<>v_actor);
END
$function$;

CREATE FUNCTION public.review_directory_candidate(
  p_review_queue_id uuid,
  p_action text,
  p_notes text,
  p_domain text DEFAULT NULL,
  p_evidence_url text DEFAULT NULL,
  p_name_ar text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_role public.user_role_enum;
  v_queue public.directory_review_queue%ROWTYPE;
  v_candidate public.directory_import_candidates%ROWTYPE;
  v_domain text;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'catalog_authentication_required'; END IF;
  v_role := public.current_user_role();
  IF v_role NOT IN ('staff','super_admin') THEN RETURN jsonb_build_object('ok',false,'code','catalog_review_forbidden'); END IF;
  IF NULLIF(btrim(p_notes),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'code','review_notes_required'); END IF;
  SELECT * INTO v_queue FROM public.directory_review_queue WHERE id=p_review_queue_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','queue_item_not_found'); END IF;
  IF v_queue.assigned_to IS DISTINCT FROM v_actor AND v_role <> 'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','assigned_reviewer_required');
  END IF;
  SELECT * INTO v_candidate FROM public.directory_import_candidates WHERE id=v_queue.candidate_id FOR UPDATE;

  IF p_action='validate_domain' THEN
    v_domain := lower(btrim(p_domain));
    IF v_domain IS NULL OR v_domain IN ('example.com','localhost') OR v_domain LIKE '%.local'
       OR v_domain ~ '^[0-9.]+$'
       OR v_domain !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
       OR p_evidence_url !~ '^https://' THEN
      RETURN jsonb_build_object('ok',false,'code','domain_evidence_invalid');
    END IF;
    IF EXISTS (SELECT 1 FROM public.companies WHERE id IS DISTINCT FROM v_candidate.deterministic_match_target AND domains @> ARRAY[v_domain]) THEN
      UPDATE public.directory_import_candidates SET review_flags=array_append(array_remove(review_flags,'domain_conflict'),'domain_conflict') WHERE id=v_candidate.id;
      RETURN jsonb_build_object('ok',false,'code','domain_conflict');
    END IF;
    UPDATE public.directory_candidate_facts SET state='superseded'
      WHERE candidate_id=v_candidate.id AND fact_key='official_domains' AND state='active';
    INSERT INTO public.directory_candidate_facts(
      candidate_id,evidence_id,source_id,fact_key,normalized_value,original_value,
      source_field,transformation,confidence,confidence_reason,authority_level,
      observed_at,reviewer_edit_state,reviewer_id,provenance_url,reviewer_attestation
    ) VALUES (
      v_candidate.id,v_candidate.evidence_id,v_candidate.source_id,'official_domains',to_jsonb(ARRAY[v_domain]),to_jsonb(v_domain),
      'staff_domain_evidence','manual_validation','high','Staff confirmed acceptable official-domain evidence',
      'staff_reviewed',now(),'accepted',v_actor,p_evidence_url,p_notes
    );
    UPDATE public.directory_import_candidates SET review_flags=array_remove(review_flags,'no_domain') WHERE id=v_candidate.id;
    IF v_candidate.state='approved_pending_domain' THEN
      UPDATE public.directory_import_candidates SET state='approved' WHERE id=v_candidate.id;
      UPDATE public.directory_review_queue SET status='approved',decision='approve',reviewer_id=v_actor,
        review_notes=p_notes,decided_at=now() WHERE id=v_queue.id;
    END IF;
    RETURN jsonb_build_object('ok',true,'code','domain_validated');
  END IF;

  IF p_name_ar IS NOT NULL THEN
    UPDATE public.directory_candidate_facts SET state='superseded'
      WHERE candidate_id=v_candidate.id AND fact_key='name_ar' AND state='active';
    INSERT INTO public.directory_candidate_facts(
      candidate_id,evidence_id,source_id,fact_key,normalized_value,original_value,
      source_field,transformation,confidence,confidence_reason,authority_level,
      observed_at,reviewer_edit_state,reviewer_id,provenance_url,reviewer_attestation
    ) VALUES (
      v_candidate.id,v_candidate.evidence_id,v_candidate.source_id,'name_ar',to_jsonb(btrim(p_name_ar)),to_jsonb(btrim(p_name_ar)),
      'staff_cited_arabic_name','manual_evidence_selection','high','Staff confirmed cited Arabic-script evidence',
      'staff_reviewed',now(),'accepted',v_actor,p_evidence_url,p_notes
    );
  END IF;

  IF p_action='approve' THEN
    IF v_candidate.match_outcome IN ('ambiguous','duplicate_candidate','quarantined') OR v_candidate.state='quarantined'
       OR v_candidate.review_flags && ARRAY['domain_conflict','personal_data_review','inactive_entity','ambiguous_match']::text[] THEN
      RETURN jsonb_build_object('ok',false,'code','blocking_review_flag');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.directory_candidate_facts WHERE candidate_id=v_candidate.id AND fact_key='official_domains' AND state='active' AND reviewer_edit_state='accepted') THEN
      RETURN jsonb_build_object('ok',false,'code','validated_domain_required');
    END IF;
    UPDATE public.directory_import_candidates SET state='approved',terminal_reason=NULL WHERE id=v_candidate.id;
    UPDATE public.directory_review_queue SET status='approved',reviewer_id=v_actor,decision='approve',review_notes=p_notes,decided_at=now() WHERE id=v_queue.id;
  ELSIF p_action='approve_pending_domain' THEN
    UPDATE public.directory_import_candidates SET state='approved_pending_domain',review_flags=array_append(array_remove(review_flags,'no_domain'),'no_domain'),terminal_reason=NULL WHERE id=v_candidate.id;
    UPDATE public.directory_review_queue SET status='approved_pending_domain',reviewer_id=v_actor,decision='approve_pending_domain',review_notes=p_notes,decided_at=now() WHERE id=v_queue.id;
  ELSIF p_action='reject' THEN
    UPDATE public.directory_import_candidates SET state='rejected',terminal_reason=p_notes WHERE id=v_candidate.id;
    UPDATE public.directory_review_queue SET status='rejected',reviewer_id=v_actor,decision='reject',review_notes=p_notes,decided_at=now() WHERE id=v_queue.id;
  ELSIF p_action='return' THEN
    UPDATE public.directory_import_candidates SET state='needs_review',terminal_reason=NULL WHERE id=v_candidate.id;
    UPDATE public.directory_review_queue SET status='returned',reviewer_id=v_actor,decision='return',review_notes=p_notes,decided_at=now(),returned_at=now(),return_reason=p_notes WHERE id=v_queue.id;
  ELSE
    RETURN jsonb_build_object('ok',false,'code','invalid_review_action');
  END IF;
  RETURN jsonb_build_object('ok',true,'code',p_action);
END
$function$;

CREATE FUNCTION public.configure_catalog_gleif(
  p_ingestion_enabled boolean,
  p_connector_enabled boolean,
  p_page_size smallint DEFAULT 100,
  p_max_pages smallint DEFAULT 2
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF p_page_size NOT BETWEEN 1 AND 200 OR p_max_pages NOT BETWEEN 1 AND 20 THEN
    RETURN jsonb_build_object('ok',false,'code','run_budget_invalid');
  END IF;
  UPDATE public.feature_flags SET is_enabled=p_ingestion_enabled,updated_at=now()
  WHERE key='catalog.phase1_ingestion';
  UPDATE public.feature_flags SET is_enabled=p_connector_enabled,updated_at=now()
  WHERE key='catalog.gleif_connector_enabled';
  UPDATE public.directory_sources SET
    connector_enabled=p_connector_enabled,page_size=p_page_size,max_pages_per_run=p_max_pages,
    responsible_staff_id=COALESCE(responsible_staff_id,v_actor),
    lifecycle_state=CASE WHEN p_connector_enabled THEN 'active' ELSE lifecycle_state END,
    activated_at=CASE WHEN p_connector_enabled THEN COALESCE(activated_at,now()) ELSE activated_at END,
    suspended_at=CASE WHEN p_connector_enabled THEN NULL ELSE suspended_at END,
    suspension_reason=CASE WHEN p_connector_enabled THEN NULL ELSE suspension_reason END
  WHERE source_key='gleif.lei-records-v1';
  RETURN jsonb_build_object('ok',true,'code','configured');
END
$function$;

CREATE FUNCTION public.redrive_catalog_dead_letter(p_dead_letter_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_count smallint;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  UPDATE public.directory_dead_letters SET
    retry_state=CASE WHEN retry_count>=2 THEN 'exhausted' ELSE 'in_progress' END,
    retry_count=LEAST(retry_count+1,3),last_retry_at=now()
  WHERE id=p_dead_letter_id AND retry_state IN ('pending','not_retryable')
  RETURNING retry_count INTO v_count;
  IF v_count IS NULL THEN RETURN jsonb_build_object('ok',false,'code','dead_letter_not_redrivable'); END IF;
  RETURN jsonb_build_object('ok',true,'code',CASE WHEN v_count>=3 THEN 'exhausted' ELSE 'redrive_queued' END);
END
$function$;

CREATE FUNCTION public.execute_catalog_retention()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_count integer;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  WITH eligible AS (
    SELECT evidence.id FROM public.directory_raw_evidence evidence
    WHERE evidence.source_payload IS NOT NULL
      AND NOT evidence.legal_hold AND NOT evidence.audit_investigation
      AND evidence.retention_state IN ('active','superseded','quarantined')
      AND (
        evidence.deletion_eligible_at<=now()
        OR (
          evidence.created_at<=now()-interval '180 days'
          AND EXISTS (
            SELECT 1 FROM public.directory_raw_evidence newer
            WHERE newer.source_id=evidence.source_id
              AND newer.source_record_key=evidence.source_record_key
              AND newer.created_at>evidence.created_at
              AND newer.checksum_sha256<>evidence.checksum_sha256
          )
        )
      )
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.directory_raw_evidence evidence SET
    source_payload=NULL,payload_captured_at=NULL,retention_state='payload_deleted',
    payload_deleted_at=now(),payload_deletion_reason='Catalog Phase 1 retention policy'
  FROM eligible WHERE evidence.id=eligible.id;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'code','retention_executed','payloads_deleted',v_count);
END
$function$;

REVOKE ALL ON FUNCTION public.catalog_begin_gleif_run(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.catalog_capture_gleif_metadata(uuid,text,text,text,text,jsonb,text[],text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.catalog_capture_gleif_facts(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.catalog_finish_gleif_run(uuid,text,integer,integer,integer,integer,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.catalog_begin_gleif_run(text,text,text) TO catalog_worker;
GRANT EXECUTE ON FUNCTION public.catalog_capture_gleif_metadata(uuid,text,text,text,text,jsonb,text[],text,text,jsonb) TO catalog_worker;
GRANT EXECUTE ON FUNCTION public.catalog_capture_gleif_facts(uuid,jsonb) TO catalog_worker;
GRANT EXECUTE ON FUNCTION public.catalog_finish_gleif_run(uuid,text,integer,integer,integer,integer,jsonb,text,text) TO catalog_worker;

REVOKE ALL ON FUNCTION public.claim_directory_candidate(uuid) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.review_directory_candidate(uuid,text,text,text,text,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.configure_catalog_gleif(boolean,boolean,smallint,smallint) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.redrive_catalog_dead_letter(uuid) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.execute_catalog_retention() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.claim_directory_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_directory_candidate(uuid,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.configure_catalog_gleif(boolean,boolean,smallint,smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redrive_catalog_dead_letter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_catalog_retention() TO authenticated;

ALTER FUNCTION public.catalog_begin_gleif_run(text,text,text) OWNER TO catalog_function_owner;
ALTER FUNCTION public.catalog_capture_gleif_metadata(uuid,text,text,text,text,jsonb,text[],text,text,jsonb) OWNER TO catalog_function_owner;
ALTER FUNCTION public.catalog_capture_gleif_facts(uuid,jsonb) OWNER TO catalog_function_owner;
ALTER FUNCTION public.catalog_finish_gleif_run(uuid,text,integer,integer,integer,integer,jsonb,text,text) OWNER TO catalog_function_owner;
ALTER FUNCTION public.claim_directory_candidate(uuid) OWNER TO catalog_function_owner;
ALTER FUNCTION public.review_directory_candidate(uuid,text,text,text,text,text) OWNER TO catalog_function_owner;
ALTER FUNCTION public.configure_catalog_gleif(boolean,boolean,smallint,smallint) OWNER TO catalog_function_owner;
ALTER FUNCTION public.redrive_catalog_dead_letter(uuid) OWNER TO catalog_function_owner;
ALTER FUNCTION public.execute_catalog_retention() OWNER TO catalog_function_owner;
REVOKE CREATE ON SCHEMA public FROM catalog_function_owner;
REVOKE catalog_function_owner FROM postgres;

NOTIFY pgrst, 'reload schema';
;
