-- JID Lammah Phase 1: restricted worker intake, Staff review, publication,
-- lifecycle, retention, and operational controls. No radar-table changes.

BEGIN;

GRANT lammah_function_owner TO postgres;
GRANT CREATE ON SCHEMA public TO lammah_function_owner;

-- ---------------------------------------------------------------------------
-- State-machine and immutable-evidence guards
-- ---------------------------------------------------------------------------

SET ROLE lammah_function_owner;

CREATE FUNCTION public._lammah_guard_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW)->>'created_at') IS DISTINCT FROM (to_jsonb(OLD)->>'created_at') THEN
    RAISE EXCEPTION 'lammah_created_at_immutable';
  END IF;

  IF TG_TABLE_NAME = 'lammah_raw_evidence'
     AND (to_jsonb(OLD)->>'payload_body') IS NOT NULL
     AND (to_jsonb(NEW)->>'payload_body') IS DISTINCT FROM (to_jsonb(OLD)->>'payload_body')
     AND NOT (
       to_jsonb(NEW)->>'retention_state' = 'payload_deleted'
       AND (to_jsonb(NEW)->>'payload_body') IS NULL
       AND NULLIF(to_jsonb(NEW)->>'payload_deletion_reason','') IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'lammah_evidence_payload_immutable';
  END IF;

  IF TG_TABLE_NAME = 'lammah_import_candidates'
     AND (to_jsonb(NEW)->>'state') IS DISTINCT FROM (to_jsonb(OLD)->>'state')
     AND NOT (
       (to_jsonb(OLD)->>'state' = 'pending_review' AND to_jsonb(NEW)->>'state' IN (
         'assigned','quarantined','returned_for_correction','approved',
         'auto_publish_eligible','published','rejected','superseded_by_replay',
         'suppressed_by_native'
       ))
       OR (to_jsonb(OLD)->>'state' = 'assigned' AND to_jsonb(NEW)->>'state' IN (
         'pending_review','quarantined','returned_for_correction','approved',
         'published','rejected','superseded_by_replay','suppressed_by_native'
       ))
       OR (to_jsonb(OLD)->>'state' = 'quarantined' AND to_jsonb(NEW)->>'state' IN (
         'pending_review','assigned','returned_for_correction','rejected','superseded_by_replay'
       ))
       OR (to_jsonb(OLD)->>'state' = 'returned_for_correction' AND to_jsonb(NEW)->>'state' IN (
         'pending_review','assigned','approved','rejected','superseded_by_replay'
       ))
       OR (to_jsonb(OLD)->>'state' = 'approved' AND to_jsonb(NEW)->>'state' IN (
         'auto_publish_eligible','published','returned_for_correction','rejected',
         'superseded_by_replay','suppressed_by_native'
       ))
       OR (to_jsonb(OLD)->>'state' = 'auto_publish_eligible' AND to_jsonb(NEW)->>'state' IN (
         'published','pending_review','superseded_by_replay','suppressed_by_native'
       ))
     ) THEN
    RAISE EXCEPTION 'lammah_candidate_transition_denied:%->%',
      to_jsonb(OLD)->>'state', to_jsonb(NEW)->>'state';
  END IF;

  IF TG_TABLE_NAME = 'lammah_import_candidates' THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END
$function$;

-- Existing shipped functions are owned by postgres. End the bounded role
-- switch before replacing them; all new/replaced functions are transferred to
-- lammah_function_owner in the ownership block below.
RESET ROLE;

CREATE FUNCTION public.expire_stale_lammah_opportunities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    UPDATE public.lammah_opportunities
    SET status='expired'
    WHERE status IN ('active','hidden')
      AND (
        (expires_at IS NOT NULL AND expires_at<=now())
        OR (expires_at IS NULL AND last_confirmed_at<=now()-interval '14 days')
      )
    RETURNING id,source_id,
      CASE WHEN expires_at IS NOT NULL AND expires_at<=now()
        THEN 'source_deadline_passed' ELSE 'revalidation_stale_14_days' END AS reason
  LOOP
    v_count := v_count+1;
    INSERT INTO public.lammah_lifecycle_events (
      source_id,opportunity_id,event_type,actor_kind,reason
    ) VALUES (v_row.source_id,v_row.id,'opportunity_expired','system',v_row.reason);
  END LOOP;
  RETURN jsonb_build_object('ok',true,'expired_count',v_count);
END
$function$;

CREATE OR REPLACE FUNCTION public.purge_expired_lammah()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  PERFORM public.expire_stale_lammah_opportunities();
END
$function$;

CREATE FUNCTION public.execute_lammah_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_count integer;
BEGIN
  WITH eligible AS (
    SELECT evidence.id
    FROM public.lammah_raw_evidence evidence
    WHERE evidence.payload_body IS NOT NULL
      AND NOT evidence.legal_hold
      AND evidence.retention_state IN ('active','superseded','quarantined')
      AND evidence.deletion_eligible_at<=now()
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.lammah_raw_evidence evidence
  SET payload_body=NULL,retention_state='payload_deleted',payload_deleted_at=now(),
      payload_deletion_reason='Lammah Phase 1 source-governed retention policy'
  FROM eligible WHERE evidence.id=eligible.id;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,event_type,actor_kind,reason,details
  )
  SELECT source.id,'retention_executed','system','scheduled_retention',
    jsonb_build_object('payloads_deleted',v_count)
  FROM public.lammah_sources source WHERE source.source_key='eu_careers_cast';
  RETURN jsonb_build_object('ok',true,'payloads_deleted',v_count);
END
$function$;

CREATE FUNCTION public.lammah_finish_run(
  p_run_id uuid,
  p_status text,
  p_retrieved_count integer,
  p_page_count integer,
  p_retry_count integer,
  p_checkpoint jsonb DEFAULT '{}'::jsonb,
  p_failure_class text DEFAULT NULL,
  p_failure_detail text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_run public.lammah_sync_runs%ROWTYPE;
  v_success boolean;
  v_record record;
BEGIN
  IF p_status NOT IN ('succeeded','succeeded_partial','failed_partial','skipped')
     OR p_retrieved_count<0 OR p_page_count<0 OR p_retry_count<0
     OR jsonb_typeof(COALESCE(p_checkpoint,'{}'::jsonb))<>'object' THEN
    RETURN jsonb_build_object('ok',false,'code','invalid_completion');
  END IF;
  UPDATE public.lammah_sync_runs
  SET status=p_status,retrieved_count=p_retrieved_count,page_count=p_page_count,
      retry_count=p_retry_count,checkpoint=COALESCE(p_checkpoint,'{}'::jsonb),
      failure_class=left(p_failure_class,80),failure_detail=left(p_failure_detail,500),
      heartbeat_at=now(),completed_at=now(),updated_at=now()
  WHERE id=p_run_id AND status='running'
  RETURNING * INTO v_run;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','run_not_active');
  END IF;
  v_success := p_status IN ('succeeded','succeeded_partial');

  UPDATE public.lammah_sources
  SET last_crawled_at=now(),
      last_content_hash=COALESCE(NULLIF(p_checkpoint->>'content_hash',''),last_content_hash),
      last_success_at=CASE WHEN v_success THEN now() ELSE last_success_at END,
      last_failure_at=CASE WHEN v_success THEN last_failure_at ELSE now() END,
      consecutive_failures=CASE WHEN v_success THEN 0 ELSE consecutive_failures+1 END,
      health_state=CASE WHEN p_status='succeeded' THEN 'healthy'
        WHEN p_status='succeeded_partial' THEN 'degraded' ELSE 'unhealthy' END,
      updated_at=now()
  WHERE id=v_run.source_id;

  UPDATE public.lammah_sources
  SET approval_state='suspended',is_active=false,auto_publication_enabled=false,
      suspended_at=now(),suspension_reason='automatic suspension after 3 consecutive failed runs',
      updated_at=now()
  WHERE id=v_run.source_id AND consecutive_failures>=3;

  IF v_success
     AND jsonb_typeof(p_checkpoint->'checked_source_record_ids')='array'
     AND jsonb_typeof(p_checkpoint->'seen_source_record_ids')='array' THEN
    UPDATE public.lammah_opportunities opportunity
    SET last_confirmed_at=now(),source_removed_scan_count=0
    FROM public.lammah_source_links link
    WHERE link.opportunity_id=opportunity.id
      AND link.source_id=v_run.source_id
      AND link.source_record_id IN (
        SELECT jsonb_array_elements_text(p_checkpoint->'seen_source_record_ids')
      )
      AND opportunity.status IN ('active','hidden');

    FOR v_record IN
      UPDATE public.lammah_opportunities opportunity
      SET source_removed_scan_count=LEAST(opportunity.source_removed_scan_count+1,2)
      FROM public.lammah_source_links link
      WHERE link.opportunity_id=opportunity.id
        AND link.source_id=v_run.source_id
        AND link.source_record_id IN (
          SELECT jsonb_array_elements_text(p_checkpoint->'checked_source_record_ids')
        )
        AND link.source_record_id NOT IN (
          SELECT jsonb_array_elements_text(p_checkpoint->'seen_source_record_ids')
        )
        AND opportunity.status IN ('active','hidden')
      RETURNING opportunity.id,opportunity.source_id,opportunity.source_removed_scan_count
    LOOP
      INSERT INTO public.lammah_lifecycle_events (
        source_id,opportunity_id,run_id,event_type,actor_kind,reason,details
      ) VALUES (
        v_record.source_id,v_record.id,v_run.id,
        CASE WHEN v_record.source_removed_scan_count>=2 THEN 'source_removed' ELSE 'withdrawn_pending_confirmation' END,
        'worker','not_present_in_checked_source_scan',
        jsonb_build_object('consecutive_missing_scans',v_record.source_removed_scan_count)
      );
      IF v_record.source_removed_scan_count>=2 THEN
        UPDATE public.lammah_opportunities SET status='expired'
        WHERE id=v_record.id AND status IN ('active','hidden');
        INSERT INTO public.lammah_lifecycle_events (
          source_id,opportunity_id,run_id,event_type,actor_kind,reason
        ) VALUES (
          v_record.source_id,v_record.id,v_run.id,'opportunity_expired','worker',
          'source_removed_after_second_consecutive_scan'
        );
      END IF;
    END LOOP;
  END IF;

  PERFORM public.expire_stale_lammah_opportunities();
  INSERT INTO public.lammah_lifecycle_events (
    source_id,run_id,event_type,actor_kind,reason,details
  ) VALUES (
    v_run.source_id,v_run.id,'sync_completed','worker',p_failure_class,
    jsonb_build_object('status',p_status,'retrieved_count',p_retrieved_count,
      'page_count',p_page_count,'retry_count',p_retry_count)
  );
  RETURN jsonb_build_object('ok',true,'run_id',v_run.id,'status',p_status);
END
$function$;

CREATE FUNCTION public.record_lammah_dead_letter(
  p_run_id uuid,
  p_source_record_id text,
  p_error_class text,
  p_sanitized_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_run public.lammah_sync_runs%ROWTYPE;
  v_dead_letter_id uuid;
BEGIN
  IF p_error_class !~ '^[a-z][a-z0-9_]{2,79}$'
     OR jsonb_typeof(COALESCE(p_sanitized_details,'{}'::jsonb))<>'object'
     OR octet_length(COALESCE(p_sanitized_details,'{}'::jsonb)::text)>2000
     OR char_length(COALESCE(p_source_record_id,''))>200 THEN
    RETURN jsonb_build_object('ok',false,'code','invalid_dead_letter_request');
  END IF;

  SELECT * INTO v_run
  FROM public.lammah_sync_runs
  WHERE id=p_run_id AND status='running'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','run_not_active');
  END IF;

  INSERT INTO public.lammah_dead_letters (
    source_id,run_id,source_record_id,error_class,sanitized_details,
    attributed_worker_identity
  ) VALUES (
    v_run.source_id,v_run.id,NULLIF(left(p_source_record_id,200),''),p_error_class,
    COALESCE(p_sanitized_details,'{}'::jsonb),v_run.worker_identity
  ) RETURNING id INTO v_dead_letter_id;

  UPDATE public.lammah_sync_runs
  SET dead_letter_count=dead_letter_count+1,heartbeat_at=now(),updated_at=now()
  WHERE id=v_run.id;

  INSERT INTO public.lammah_lifecycle_events (
    source_id,run_id,event_type,actor_kind,reason,details
  ) VALUES (
    v_run.source_id,v_run.id,'dead_letter_created','worker',p_error_class,
    jsonb_build_object('dead_letter_id',v_dead_letter_id)
  );

  RETURN jsonb_build_object('ok',true,'code','dead_letter_recorded','dead_letter_id',v_dead_letter_id);
END
$function$;

CREATE FUNCTION public.report_lammah_problem(p_opportunity_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT public.has_entitlement('lammah_feed') THEN
    RETURN jsonb_build_object('ok',false,'code','lammah_entitlement_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL OR char_length(p_reason)>500 THEN
    RETURN jsonb_build_object('ok',false,'code','valid_reason_required');
  END IF;
  SELECT link.candidate_id INTO v_candidate_id
  FROM public.lammah_source_links link
  JOIN public.lammah_opportunities opportunity ON opportunity.id=link.opportunity_id
  WHERE opportunity.id=p_opportunity_id AND opportunity.status='active'
  ORDER BY link.created_at DESC LIMIT 1;
  IF v_candidate_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','active_opportunity_not_found');
  END IF;
  UPDATE public.lammah_import_candidates
  SET review_flags=array_append(array_remove(review_flags,'report_problem'),'report_problem'),
      decision_notes='User report: ' || p_reason
  WHERE id=v_candidate_id;
  UPDATE public.lammah_review_queue
  SET queue_state='open',decision=NULL,closed_at=NULL,priority=100,updated_at=now()
  WHERE candidate_id=v_candidate_id;
  INSERT INTO public.lammah_lifecycle_events (
    candidate_id,opportunity_id,event_type,actor_id,actor_kind,reason
  ) VALUES (
    v_candidate_id,p_opportunity_id,'problem_reported',v_actor,'system',p_reason
  );
  RETURN jsonb_build_object('ok',true,'code','report_received');
END
$function$;

CREATE FUNCTION public.transition_lammah_opportunity(
  p_opportunity_id uuid,
  p_action text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_current public.lammah_opportunities%ROWTYPE;
  v_updated public.lammah_opportunities%ROWTYPE;
  v_target public.lammah_status_enum;
BEGIN
  IF v_actor IS NULL OR NULLIF(btrim(p_reason),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','actor_and_reason_required');
  END IF;
  v_role:=public.current_user_role();
  SELECT * INTO v_current FROM public.lammah_opportunities
  WHERE id=p_opportunity_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','opportunity_not_found'); END IF;
  IF v_current.status='superseded' THEN
    RETURN jsonb_build_object('ok',false,'code','native_supersession_terminal');
  END IF;
  IF p_action IN ('hide','takedown') AND v_current.status='active' THEN
    v_target:='hidden';
  ELSIF p_action='unhide' AND v_current.status='hidden'
    AND (v_current.expires_at IS NULL OR v_current.expires_at>now())
    AND v_current.last_confirmed_at>now()-interval '14 days' THEN
    v_target:='active';
  ELSIF p_action='expire' AND v_current.status IN ('active','hidden') THEN
    v_target:='expired';
  ELSE
    RETURN jsonb_build_object('ok',false,'code','invalid_lifecycle_transition');
  END IF;
  UPDATE public.lammah_opportunities
  SET status=v_target,
      hidden_by=CASE WHEN v_target='hidden' THEN v_actor ELSE NULL END,
      hidden_reason=CASE WHEN v_target='hidden' THEN p_reason ELSE NULL END
  WHERE id=p_opportunity_id RETURNING * INTO v_updated;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,opportunity_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    v_updated.source_id,v_updated.id,
    CASE v_target WHEN 'hidden' THEN 'opportunity_hidden'
      WHEN 'active' THEN 'opportunity_unhidden' ELSE 'opportunity_expired' END,
    v_actor,CASE WHEN v_role='super_admin' THEN 'super_admin' ELSE 'staff' END,
    p_reason,jsonb_build_object('from',v_current.status,'to',v_updated.status,'action',p_action)
  );
  RETURN jsonb_build_object('ok',true,'code',p_action,'status',v_updated.status);
END
$function$;

CREATE FUNCTION public.configure_lammah_phase1(
  p_ingestion_enabled boolean,
  p_connector_enabled boolean,
  p_auto_publication_enabled boolean,
  p_source_enabled boolean,
  p_source_auto_publication_enabled boolean,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_source_id uuid;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','reason_required');
  END IF;
  IF p_source_auto_publication_enabled AND (
    NOT p_source_enabled OR NOT p_ingestion_enabled OR NOT p_auto_publication_enabled
  ) THEN
    RETURN jsonb_build_object('ok',false,'code','auto_publication_dependency_disabled');
  END IF;
  UPDATE public.feature_flags SET is_enabled=p_ingestion_enabled,updated_at=now()
  WHERE key='lammah.phase1_ingestion';
  UPDATE public.feature_flags SET is_enabled=p_connector_enabled,updated_at=now()
  WHERE key='lammah.connector_enabled';
  UPDATE public.feature_flags SET is_enabled=p_auto_publication_enabled,updated_at=now()
  WHERE key='lammah.auto_publication_enabled';
  UPDATE public.lammah_sources
  SET is_active=p_source_enabled,
      auto_publication_enabled=p_source_auto_publication_enabled,
      updated_at=now()
  WHERE source_key='eu_careers_cast' AND approval_state='approved'
  RETURNING id INTO v_source_id;
  IF v_source_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','approved_source_missing');
  END IF;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    v_source_id,'source_configuration_changed',v_actor,'super_admin',p_reason,
    jsonb_build_object('ingestion',p_ingestion_enabled,'connector',p_connector_enabled,
      'auto_global',p_auto_publication_enabled,'source_enabled',p_source_enabled,
      'source_auto',p_source_auto_publication_enabled)
  );
  RETURN jsonb_build_object('ok',true,'code','configured');
END
$function$;

CREATE FUNCTION public.claim_lammah_candidate(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_assigned uuid;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','lammah_review_forbidden');
  END IF;
  v_role := public.current_user_role();
  SELECT assigned_to INTO v_assigned
  FROM public.lammah_import_candidates
  WHERE id=p_candidate_id
    AND state IN ('pending_review','assigned','returned_for_correction')
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_claimable');
  END IF;
  IF v_assigned IS NOT NULL AND v_assigned<>v_actor AND v_role<>'super_admin' THEN
    RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',true);
  END IF;
  UPDATE public.lammah_import_candidates
  SET assigned_to=COALESCE(assigned_to,v_actor),assigned_at=COALESCE(assigned_at,now()),
      state='assigned'
  WHERE id=p_candidate_id
  RETURNING assigned_to INTO v_assigned;
  UPDATE public.lammah_review_queue
  SET assigned_to=v_assigned,updated_at=now()
  WHERE candidate_id=p_candidate_id;
  INSERT INTO public.lammah_lifecycle_events (
    candidate_id,event_type,actor_id,actor_kind,details
  ) VALUES (
    p_candidate_id,'candidate_assigned',v_actor,
    CASE WHEN v_role='super_admin' THEN 'super_admin' ELSE 'staff' END,
    jsonb_build_object('assigned_to',v_assigned)
  );
  RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',false);
END
$function$;

CREATE FUNCTION public.release_lammah_candidate(p_candidate_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_previous uuid;
BEGIN
  IF v_actor IS NULL OR NULLIF(btrim(p_reason),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','actor_and_reason_required');
  END IF;
  v_role := public.current_user_role();
  SELECT assigned_to INTO v_previous
  FROM public.lammah_import_candidates
  WHERE id=p_candidate_id AND state='assigned'
  FOR UPDATE;
  IF NOT FOUND OR (v_previous<>v_actor AND v_role<>'super_admin') THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_release_forbidden');
  END IF;
  UPDATE public.lammah_import_candidates
  SET assigned_to=NULL,assigned_at=NULL,state='pending_review',decision_notes=p_reason
  WHERE id=p_candidate_id;
  UPDATE public.lammah_review_queue SET assigned_to=NULL,updated_at=now()
  WHERE candidate_id=p_candidate_id;
  INSERT INTO public.lammah_lifecycle_events (
    candidate_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    p_candidate_id,'candidate_released',v_actor,
    CASE WHEN v_role='super_admin' THEN 'super_admin' ELSE 'staff' END,
    p_reason,jsonb_build_object('previous_assignee',v_previous)
  );
  RETURN jsonb_build_object('ok',true,'code','released');
END
$function$;

CREATE FUNCTION public.review_lammah_fact(
  p_fact_id uuid,
  p_action text,
  p_normalized_value jsonb DEFAULT NULL,
  p_notes_ar text DEFAULT NULL,
  p_notes_en text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_fact public.lammah_candidate_facts%ROWTYPE;
  v_candidate public.lammah_import_candidates%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR p_action NOT IN ('accept','reject','edit') THEN
    RETURN jsonb_build_object('ok',false,'code','fact_review_forbidden_or_invalid');
  END IF;
  v_role := public.current_user_role();
  SELECT * INTO v_fact FROM public.lammah_candidate_facts WHERE id=p_fact_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','fact_not_found'); END IF;
  SELECT * INTO v_candidate FROM public.lammah_import_candidates
  WHERE id=v_fact.candidate_id FOR UPDATE;
  IF v_candidate.assigned_to IS DISTINCT FROM v_actor AND v_role<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','assigned_reviewer_required');
  END IF;
  IF v_candidate.state NOT IN ('assigned','returned_for_correction','quarantined') THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_facts_locked');
  END IF;
  IF p_action='edit' AND (
    p_normalized_value IS NULL
    OR v_fact.fact_key IN ('source_record_id','url.source_page')
    OR NULLIF(btrim(p_notes_ar),'') IS NULL
    OR NULLIF(btrim(p_notes_en),'') IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'code','fact_edit_evidence_required');
  END IF;
  UPDATE public.lammah_candidate_facts
  SET review_state=CASE p_action WHEN 'accept' THEN 'accepted' WHEN 'reject' THEN 'rejected' ELSE 'edited' END,
      reviewer_id=v_actor,reviewed_at=now(),
      reviewer_edit=CASE WHEN p_action='edit' THEN jsonb_build_object(
        'normalized_value',p_normalized_value,'notes_ar',p_notes_ar,'notes_en',p_notes_en
      ) END,
      transformation_history=CASE WHEN p_action='edit' THEN transformation_history || jsonb_build_array(
        jsonb_build_object('kind','staff_edit','actor_id',v_actor,'at',now(),
          'notes_ar',p_notes_ar,'notes_en',p_notes_en)
      ) ELSE transformation_history END,
      updated_at=now()
  WHERE id=v_fact.id;
  RETURN jsonb_build_object('ok',true,'code',p_action,'fact_id',v_fact.id);
END
$function$;

CREATE FUNCTION public.review_lammah_candidate(
  p_candidate_id uuid,
  p_action text,
  p_notes text,
  p_corrected_type public.lammah_opportunity_type_enum DEFAULT NULL,
  p_resolved_company_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_candidate public.lammah_import_candidates%ROWTYPE;
  v_checklist jsonb;
BEGIN
  IF v_actor IS NULL OR NULLIF(btrim(p_notes),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','review_actor_and_notes_required');
  END IF;
  v_role := public.current_user_role();
  SELECT * INTO v_candidate FROM public.lammah_import_candidates
  WHERE id=p_candidate_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','candidate_not_found'); END IF;
  IF v_candidate.assigned_to IS DISTINCT FROM v_actor AND v_role<>'super_admin'
     AND p_action NOT IN ('quarantine','release_quarantine') THEN
    RETURN jsonb_build_object('ok',false,'code','assigned_reviewer_required');
  END IF;

  IF p_action='correct_type' THEN
    IF p_corrected_type IS NULL THEN RETURN jsonb_build_object('ok',false,'code','corrected_type_required'); END IF;
    UPDATE public.lammah_import_candidates
    SET opportunity_type=p_corrected_type,
        review_flags=array_remove(review_flags,'ambiguous_type'),decision_notes=p_notes
    WHERE id=p_candidate_id AND state IN ('assigned','returned_for_correction');
    UPDATE public.lammah_candidate_facts
    SET review_state='edited',reviewer_id=v_actor,reviewed_at=now(),
        reviewer_edit=jsonb_build_object('normalized_value',to_jsonb(p_corrected_type::text),'notes',p_notes),
        transformation_history=transformation_history || jsonb_build_array(
          jsonb_build_object('kind','staff_type_correction','actor_id',v_actor,'at',now())
        ),updated_at=now()
    WHERE candidate_id=p_candidate_id AND fact_key='opportunity.type' AND active;
    RETURN jsonb_build_object('ok',true,'code','type_corrected');
  ELSIF p_action='map_organization' THEN
    IF p_resolved_company_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.companies WHERE id=p_resolved_company_id
    ) THEN RETURN jsonb_build_object('ok',false,'code','valid_company_required'); END IF;
    UPDATE public.lammah_import_candidates
    SET resolved_company_id=p_resolved_company_id,
        review_flags=array_remove(array_remove(review_flags,'unresolved_organization'),'organization_conflict'),
        decision_notes=p_notes
    WHERE id=p_candidate_id AND state IN ('assigned','returned_for_correction');
    INSERT INTO public.lammah_candidate_facts (
      candidate_id,evidence_id,source_id,source_record_id,fact_key,original_value,
      normalized_value,extraction_method,source_url,parser_model_version,
      transformation_history,confidence,confidence_reason_ar,confidence_reason_en,
      review_state,reviewer_id,reviewer_edit,reviewed_at,retrieved_at
    ) VALUES (
      v_candidate.id,v_candidate.evidence_id,v_candidate.source_id,v_candidate.source_record_id,
      'organization.resolved_company_id',to_jsonb(p_resolved_company_id),to_jsonb(p_resolved_company_id),
      'staff_entry',v_candidate.source_page_url,'staff-review-v1',
      jsonb_build_array(jsonb_build_object('kind','staff_confirmed_mapping','notes',p_notes)),
      1,'ربط حتمي أكده المراجع مع الدليل','Deterministic organization mapping confirmed by Staff with evidence',
      'accepted',v_actor,jsonb_build_object('notes',p_notes),now(),now()
    ) ON CONFLICT (candidate_id,fact_key) DO UPDATE SET
      normalized_value=EXCLUDED.normalized_value,review_state='accepted',reviewer_id=v_actor,
      reviewer_edit=EXCLUDED.reviewer_edit,reviewed_at=now(),updated_at=now();
    RETURN jsonb_build_object('ok',true,'code','organization_mapped');
  ELSIF p_action='resolve_duplicate_independent' THEN
    UPDATE public.lammah_import_candidates
    SET match_outcome='independent',review_flags=array_remove(review_flags,'duplicate_external'),
        match_reasons=match_reasons || jsonb_build_array(
          jsonb_build_object('kind','staff_resolved_independent','actor_id',v_actor,'notes',p_notes)
        ),decision_notes=p_notes
    WHERE id=p_candidate_id AND state IN ('assigned','returned_for_correction');
    RETURN jsonb_build_object('ok',true,'code','duplicate_resolved_independent');
  ELSIF p_action='quarantine' THEN
    UPDATE public.lammah_import_candidates
    SET state='quarantined',assigned_to=NULL,assigned_at=NULL,decision_by=v_actor,
        decision_notes=p_notes,decided_at=now()
    WHERE id=p_candidate_id AND state IN ('pending_review','assigned');
    UPDATE public.lammah_review_queue
    SET assigned_to=NULL,decision='quarantined',updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSIF p_action='release_quarantine' THEN
    IF v_role<>'super_admin' THEN RETURN jsonb_build_object('ok',false,'code','super_admin_required'); END IF;
    UPDATE public.lammah_import_candidates
    SET state='pending_review',decision_by=v_actor,decision_notes=p_notes,decided_at=now()
    WHERE id=p_candidate_id AND state='quarantined';
    UPDATE public.lammah_review_queue SET decision=NULL,updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSIF p_action='return' THEN
    UPDATE public.lammah_import_candidates
    SET state='returned_for_correction',decision_by=v_actor,decision_notes=p_notes,decided_at=now()
    WHERE id=p_candidate_id AND state='assigned';
    UPDATE public.lammah_review_queue SET decision='returned',updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSIF p_action='resubmit' THEN
    UPDATE public.lammah_import_candidates
    SET state='assigned',decision_notes=p_notes
    WHERE id=p_candidate_id AND state='returned_for_correction';
    UPDATE public.lammah_review_queue SET decision=NULL,updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSIF p_action='reject' THEN
    UPDATE public.lammah_import_candidates
    SET state='rejected',decision_by=v_actor,decision_notes=p_notes,decided_at=now()
    WHERE id=p_candidate_id AND state='assigned';
    UPDATE public.lammah_review_queue
    SET queue_state='closed',decision='rejected',closed_at=now(),updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSIF p_action='approve' THEN
    UPDATE public.lammah_candidate_facts
    SET review_state='accepted',reviewer_id=v_actor,reviewed_at=now(),updated_at=now()
    WHERE candidate_id=p_candidate_id AND active AND review_state='proposed';
    v_checklist := public.lammah_candidate_gate_checklist(p_candidate_id);
    IF NOT COALESCE((v_checklist->>'manual_eligible')::boolean,false) THEN
      RETURN jsonb_build_object('ok',false,'code','approval_gates_failed','checklist',v_checklist);
    END IF;
    UPDATE public.lammah_import_candidates
    SET state='approved',decision_by=v_actor,decision_notes=p_notes,decided_at=now(),
        auto_gate_checklist=v_checklist
    WHERE id=p_candidate_id AND state='assigned';
    UPDATE public.lammah_review_queue SET decision='approved',updated_at=now()
    WHERE candidate_id=p_candidate_id;
  ELSE
    RETURN jsonb_build_object('ok',false,'code','invalid_review_action');
  END IF;

  INSERT INTO public.lammah_lifecycle_events (
    candidate_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    p_candidate_id,'review_decided',v_actor,
    CASE WHEN v_role='super_admin' THEN 'super_admin' ELSE 'staff' END,
    p_notes,jsonb_build_object('action',p_action,'checklist',v_checklist)
  );
  RETURN jsonb_build_object('ok',true,'code',p_action,'checklist',v_checklist);
END
$function$;

CREATE FUNCTION public.publish_lammah_candidate(p_candidate_id uuid, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_role public.user_role_enum;
  v_assigned uuid;
BEGIN
  IF v_actor IS NULL OR NULLIF(btrim(p_notes),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','publish_actor_and_notes_required');
  END IF;
  v_role := public.current_user_role();
  SELECT assigned_to INTO v_assigned
  FROM public.lammah_import_candidates WHERE id=p_candidate_id;
  IF v_assigned IS DISTINCT FROM v_actor AND v_role<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','assigned_reviewer_required');
  END IF;
  RETURN public._publish_lammah_candidate(p_candidate_id,false,v_actor,p_notes);
END
$function$;

CREATE FUNCTION public.lammah_candidate_gate_checklist(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_candidate public.lammah_import_candidates%ROWTYPE;
  v_source public.lammah_sources%ROWTYPE;
  v_evidence public.lammah_raw_evidence%ROWTYPE;
  v_native_job_id uuid;
  v_source_approved boolean;
  v_source_record_current boolean;
  v_url_valid boolean;
  v_mandatory boolean;
  v_type_clear boolean;
  v_native_clear boolean;
  v_external_clear boolean;
  v_hostile_clear boolean;
  v_personal_clear boolean;
  v_ai_clear boolean;
  v_org_clear boolean;
  v_confidence_clear boolean;
  v_switches boolean;
  v_manual_eligible boolean;
  v_auto_eligible boolean;
BEGIN
  SELECT * INTO v_candidate
  FROM public.lammah_import_candidates WHERE id=p_candidate_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible',false,'code','candidate_not_found');
  END IF;
  SELECT * INTO v_source FROM public.lammah_sources WHERE id=v_candidate.source_id;
  SELECT * INTO v_evidence FROM public.lammah_raw_evidence WHERE id=v_candidate.evidence_id;

  v_source_approved := v_source.approval_state='approved'
    AND v_source.is_active AND v_source.robots_ok;
  v_source_record_current := v_evidence.retrieved_at > now()-interval '14 days'
    AND (v_candidate.source_deadline_at IS NULL OR v_candidate.source_deadline_at>now())
    AND v_candidate.state NOT IN (
      'quarantined','rejected','superseded_by_replay','suppressed_by_native'
    );
  v_url_valid := v_candidate.apply_url_validated_at IS NOT NULL
    AND v_candidate.apply_url_validated_at > now()-interval '14 days'
    AND public.lammah_host_allowed(v_candidate.final_apply_url,v_source.allowed_apply_hosts)
    AND COALESCE((v_candidate.url_validation_evidence->>'status_code')::integer,0)
        BETWEEN 200 AND 399;
  v_mandatory := NULLIF(btrim(v_candidate.source_record_id),'') IS NOT NULL
    AND COALESCE(NULLIF(btrim(v_candidate.title_ar),''),NULLIF(btrim(v_candidate.title_en),'')) IS NOT NULL
    AND NULLIF(btrim(v_candidate.organization_raw_name),'') IS NOT NULL
    AND v_candidate.opportunity_type IS NOT NULL
    AND NULLIF(btrim(v_candidate.final_apply_url),'') IS NOT NULL
    AND NULLIF(btrim(v_candidate.source_page_url),'') IS NOT NULL
    AND v_evidence.retrieved_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key='source_record_id'
    )
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key IN ('title.ar','title.en')
    )
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key='organization.raw_name'
    )
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key='opportunity.type'
    )
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key='url.apply'
    )
    AND EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.fact_key='url.source_page'
    );
  v_type_clear := NOT ('ambiguous_type'=ANY(v_candidate.review_flags));
  v_native_job_id := public.find_native_job_conflict(
    v_candidate.opportunity_type,v_candidate.resolved_company_id,
    v_candidate.title_ar,v_candidate.title_en,v_candidate.final_apply_url,
    v_candidate.location_region,v_candidate.experience_level
  );
  v_native_clear := v_native_job_id IS NULL;
  v_external_clear := v_candidate.match_outcome NOT IN ('duplicate_external','probable_duplicate')
    AND NOT ('duplicate_external'=ANY(v_candidate.review_flags));
  v_hostile_clear := NOT ('hostile_content'=ANY(v_candidate.review_flags));
  v_personal_clear := NOT ('personal_data_review'=ANY(v_candidate.review_flags));
  v_ai_clear := NOT ('unsupported_ai_localization'=ANY(v_candidate.review_flags))
    AND NOT EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.extraction_method IN ('ai_extraction','ai_localization')
        AND fact.review_state NOT IN ('accepted','edited')
    );
  v_org_clear := NOT ('organization_conflict'=ANY(v_candidate.review_flags));
  v_confidence_clear := NOT EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND fact.confidence < COALESCE(
          (v_source.confidence_policy->>'minimum_fact_confidence')::numeric,0.85
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.lammah_candidate_facts fact
      WHERE fact.candidate_id=v_candidate.id AND fact.active
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(
            COALESCE(v_source.confidence_policy->'allowed_methods','[]'::jsonb)
          ) method
          WHERE method.value=fact.extraction_method
        )
    );
  v_switches := v_source.auto_publication_enabled
    AND EXISTS (
      SELECT 1 FROM public.feature_flags
      WHERE key='lammah.phase1_ingestion' AND is_enabled
    )
    AND EXISTS (
      SELECT 1 FROM public.feature_flags
      WHERE key='lammah.auto_publication_enabled' AND is_enabled
    );

  v_manual_eligible := v_source_approved AND v_source_record_current
    AND v_url_valid AND v_mandatory AND v_type_clear AND v_native_clear
    AND v_external_clear AND v_hostile_clear AND v_personal_clear
    AND v_ai_clear AND v_org_clear AND v_confidence_clear;
  v_auto_eligible := v_manual_eligible AND v_switches;

  RETURN jsonb_build_object(
    'gate_01_source_approved_for_auto',v_source_approved AND v_source.auto_publication_enabled,
    'gate_02_source_record_current',v_source_record_current,
    'gate_03_official_apply_url_valid',v_url_valid,
    'gate_04_mandatory_fields_complete',v_mandatory,
    'gate_05_type_unambiguous',v_type_clear,
    'gate_06_no_native_job_match',v_native_clear,
    'gate_07_no_external_duplicate',v_external_clear,
    'gate_08_no_hostile_content',v_hostile_clear,
    'gate_09_no_personal_data_flag',v_personal_clear,
    'gate_10_no_unsupported_ai_localization',v_ai_clear,
    'gate_11_no_organization_conflict',v_org_clear,
    'gate_12_source_confidence_policy',v_confidence_clear,
    'gate_13_all_auto_switches_on',v_switches,
    'manual_eligible',v_manual_eligible,
    'eligible',v_auto_eligible,
    'native_job_id',v_native_job_id
  );
END
$function$;

CREATE FUNCTION public._publish_lammah_candidate(
  p_candidate_id uuid,
  p_auto boolean,
  p_actor uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  v_candidate public.lammah_import_candidates%ROWTYPE;
  v_evidence public.lammah_raw_evidence%ROWTYPE;
  v_checklist jsonb;
  v_opportunity public.lammah_opportunities%ROWTYPE;
  v_opportunity_id uuid;
  v_confidence numeric(3,2);
  v_translation text;
  v_event text;
  v_source_name text;
BEGIN
  SELECT * INTO v_candidate
  FROM public.lammah_import_candidates
  WHERE id=p_candidate_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_found');
  END IF;
  IF v_candidate.state='published' AND v_candidate.published_opportunity_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok',true,'code','already_published',
      'opportunity_id',v_candidate.published_opportunity_id
    );
  END IF;
  IF p_auto AND v_candidate.state <> 'auto_publish_eligible' THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_auto_eligible');
  END IF;
  IF NOT p_auto AND v_candidate.state <> 'approved' THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_approved');
  END IF;

  v_checklist := public.lammah_candidate_gate_checklist(v_candidate.id);
  IF (p_auto AND NOT COALESCE((v_checklist->>'eligible')::boolean,false))
     OR (NOT p_auto AND NOT COALESCE((v_checklist->>'manual_eligible')::boolean,false)) THEN
    RETURN jsonb_build_object('ok',false,'code','publication_gates_failed','checklist',v_checklist);
  END IF;

  SELECT * INTO v_evidence FROM public.lammah_raw_evidence WHERE id=v_candidate.evidence_id;
  SELECT name INTO v_source_name FROM public.lammah_sources WHERE id=v_candidate.source_id;
  SELECT COALESCE(avg(confidence),1)::numeric(3,2) INTO v_confidence
  FROM public.lammah_candidate_facts
  WHERE candidate_id=v_candidate.id AND active AND review_state<>'rejected';
  IF EXISTS (
    SELECT 1 FROM public.lammah_candidate_facts
    WHERE candidate_id=v_candidate.id AND active
      AND extraction_method='ai_localization' AND review_state IN ('accepted','edited')
  ) THEN
    v_translation := 'reviewed_ai_localization';
  END IF;

  SELECT opportunity.* INTO v_opportunity
  FROM public.lammah_source_links link
  JOIN public.lammah_opportunities opportunity ON opportunity.id=link.opportunity_id
  WHERE link.source_id=v_candidate.source_id
    AND link.source_record_id=v_candidate.source_record_id
  ORDER BY link.created_at DESC
  LIMIT 1
  FOR UPDATE OF opportunity;

  IF FOUND AND v_opportunity.status IN ('superseded','hidden') THEN
    RETURN jsonb_build_object(
      'ok',false,'code',
      CASE WHEN v_opportunity.status='superseded' THEN 'native_supersession_terminal' ELSE 'staff_unhide_required' END,
      'opportunity_id',v_opportunity.id
    );
  END IF;

  PERFORM public.lock_lammah_native_conflict(
    v_candidate.resolved_company_id,v_candidate.final_apply_url,
    encode(extensions.digest(v_candidate.source_id::text || ':' || v_candidate.source_record_id,'sha256'),'hex')
  );

  IF v_opportunity.id IS NULL THEN
    INSERT INTO public.lammah_opportunities (
      source_id,source_name,company_id,company_name_raw,title_ar,title_en,excerpt,sector,
      region,location_country,location_city,ownership_type,experience_level,opportunity_type,external_url,
      external_ref_hash,source_published_at,scraped_at,expires_at,status,
      extraction_confidence,first_retrieved_at,last_confirmed_at,
      source_removed_scan_count,publication_candidate_id,translation_attribution
    ) VALUES (
      v_candidate.source_id,v_source_name,v_candidate.resolved_company_id,
      v_candidate.organization_raw_name,v_candidate.title_ar,v_candidate.title_en,
      v_candidate.description_excerpt,v_candidate.sector,v_candidate.location_region,
      v_candidate.location_country,v_candidate.location_city,
      v_candidate.ownership_type,v_candidate.experience_level,v_candidate.opportunity_type,
      v_candidate.final_apply_url,
      encode(extensions.digest(v_candidate.source_id::text || ':' || v_candidate.source_record_id,'sha256'),'hex'),
      v_candidate.source_published_at,v_evidence.retrieved_at,
      v_candidate.source_deadline_at,'active',v_confidence,v_evidence.retrieved_at,
      v_evidence.retrieved_at,0,v_candidate.id,v_translation
    ) RETURNING * INTO v_opportunity;
  ELSE
    UPDATE public.lammah_opportunity_facts
    SET active=false,superseded_at=now()
    WHERE opportunity_id=v_opportunity.id AND active;

    UPDATE public.lammah_opportunities
    SET source_name=v_source_name,
        company_id=v_candidate.resolved_company_id,
        company_name_raw=v_candidate.organization_raw_name,
        title_ar=v_candidate.title_ar,title_en=v_candidate.title_en,
        excerpt=v_candidate.description_excerpt,sector=v_candidate.sector,
        region=v_candidate.location_region,
        location_country=v_candidate.location_country,location_city=v_candidate.location_city,
        ownership_type=v_candidate.ownership_type,
        experience_level=v_candidate.experience_level,
        opportunity_type=v_candidate.opportunity_type,
        external_url=v_candidate.final_apply_url,
        source_published_at=v_candidate.source_published_at,
        scraped_at=v_evidence.retrieved_at,expires_at=v_candidate.source_deadline_at,
        status='active',extraction_confidence=v_confidence,
        last_confirmed_at=v_evidence.retrieved_at,source_removed_scan_count=0,
        publication_candidate_id=v_candidate.id,translation_attribution=v_translation,
        hidden_by=NULL,hidden_reason=NULL
    WHERE id=v_opportunity.id
    RETURNING * INTO v_opportunity;
  END IF;

  v_opportunity_id := v_opportunity.id;
  IF v_opportunity.status='superseded' THEN
    UPDATE public.lammah_import_candidates
    SET state='suppressed_by_native',decision_notes='Native precedence at publication',
        decided_at=now(),auto_gate_checklist=v_checklist
    WHERE id=v_candidate.id;
    INSERT INTO public.lammah_native_match_events (
      candidate_id,native_job_id,outcome,reasons,deterministic
    ) VALUES (
      v_candidate.id,v_opportunity.superseded_by_job_id,'suppressed',
      jsonb_build_array(jsonb_build_object('kind','native_race_at_publication')),true
    );
    RETURN jsonb_build_object(
      'ok',false,'code','suppressed_by_native',
      'native_job_id',v_opportunity.superseded_by_job_id
    );
  END IF;

  INSERT INTO public.lammah_opportunity_facts (
    opportunity_id,candidate_id,candidate_fact_id,fact_key,published_value,
    provenance_snapshot
  )
  SELECT
    v_opportunity_id,v_candidate.id,fact.id,fact.fact_key,
    COALESCE(fact.reviewer_edit->'normalized_value',fact.normalized_value,fact.original_value),
    jsonb_build_object(
      'source_id',fact.source_id,'source_record_id',fact.source_record_id,
      'source_url',fact.source_url,'retrieved_at',fact.retrieved_at,
      'evidence_id',fact.evidence_id,'evidence_checksum',v_evidence.checksum_sha256,
      'extraction_method',fact.extraction_method,
      'parser_model_version',fact.parser_model_version,
      'transformation_history',fact.transformation_history,
      'confidence',fact.confidence,'review_state',fact.review_state,
      'reviewer_id',fact.reviewer_id
    )
  FROM public.lammah_candidate_facts fact
  WHERE fact.candidate_id=v_candidate.id AND fact.active
    AND fact.review_state<>'rejected';

  INSERT INTO public.lammah_source_links (
    opportunity_id,source_id,candidate_id,source_record_id,source_page_url,
    final_apply_url,first_seen_at,last_seen_at,active
  ) VALUES (
    v_opportunity_id,v_candidate.source_id,v_candidate.id,
    v_candidate.source_record_id,v_candidate.source_page_url,
    v_candidate.final_apply_url,v_candidate.first_seen_at,v_candidate.last_seen_at,true
  );

  UPDATE public.lammah_import_candidates
  SET state='published',published_opportunity_id=v_opportunity_id,
      decision_by=COALESCE(p_actor,decision_by),decision_notes=COALESCE(p_notes,decision_notes),
      decided_at=now(),auto_gate_checklist=v_checklist
  WHERE id=v_candidate.id;
  UPDATE public.lammah_review_queue
  SET queue_state='closed',decision='published',closed_at=now()
  WHERE candidate_id=v_candidate.id;
  UPDATE public.lammah_sync_runs
  SET published_count=published_count+1,heartbeat_at=now()
  WHERE id=v_candidate.run_id;

  v_event := CASE WHEN p_auto THEN 'opportunity_auto_published' ELSE 'opportunity_published' END;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,candidate_id,opportunity_id,run_id,event_type,actor_id,
    actor_kind,reason,details
  ) VALUES (
    v_candidate.source_id,v_candidate.id,v_opportunity_id,v_candidate.run_id,
    v_event,p_actor,CASE WHEN p_auto THEN 'worker' ELSE 'staff' END,
    p_notes,jsonb_build_object('gate_checklist',v_checklist)
  );

  RETURN jsonb_build_object(
    'ok',true,'code',CASE WHEN p_auto THEN 'auto_published' ELSE 'published' END,
    'opportunity_id',v_opportunity_id,'checklist',v_checklist
  );
END
$function$;

CREATE FUNCTION public.lammah_try_auto_publish(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_candidate public.lammah_import_candidates%ROWTYPE;
  v_checklist jsonb;
BEGIN
  SELECT * INTO v_candidate
  FROM public.lammah_import_candidates WHERE id=p_candidate_id FOR UPDATE;
  IF NOT FOUND OR v_candidate.state<>'pending_review' THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_pending');
  END IF;

  v_checklist := public.lammah_candidate_gate_checklist(v_candidate.id);
  INSERT INTO public.lammah_lifecycle_events (
    source_id,candidate_id,run_id,event_type,actor_kind,details
  ) VALUES (
    v_candidate.source_id,v_candidate.id,v_candidate.run_id,
    'auto_publication_gates_evaluated','worker',
    jsonb_build_object('gate_checklist',v_checklist)
  );
  UPDATE public.lammah_import_candidates
  SET auto_gate_checklist=v_checklist
  WHERE id=v_candidate.id;

  IF NOT COALESCE((v_checklist->>'eligible')::boolean,false) THEN
    RETURN jsonb_build_object('ok',true,'code','routed_to_review','checklist',v_checklist);
  END IF;

  UPDATE public.lammah_import_candidates
  SET state='auto_publish_eligible'
  WHERE id=v_candidate.id;
  RETURN public._publish_lammah_candidate(v_candidate.id,true,NULL,'All 13 automatic-publication gates passed');
END
$function$;

CREATE FUNCTION public.ingest_lammah_candidate(p_run_id uuid, p_record jsonb)
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

  IF NOT public.lammah_host_allowed(v_source_url,ARRAY['europa.eu'])
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

RESET ROLE;

CREATE TRIGGER lammah_raw_evidence_transition_guard
  BEFORE UPDATE ON public.lammah_raw_evidence
  FOR EACH ROW EXECUTE FUNCTION public._lammah_guard_transition();
CREATE TRIGGER lammah_import_candidates_transition_guard
  BEFORE UPDATE ON public.lammah_import_candidates
  FOR EACH ROW EXECUTE FUNCTION public._lammah_guard_transition();

-- ---------------------------------------------------------------------------
-- Restricted helpers
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.lammah_url_host(p_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $function$
  SELECT lower(regexp_replace((regexp_match(btrim(COALESCE(p_url,'')), '^https://([^/?#]+)', 'i'))[1], '^www\.', '', 'i'))
$function$;

CREATE FUNCTION public.lammah_host_allowed(p_url text, p_allowed_hosts text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $function$
  SELECT COALESCE(
    public.lammah_url_host(p_url) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p_allowed_hosts, '{}'::text[])) AS allowed(host)
      WHERE public.lammah_url_host(p_url) = lower(allowed.host)
         OR public.lammah_url_host(p_url) LIKE '%.' || lower(allowed.host)
    ),
    false
  )
$function$;

CREATE FUNCTION public.lammah_staff_actor()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
BEGIN
  IF v_actor IS NULL OR public.current_user_role() NOT IN ('staff','super_admin') THEN
    RETURN NULL;
  END IF;
  RETURN v_actor;
END
$function$;

CREATE FUNCTION public.lammah_begin_run(
  p_external_run_id text,
  p_mode text DEFAULT 'incremental',
  p_worker_identity text DEFAULT 'lammah_worker_eu_careers'
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
  IF NULLIF(btrim(p_external_run_id),'') IS NULL OR char_length(p_external_run_id) > 160
     OR p_mode NOT IN ('full','incremental','retry','revalidation')
     OR NULLIF(btrim(p_worker_identity),'') IS NULL OR char_length(p_worker_identity) > 160 THEN
    RETURN jsonb_build_object('ok',false,'code','invalid_run_request');
  END IF;

  SELECT * INTO v_source
  FROM public.lammah_sources
  WHERE source_key = 'eu_careers_cast'
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
      jsonb_build_object('external_run_id',left(p_external_run_id,160))
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
    jsonb_build_object('mode',p_mode,'external_run_id',p_external_run_id)
  );

  RETURN jsonb_build_object(
    'ok',true,
    'run_id',v_run_id,
    'source_id',v_source.id,
    'source_url',v_source.base_url,
    'parser_version',v_source.parser_version,
    'allowed_apply_hosts',v_source.allowed_apply_hosts,
    'rate_limit_policy',v_source.rate_limit_policy
  );
END
$function$;

-- Preserve the shipped native Jobs precedence function as the sole native
-- supersession authority, adding only immutable domain evidence for each row.
CREATE FUNCTION public.redrive_lammah_dead_letter(p_dead_letter_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_letter public.lammah_dead_letters%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','reason_required');
  END IF;
  UPDATE public.lammah_dead_letters
  SET attempts=LEAST(attempts+1,3),
      retry_state=CASE WHEN attempts>=2 THEN 'not_retryable' ELSE 'redriven' END,
      next_retry_at=CASE WHEN attempts>=2 THEN NULL ELSE now() END,
      closed_reason=CASE WHEN attempts>=2 THEN 'retry limit reached: ' || p_reason ELSE NULL END,
      updated_at=now()
  WHERE id=p_dead_letter_id AND retry_state IN ('open','not_retryable')
  RETURNING * INTO v_letter;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','dead_letter_not_redrivable'); END IF;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,run_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    v_letter.source_id,v_letter.run_id,'dead_letter_redrive_requested',v_actor,
    'super_admin',p_reason,jsonb_build_object('dead_letter_id',v_letter.id,'attempts',v_letter.attempts)
  );
  RETURN jsonb_build_object('ok',true,'code',v_letter.retry_state,'attempts',v_letter.attempts);
END
$function$;

CREATE FUNCTION public.close_lammah_dead_letter(p_dead_letter_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_letter public.lammah_dead_letters%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'code','reason_required'); END IF;
  UPDATE public.lammah_dead_letters
  SET retry_state='closed',closed_reason=p_reason,next_retry_at=NULL,updated_at=now()
  WHERE id=p_dead_letter_id AND retry_state<>'closed'
  RETURNING * INTO v_letter;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','dead_letter_not_closeable'); END IF;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,run_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    v_letter.source_id,v_letter.run_id,'dead_letter_closed',v_actor,'super_admin',
    p_reason,jsonb_build_object('dead_letter_id',v_letter.id)
  );
  RETURN jsonb_build_object('ok',true,'code','closed');
END
$function$;

CREATE FUNCTION public.set_lammah_evidence_legal_hold(
  p_evidence_id uuid,p_enabled boolean,p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
  v_source_id uuid;
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'code','reason_required'); END IF;
  UPDATE public.lammah_raw_evidence
  SET legal_hold=p_enabled,legal_hold_reason=CASE WHEN p_enabled THEN p_reason ELSE NULL END
  WHERE id=p_evidence_id RETURNING source_id INTO v_source_id;
  IF v_source_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','evidence_not_found'); END IF;
  INSERT INTO public.lammah_lifecycle_events (
    source_id,event_type,actor_id,actor_kind,reason,details
  ) VALUES (
    v_source_id,'evidence_legal_hold_changed',v_actor,'super_admin',p_reason,
    jsonb_build_object('evidence_id',p_evidence_id,'enabled',p_enabled)
  );
  RETURN jsonb_build_object('ok',true,'code','legal_hold_changed');
END
$function$;

CREATE FUNCTION public.run_lammah_retention_now(p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := public.lammah_staff_actor();
BEGIN
  IF v_actor IS NULL OR public.current_user_role()<>'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','super_admin_required');
  END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'code','reason_required'); END IF;
  RETURN public.execute_lammah_retention() || jsonb_build_object('requested_by',v_actor,'reason',p_reason);
END
$function$;

CREATE OR REPLACE FUNCTION public.supersede_lammah_on_native_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_job_region text;
  v_match record;
BEGIN
  IF NEW.status IN ('published','closing_soon') THEN
    SELECT region.slug INTO v_job_region FROM public.regions region WHERE region.id=NEW.region_id;
    FOR v_match IN
      UPDATE public.lammah_opportunities opportunity
      SET status='superseded',superseded_by_job_id=NEW.id
      WHERE opportunity.status IN ('active','hidden')
        AND public.lammah_native_opportunity_matches(
          opportunity.opportunity_type,opportunity.company_id,
          opportunity.title_ar,opportunity.title_en,opportunity.external_url,
          opportunity.region,opportunity.experience_level,
          NEW.company_id,NEW.title_ar,NEW.title_en,NEW.external_apply_url,
          v_job_region,NEW.experience_level
        )
      RETURNING opportunity.id,opportunity.source_id
    LOOP
      INSERT INTO public.lammah_native_match_events (
        opportunity_id,native_job_id,outcome,reasons,deterministic
      ) VALUES (
        v_match.id,NEW.id,'superseded',
        jsonb_build_array(jsonb_build_object('kind','shipped_native_matcher')),true
      );
      INSERT INTO public.lammah_lifecycle_events (
        source_id,opportunity_id,event_type,actor_kind,reason,details
      ) VALUES (
        v_match.source_id,v_match.id,'opportunity_superseded','system',
        'native_job_precedence',jsonb_build_object('native_job_id',NEW.id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END
$function$;

-- The signature remains present for compatibility, but direct published-row
-- intake is closed. Publication now requires a governed candidate decision.
CREATE OR REPLACE FUNCTION public.ingest_lammah_opportunity(p jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  PERFORM p;
  RAISE EXCEPTION 'lammah_governed_candidate_publication_required';
END
$function$;

-- ---------------------------------------------------------------------------
-- Grants, ownership, and schedules
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.lammah_url_host(text) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.lammah_host_allowed(text,text[]) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.lammah_staff_actor() FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.lammah_candidate_gate_checklist(uuid) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public._publish_lammah_candidate(uuid,boolean,uuid,text) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.lammah_try_auto_publish(uuid) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.ingest_lammah_opportunity(jsonb) FROM PUBLIC,anon,authenticated,service_role,lammah_worker;
REVOKE ALL ON FUNCTION public.expire_stale_lammah_opportunities() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.purge_expired_lammah() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.execute_lammah_retention() FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.lammah_begin_run(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.ingest_lammah_candidate(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.lammah_finish_run(uuid,text,integer,integer,integer,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.record_lammah_dead_letter(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.lammah_begin_run(text,text,text) TO lammah_worker;
GRANT EXECUTE ON FUNCTION public.ingest_lammah_candidate(uuid,jsonb) TO lammah_worker;
GRANT EXECUTE ON FUNCTION public.lammah_finish_run(uuid,text,integer,integer,integer,jsonb,text,text) TO lammah_worker;
GRANT EXECUTE ON FUNCTION public.record_lammah_dead_letter(uuid,text,text,jsonb) TO lammah_worker;

REVOKE ALL ON FUNCTION public.claim_lammah_candidate(uuid) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.release_lammah_candidate(uuid,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.review_lammah_fact(uuid,text,jsonb,text,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.review_lammah_candidate(uuid,text,text,public.lammah_opportunity_type_enum,uuid) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.publish_lammah_candidate(uuid,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.report_lammah_problem(uuid,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.transition_lammah_opportunity(uuid,text,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.configure_lammah_phase1(boolean,boolean,boolean,boolean,boolean,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.redrive_lammah_dead_letter(uuid,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.close_lammah_dead_letter(uuid,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.set_lammah_evidence_legal_hold(uuid,boolean,text) FROM PUBLIC,anon,service_role;
REVOKE ALL ON FUNCTION public.run_lammah_retention_now(text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.claim_lammah_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_lammah_candidate(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_lammah_fact(uuid,text,jsonb,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_lammah_candidate(uuid,text,text,public.lammah_opportunity_type_enum,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_lammah_candidate(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_lammah_problem(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_lammah_opportunity(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.configure_lammah_phase1(boolean,boolean,boolean,boolean,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redrive_lammah_dead_letter(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_lammah_dead_letter(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_lammah_evidence_legal_hold(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_lammah_retention_now(text) TO authenticated;

ALTER FUNCTION public.lammah_url_host(text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_host_allowed(text,text[]) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_staff_actor() OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_begin_run(text,text,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.ingest_lammah_candidate(uuid,jsonb) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_finish_run(uuid,text,integer,integer,integer,jsonb,text,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.record_lammah_dead_letter(uuid,text,text,jsonb) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_candidate_gate_checklist(uuid) OWNER TO lammah_function_owner;
ALTER FUNCTION public._publish_lammah_candidate(uuid,boolean,uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.lammah_try_auto_publish(uuid) OWNER TO lammah_function_owner;
ALTER FUNCTION public.claim_lammah_candidate(uuid) OWNER TO lammah_function_owner;
ALTER FUNCTION public.release_lammah_candidate(uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.review_lammah_fact(uuid,text,jsonb,text,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.review_lammah_candidate(uuid,text,text,public.lammah_opportunity_type_enum,uuid) OWNER TO lammah_function_owner;
ALTER FUNCTION public.publish_lammah_candidate(uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.report_lammah_problem(uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.transition_lammah_opportunity(uuid,text,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.configure_lammah_phase1(boolean,boolean,boolean,boolean,boolean,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.redrive_lammah_dead_letter(uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.close_lammah_dead_letter(uuid,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.set_lammah_evidence_legal_hold(uuid,boolean,text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.run_lammah_retention_now(text) OWNER TO lammah_function_owner;
ALTER FUNCTION public.expire_stale_lammah_opportunities() OWNER TO lammah_function_owner;
ALTER FUNCTION public.purge_expired_lammah() OWNER TO lammah_function_owner;
ALTER FUNCTION public.execute_lammah_retention() OWNER TO lammah_function_owner;
ALTER FUNCTION public.supersede_lammah_on_native_post() OWNER TO lammah_function_owner;
ALTER FUNCTION public.ingest_lammah_opportunity(jsonb) OWNER TO lammah_function_owner;

DO $unschedule$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('lammah-crawler','purge-lammah','lammah-expiry-transition','lammah-evidence-retention')
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END
$unschedule$;

SELECT cron.schedule(
  'lammah-expiry-transition','15 * * * *',
  $cron$SELECT public.expire_stale_lammah_opportunities();$cron$
);
SELECT cron.schedule(
  'lammah-evidence-retention','35 2 * * *',
  $cron$SELECT public.execute_lammah_retention();$cron$
);

REVOKE CREATE ON SCHEMA public FROM lammah_function_owner;
REVOKE lammah_function_owner FROM postgres;

NOTIFY pgrst, 'reload schema';

COMMIT;
