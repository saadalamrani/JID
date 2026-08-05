-- Postgres-owned wrappers so nonprod staff JWTs work under PostgREST claim shape.
-- Original catalog_function_owner RPCs remain for ownership; wrappers use auth.uid().

CREATE OR REPLACE FUNCTION public.catalog_claim_review_item(p_review_queue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role public.user_role_enum;
  v_assigned uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'catalog_authentication_required'; END IF;
  v_role := public.current_user_role();
  IF v_role NOT IN ('staff','super_admin') THEN
    RETURN jsonb_build_object('ok',false,'code','catalog_review_forbidden');
  END IF;
  SELECT assigned_to INTO v_assigned
  FROM public.directory_review_queue
  WHERE id=p_review_queue_id AND status IN ('pending','in_review','returned');
  IF v_assigned IS NOT NULL AND v_assigned<>v_actor AND v_role<>'super_admin' THEN
    RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',true);
  END IF;
  UPDATE public.directory_review_queue SET
    assigned_to=COALESCE(assigned_to,v_actor),
    assigned_at=COALESCE(assigned_at,now()),
    status=CASE WHEN status IN ('pending','returned') THEN 'in_review' ELSE status END
  WHERE id=p_review_queue_id AND status IN ('pending','in_review','returned')
  RETURNING assigned_to INTO v_assigned;
  IF v_assigned IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','queue_item_not_claimable');
  END IF;
  RETURN jsonb_build_object('ok',true,'assigned_to',v_assigned,'view_only',v_assigned<>v_actor);
END;
$$;

CREATE OR REPLACE FUNCTION public.catalog_review_pending_domain(p_review_queue_id uuid, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_role public.user_role_enum;
  v_queue public.directory_review_queue%ROWTYPE;
  v_candidate public.directory_import_candidates%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'catalog_authentication_required'; END IF;
  v_role := public.current_user_role();
  IF v_role NOT IN ('staff','super_admin') THEN
    RETURN jsonb_build_object('ok',false,'code','catalog_review_forbidden');
  END IF;
  IF NULLIF(btrim(p_notes),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','review_notes_required');
  END IF;

  SELECT * INTO v_queue FROM public.directory_review_queue WHERE id=p_review_queue_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','queue_item_not_found'); END IF;
  IF v_queue.assigned_to IS DISTINCT FROM v_actor AND v_role <> 'super_admin' THEN
    RETURN jsonb_build_object('ok',false,'code','assigned_reviewer_required');
  END IF;

  SELECT * INTO v_candidate FROM public.directory_import_candidates WHERE id=v_queue.candidate_id FOR UPDATE;
  IF NOT FOUND OR v_candidate.state <> 'needs_review' THEN
    RETURN jsonb_build_object('ok',false,'code','candidate_not_reviewable');
  END IF;
  IF v_candidate.match_outcome IN ('ambiguous','duplicate_candidate','quarantined')
     OR v_candidate.review_flags && ARRAY['domain_conflict','personal_data_review','inactive_entity','ambiguous_match']::text[] THEN
    RETURN jsonb_build_object('ok',false,'code','blocking_review_flag');
  END IF;
  IF COALESCE(v_candidate.source_entity_status,'') <> 'ACTIVE' THEN
    RETURN jsonb_build_object('ok',false,'code','entity_not_active');
  END IF;

  UPDATE public.directory_import_candidates
  SET state='approved_pending_domain',
      review_flags=array_append(array_remove(review_flags,'no_domain'),'no_domain'),
      terminal_reason=NULL
  WHERE id=v_candidate.id;

  UPDATE public.directory_review_queue
  SET status='approved_pending_domain',
      reviewer_id=v_actor,
      decision='approve_pending_domain',
      review_notes=p_notes,
      decided_at=now()
  WHERE id=v_queue.id;

  PERFORM public._write_audit_log(
    v_actor,
    'catalog.review_approve_pending_domain',
    'directory_review_queue',
    v_queue.id,
    NULL,
    jsonb_build_object('status','approved_pending_domain'),
    jsonb_build_object('candidate_id',v_candidate.id,'lei',v_candidate.lei)
  );

  RETURN jsonb_build_object('ok',true,'code','approve_pending_domain');
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_claim_review_item(uuid) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.catalog_review_pending_domain(uuid,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.catalog_claim_review_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_review_pending_domain(uuid,text) TO authenticated;
