-- Forward-only Lammah source-host allowlist for official non-EU sources.
-- Does not mutate inventory, Profiles, Verification, Directory rows, or grants.
-- Does not apply itself to remote nonproduction; it is reviewed with the import manifest.

BEGIN;

ALTER TABLE public.lammah_sources
  ADD COLUMN IF NOT EXISTS allowed_source_hosts text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.lammah_sources.allowed_source_hosts IS
  'Hosts permitted for source_page_url evidence. Empty means unresolved; ingest must not treat an empty list as allow-all.';

UPDATE public.lammah_sources
SET allowed_source_hosts = ARRAY['europa.eu']
WHERE source_key = 'eu_careers_cast'
  AND cardinality(allowed_source_hosts) = 0;

GRANT lammah_function_owner TO postgres;
GRANT CREATE ON SCHEMA public TO lammah_function_owner;
SET ROLE lammah_function_owner;

CREATE OR REPLACE FUNCTION public.lammah_resolved_source_hosts(p_source public.lammah_sources)
RETURNS text[]
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog, public
AS $function$
  SELECT CASE
    WHEN cardinality(COALESCE(p_source.allowed_source_hosts, '{}'::text[])) > 0
      THEN p_source.allowed_source_hosts
    ELSE ARRAY['europa.eu']::text[]
  END
$function$;

COMMENT ON FUNCTION public.lammah_resolved_source_hosts(public.lammah_sources) IS
  'Per-source replacement for the europa.eu source_page_url hardcode in ingest_lammah_candidate. Empty allowed_source_hosts falls back to the existing EU Careers host so the current qualified source keeps working. Saudi official sources must set allowed_source_hosts before ingest. This function does not auto-publish and does not create Directory or Profile rows.';

CREATE OR REPLACE FUNCTION public.ingest_lammah_candidate(p_run_id uuid, p_record jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_run public.lammah_sync_runs%ROWTYPE;
  v_source public.lammah_sources%ROWTYPE;
  v_record_id text := NULLIF(btrim(p_record->>'source_record_id'),'');
  v_checksum text := lower(NULLIF(btrim(p_record->>'checksum_sha256'),''));
  v_source_url text := NULLIF(btrim(p_record->>'source_page_url'),'');
  v_apply_url text := NULLIF(btrim(p_record->>'apply_url'),'');
  v_final_url text := NULLIF(btrim(p_record->>'final_apply_url'),'');
  v_title_original text := NULLIF(btrim(p_record->>'title_original'),'');
  v_title_ar text := NULLIF(btrim(p_record->>'title_ar'),'');
  v_title_en text := NULLIF(btrim(p_record->>'title_en'),'');
  v_organization text := NULLIF(btrim(p_record->>'organization_raw_name'),'');
  v_type public.lammah_opportunity_type_enum;
  v_retrieved_at timestamptz;
  v_published_at timestamptz;
  v_deadline_at timestamptz;
  v_evidence_id uuid;
  v_candidate_id uuid;
  v_predecessor uuid;
  v_existing public.lammah_import_candidates%ROWTYPE;
  v_existing_opportunity uuid;
  v_native_job_id uuid;
  v_idempotency_key text;
  v_review_flags text[] := '{}'::text[];
  v_state text := 'pending_review';
  v_match_outcome text := 'independent';
  v_match_reasons jsonb := '[]'::jsonb;
  v_redirect_chain jsonb := COALESCE(p_record->'redirect_chain','[]'::jsonb);
  v_payload text := p_record->>'payload_body';
  v_fact record;
BEGIN
  IF jsonb_typeof(p_record) <> 'object'
     OR p_record - ARRAY[
       'source_record_id','checksum_sha256','request_identity','source_page_url',
       'apply_url','final_apply_url','redirect_chain','url_validation_evidence',
       'retrieved_at','source_published_at','source_deadline_at','opportunity_type',
       'title_original','title_ar','title_en','organization_raw_name',
       'location_country','location_region','location_city','payload_body',
       'sanitized_projection','content_type','personal_data_dominated','hostile_content'
     ]::text[] <> '{}'::jsonb THEN
    RETURN jsonb_build_object('ok',false,'code','record_shape_invalid');
  END IF;

  SELECT * INTO v_run
  FROM public.lammah_sync_runs
  WHERE id = p_run_id AND status = 'running'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','run_not_active');
  END IF;

  SELECT * INTO v_source
  FROM public.lammah_sources
  WHERE id = v_run.source_id
  FOR UPDATE;

  BEGIN
    v_retrieved_at := COALESCE(NULLIF(p_record->>'retrieved_at','')::timestamptz,now());
    v_published_at := NULLIF(p_record->>'source_published_at','')::timestamptz;
    v_deadline_at := NULLIF(p_record->>'source_deadline_at','')::timestamptz;
    v_type := NULLIF(p_record->>'opportunity_type','')::public.lammah_opportunity_type_enum;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.lammah_dead_letters (
      source_id,run_id,source_record_id,error_class,sanitized_details,attributed_worker_identity
    ) VALUES (
      v_source.id,v_run.id,left(v_record_id,200),'invalid_typed_value',
      jsonb_build_object('sqlstate',SQLSTATE),v_run.worker_identity
    );
    UPDATE public.lammah_sync_runs
    SET dead_letter_count=dead_letter_count+1,heartbeat_at=now()
    WHERE id=v_run.id;
    RETURN jsonb_build_object('ok',false,'code','invalid_typed_value');
  END;

  IF v_record_id IS NULL OR char_length(v_record_id) > 200
     OR v_checksum !~ '^[0-9a-f]{64}$'
     OR v_payload IS NULL OR octet_length(v_payload) NOT BETWEEN 1 AND 10485760
     OR v_title_original IS NULL OR char_length(v_title_original) > 300
     OR COALESCE(v_title_ar,v_title_en) IS NULL
     OR v_organization IS NULL OR char_length(v_organization) > 300
     OR v_type IS NULL OR NOT (v_type = ANY(v_source.supported_opportunity_types))
     OR v_source_url IS NULL
     OR v_apply_url IS NULL
     OR jsonb_typeof(v_redirect_chain) <> 'array'
     OR jsonb_array_length(v_redirect_chain) > 4 THEN
    INSERT INTO public.lammah_dead_letters (
      source_id,run_id,source_record_id,error_class,sanitized_details,attributed_worker_identity
    ) VALUES (
      v_source.id,v_run.id,left(v_record_id,200),'record_validation_failed',
      jsonb_build_object('record_id_present',v_record_id IS NOT NULL),v_run.worker_identity
    );
    UPDATE public.lammah_sync_runs
    SET dead_letter_count=dead_letter_count+1,heartbeat_at=now()
    WHERE id=v_run.id;
    RETURN jsonb_build_object('ok',false,'code','record_validation_failed');
  END IF;

  IF NOT public.lammah_host_allowed(v_source_url, public.lammah_resolved_source_hosts(v_source))
     OR NOT public.lammah_host_allowed(v_apply_url,v_source.allowed_apply_hosts)
     OR v_final_url IS NULL
     OR NOT public.lammah_host_allowed(v_final_url,v_source.allowed_apply_hosts)
     OR COALESCE((p_record->'url_validation_evidence'->>'status_code')::integer,0) NOT BETWEEN 200 AND 399 THEN
    v_review_flags := array_append(v_review_flags,'url_validation_failure');
    v_state := 'quarantined';
  END IF;

  IF COALESCE((p_record->>'hostile_content')::boolean,false) THEN
    v_review_flags := array_append(v_review_flags,'hostile_content');
    v_state := 'quarantined';
  END IF;
  IF COALESCE((p_record->>'personal_data_dominated')::boolean,false) THEN
    v_review_flags := array_append(v_review_flags,'personal_data_review');
    v_state := 'quarantined';
  END IF;
  IF v_deadline_at IS NOT NULL AND v_deadline_at <= v_retrieved_at THEN
    v_review_flags := array_append(v_review_flags,'source_stale');
    v_state := 'quarantined';
  END IF;

  SELECT * INTO v_existing
  FROM public.lammah_import_candidates
  WHERE source_id = v_source.id
    AND source_record_id = v_record_id
    AND checksum_sha256 = v_checksum
  ORDER BY created_at DESC
  LIMIT 1;
  IF FOUND THEN
    UPDATE public.lammah_import_candidates
    SET last_seen_at = GREATEST(last_seen_at,v_retrieved_at)
    WHERE id = v_existing.id;
    UPDATE public.lammah_sync_runs
    SET replayed_count = replayed_count + 1, heartbeat_at = now()
    WHERE id = v_run.id;
    RETURN jsonb_build_object(
      'ok',true,'code','replayed','candidate_id',v_existing.id,
      'state',v_existing.state,'published_opportunity_id',v_existing.published_opportunity_id
    );
  END IF;

  SELECT id INTO v_predecessor
  FROM public.lammah_import_candidates
  WHERE source_id = v_source.id AND source_record_id = v_record_id
  ORDER BY created_at DESC
  LIMIT 1;

  UPDATE public.lammah_import_candidates
  SET state = 'superseded_by_replay', assigned_to = NULL, assigned_at = NULL,
      decision_notes = 'Superseded by a newer source checksum', decided_at = now()
  WHERE id = v_predecessor
    AND state IN (
      'pending_review','assigned','quarantined','returned_for_correction',
      'approved','auto_publish_eligible'
    );
  UPDATE public.lammah_review_queue
  SET queue_state='closed',decision='returned',closed_at=now()
  WHERE candidate_id=v_predecessor AND queue_state='open';

  INSERT INTO public.lammah_raw_evidence (
    source_id,run_id,source_record_id,request_identity,source_url,payload_body,
    sanitized_projection,content_type,content_size_bytes,checksum_sha256,
    redirect_chain,final_destination,parser_version,deletion_eligible_at,
    personal_data_dominated,retrieved_at
  ) VALUES (
    v_source.id,v_run.id,v_record_id,
    left(COALESCE(NULLIF(p_record->>'request_identity',''),v_run.external_run_id || ':' || v_record_id),300),
    v_source_url,v_payload,COALESCE(p_record->'sanitized_projection','{}'::jsonb),
    COALESCE(NULLIF(p_record->>'content_type',''),'text/html'),octet_length(v_payload),
    v_checksum,v_redirect_chain,v_final_url,v_source.parser_version,
    v_retrieved_at + interval '180 days',
    COALESCE((p_record->>'personal_data_dominated')::boolean,false),v_retrieved_at
  )
  ON CONFLICT (source_id,source_record_id,checksum_sha256) DO NOTHING
  RETURNING id INTO v_evidence_id;

  IF v_evidence_id IS NULL THEN
    SELECT id INTO v_evidence_id
    FROM public.lammah_raw_evidence
    WHERE source_id=v_source.id AND source_record_id=v_record_id
      AND checksum_sha256=v_checksum;
  END IF;

  SELECT published_opportunity_id INTO v_existing_opportunity
  FROM public.lammah_import_candidates
  WHERE source_id=v_source.id AND source_record_id=v_record_id
    AND state='published' AND published_opportunity_id IS NOT NULL
  ORDER BY decided_at DESC NULLS LAST
  LIMIT 1;
  IF v_existing_opportunity IS NOT NULL THEN
    v_match_outcome := 'new_cycle';
    v_match_reasons := jsonb_build_array(jsonb_build_object(
      'kind','same_source_record_new_checksum','opportunity_id',v_existing_opportunity
    ));
  ELSE
    SELECT opportunity.id INTO v_existing_opportunity
    FROM public.lammah_opportunities opportunity
    WHERE public.normalize_opportunity_url(opportunity.external_url)
          = public.normalize_opportunity_url(v_final_url)
    ORDER BY opportunity.created_at
    LIMIT 1;
    IF v_existing_opportunity IS NOT NULL THEN
      v_match_outcome := 'duplicate_external';
      v_review_flags := array_append(v_review_flags,'duplicate_external');
      v_match_reasons := jsonb_build_array(jsonb_build_object(
        'kind','normalized_apply_url','opportunity_id',v_existing_opportunity
      ));
    END IF;
  END IF;

  v_native_job_id := public.find_native_job_conflict(
    v_type,NULL,v_title_ar,v_title_en,v_final_url,
    NULLIF(btrim(p_record->>'location_region'),''),NULL
  );
  IF v_native_job_id IS NOT NULL THEN
    v_state := 'suppressed_by_native';
    v_match_outcome := 'suppressed_by_native';
    v_review_flags := array_append(array_remove(v_review_flags,'suppressed_by_native'),'suppressed_by_native');
    v_match_reasons := v_match_reasons || jsonb_build_array(jsonb_build_object(
      'kind','native_job_precedence','native_job_id',v_native_job_id
    ));
  END IF;

  v_idempotency_key := v_source.source_key || ':' || v_record_id || ':' || v_checksum;
  INSERT INTO public.lammah_import_candidates (
    source_id,run_id,evidence_id,source_record_id,idempotency_key,checksum_sha256,
    state,opportunity_type,title_original,title_ar,title_en,organization_raw_name,
    location_country,location_region,location_city,source_published_at,
    source_deadline_at,source_page_url,apply_url,final_apply_url,
    apply_url_validated_at,url_validation_evidence,match_outcome,match_reasons,
    review_flags,normalized_title,normalized_organization,predecessor_candidate_id
  ) VALUES (
    v_source.id,v_run.id,v_evidence_id,v_record_id,v_idempotency_key,v_checksum,
    v_state,v_type,v_title_original,v_title_ar,v_title_en,v_organization,
    NULLIF(btrim(p_record->>'location_country'),''),
    NULLIF(btrim(p_record->>'location_region'),''),
    NULLIF(btrim(p_record->>'location_city'),''),v_published_at,v_deadline_at,
    v_source_url,v_apply_url,v_final_url,
    CASE WHEN NOT ('url_validation_failure'=ANY(v_review_flags)) THEN now() END,
    COALESCE(p_record->'url_validation_evidence','{}'::jsonb),
    v_match_outcome,v_match_reasons,v_review_flags,
    public.normalize_opportunity_title(COALESCE(v_title_en,v_title_ar)),
    public.normalize_opportunity_title(v_organization),v_predecessor
  ) RETURNING id INTO v_candidate_id;

  FOR v_fact IN
    SELECT * FROM (VALUES
      ('source_record_id',to_jsonb(v_record_id),to_jsonb(v_record_id)),
      ('title.original',to_jsonb(v_title_original),to_jsonb(v_title_original)),
      ('title.ar',to_jsonb(v_title_ar),to_jsonb(v_title_ar)),
      ('title.en',to_jsonb(v_title_en),to_jsonb(v_title_en)),
      ('organization.raw_name',to_jsonb(v_organization),to_jsonb(v_organization)),
      ('opportunity.type',to_jsonb(v_type::text),to_jsonb(v_type::text)),
      ('location.country',to_jsonb(NULLIF(btrim(p_record->>'location_country'),'')),to_jsonb(NULLIF(btrim(p_record->>'location_country'),''))),
      ('location.region',to_jsonb(NULLIF(btrim(p_record->>'location_region'),'')),to_jsonb(NULLIF(btrim(p_record->>'location_region'),''))),
      ('location.city',to_jsonb(NULLIF(btrim(p_record->>'location_city'),'')),to_jsonb(NULLIF(btrim(p_record->>'location_city'),''))),
      ('dates.published',to_jsonb(v_published_at),to_jsonb(v_published_at)),
      ('dates.deadline',to_jsonb(v_deadline_at),to_jsonb(v_deadline_at)),
      ('url.apply',to_jsonb(v_apply_url),to_jsonb(v_final_url)),
      ('url.source_page',to_jsonb(v_source_url),to_jsonb(v_source_url))
    ) AS facts(fact_key,original_value,normalized_value)
    WHERE facts.normalized_value IS NOT NULL
  LOOP
    INSERT INTO public.lammah_candidate_facts (
      candidate_id,evidence_id,source_id,source_record_id,fact_key,
      original_value,normalized_value,extraction_method,source_url,
      parser_model_version,confidence,confidence_reason_ar,
      confidence_reason_en,retrieved_at
    ) VALUES (
      v_candidate_id,v_evidence_id,v_source.id,v_record_id,v_fact.fact_key,
      v_fact.original_value,v_fact.normalized_value,'source_structured',
      v_source_url,v_source.parser_version,1,
      'حقل مهيكل من صفحة المصدر الرسمية',
      'Structured field from the official source page',v_retrieved_at
    );
  END LOOP;

  IF v_existing_opportunity IS NOT NULL AND v_match_outcome='duplicate_external' THEN
    INSERT INTO public.lammah_duplicate_candidates (
      candidate_id,possible_opportunity_id,outcome,reasons,deterministic
    ) VALUES (
      v_candidate_id,v_existing_opportunity,'duplicate',v_match_reasons,true
    );
  END IF;

  IF v_native_job_id IS NOT NULL THEN
    INSERT INTO public.lammah_native_match_events (
      candidate_id,native_job_id,outcome,reasons,deterministic
    ) VALUES (
      v_candidate_id,v_native_job_id,'suppressed',v_match_reasons,true
    );
    INSERT INTO public.lammah_lifecycle_events (
      source_id,candidate_id,run_id,event_type,actor_kind,reason,details
    ) VALUES (
      v_source.id,v_candidate_id,v_run.id,'candidate_suppressed_by_native',
      'worker','native_job_precedence',jsonb_build_object('native_job_id',v_native_job_id)
    );
  ELSE
    INSERT INTO public.lammah_review_queue (candidate_id,queue_state,priority)
    VALUES (
      v_candidate_id,'open',
      CASE WHEN v_state='quarantined' OR cardinality(v_review_flags)>0 THEN 80 ELSE 50 END
    );
  END IF;

  INSERT INTO public.lammah_lifecycle_events (
    source_id,candidate_id,run_id,event_type,actor_kind,details
  ) VALUES (
    v_source.id,v_candidate_id,v_run.id,'candidate_ingested','worker',
    jsonb_build_object('state',v_state,'match_outcome',v_match_outcome)
  );
  UPDATE public.lammah_sync_runs
  SET accepted_count=accepted_count+1,
      review_count=review_count+CASE WHEN v_native_job_id IS NULL THEN 1 ELSE 0 END,
      heartbeat_at=now()
  WHERE id=v_run.id;

  IF v_state='pending_review' THEN
    PERFORM public.lammah_try_auto_publish(v_candidate_id);
  END IF;

  SELECT state,published_opportunity_id
  INTO v_state,v_existing_opportunity
  FROM public.lammah_import_candidates WHERE id=v_candidate_id;

  RETURN jsonb_build_object(
    'ok',true,'code','accepted','candidate_id',v_candidate_id,
    'state',v_state,'published_opportunity_id',v_existing_opportunity
  );
EXCEPTION WHEN OTHERS THEN
  IF v_run.id IS NOT NULL THEN
    INSERT INTO public.lammah_dead_letters (
      source_id,run_id,evidence_id,source_record_id,idempotency_key,error_class,
      sanitized_details,attributed_worker_identity
    ) VALUES (
      v_run.source_id,v_run.id,NULL,left(v_record_id,200),v_idempotency_key,
      'unexpected_ingest_error',jsonb_build_object('sqlstate',SQLSTATE,'message',left(SQLERRM,300)),
      v_run.worker_identity
    );
    UPDATE public.lammah_sync_runs
    SET dead_letter_count=dead_letter_count+1,heartbeat_at=now()
    WHERE id=v_run.id;
  END IF;
  RETURN jsonb_build_object('ok',false,'code','unexpected_ingest_error');
END
$function$;

CREATE OR REPLACE FUNCTION public.lammah_begin_source_run(
  p_source_key text,
  p_external_run_id text,
  p_mode text DEFAULT 'incremental',
  p_worker_identity text DEFAULT 'lammah_worker'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_source public.lammah_sources%ROWTYPE;
  v_run_id uuid;
BEGIN
  IF NULLIF(btrim(p_source_key),'') IS NULL
     OR p_source_key !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
     OR NULLIF(btrim(p_external_run_id),'') IS NULL OR char_length(p_external_run_id) > 160
     OR p_mode NOT IN ('full','incremental','retry','revalidation')
     OR NULLIF(btrim(p_worker_identity),'') IS NULL OR char_length(p_worker_identity) > 160 THEN
    RETURN jsonb_build_object('ok',false,'code','invalid_run_request');
  END IF;

  SELECT * INTO v_source
  FROM public.lammah_sources
  WHERE source_key = p_source_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','source_missing');
  END IF;

  IF NOT EXISTS (
       SELECT 1 FROM public.feature_flags
       WHERE key = 'lammah.phase1_ingestion' AND is_enabled
     )
     OR NOT EXISTS (
       SELECT 1 FROM public.feature_flags
       WHERE key = 'lammah.connector_enabled' AND is_enabled
     )
     OR NOT v_source.is_active
     OR v_source.approval_state <> 'approved'
     OR NOT v_source.robots_ok THEN
    INSERT INTO public.lammah_lifecycle_events (
      source_id,event_type,actor_kind,reason,details
    ) VALUES (
      v_source.id,'sync_skipped','worker','disabled_or_unapproved',
      jsonb_build_object('external_run_id',left(p_external_run_id,160),'source_key',p_source_key)
    );
    RETURN jsonb_build_object('ok',false,'code','disabled');
  END IF;

  BEGIN
    INSERT INTO public.lammah_sync_runs (
      source_id,external_run_id,worker_identity,mode,parser_version,status
    ) VALUES (
      v_source.id,left(p_external_run_id,160),left(p_worker_identity,160),
      p_mode,v_source.parser_version,'running'
    ) RETURNING id INTO v_run_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok',false,'code','already_running_or_replayed');
  END;

  INSERT INTO public.lammah_lifecycle_events (
    source_id,run_id,event_type,actor_kind,details
  ) VALUES (
    v_source.id,v_run_id,'sync_started','worker',
    jsonb_build_object('mode',p_mode,'external_run_id',p_external_run_id,'source_key',p_source_key)
  );

  RETURN jsonb_build_object(
    'ok',true,
    'run_id',v_run_id,
    'source_id',v_source.id,
    'source_key',v_source.source_key,
    'source_url',v_source.base_url,
    'parser_version',v_source.parser_version,
    'allowed_apply_hosts',v_source.allowed_apply_hosts,
    'rate_limit_policy',v_source.rate_limit_policy
  );
END
$function$;

COMMENT ON FUNCTION public.lammah_begin_source_run(text,text,text,text) IS
  'Additive per-source run starter. Does not approve sources, does not enable auto-publication, and does not create Directory or Profile rows. Existing lammah_begin_run remains EU Careers-only.';

RESET ROLE;

ALTER FUNCTION public.lammah_resolved_source_hosts(public.lammah_sources) OWNER TO lammah_function_owner;
ALTER FUNCTION public.ingest_lammah_candidate(uuid, jsonb) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_begin_source_run(text, text, text, text) OWNER TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.lammah_resolved_source_hosts(public.lammah_sources) TO lammah_worker;
GRANT EXECUTE ON FUNCTION public.ingest_lammah_candidate(uuid, jsonb) TO lammah_worker;
REVOKE ALL ON FUNCTION public.lammah_begin_source_run(text, text, text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lammah_begin_source_run(text, text, text, text) TO lammah_worker;
REVOKE CREATE ON SCHEMA public FROM lammah_function_owner;
REVOKE lammah_function_owner FROM postgres;

COMMIT;
