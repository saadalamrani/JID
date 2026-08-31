-- Wave 7 corrective: immutable consent/provenance, deep payload guard, least privilege.
CREATE POLICY assessment_methods_candidate_notice_read ON public.assessment_methods FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.assessment_assignments a WHERE a.method_id=assessment_methods.id AND a.candidate_id=auth.uid()));

ALTER TABLE public.assessment_assignments ADD COLUMN provider_id_snapshot uuid REFERENCES public.assessment_providers(id) ON DELETE RESTRICT,
ADD COLUMN method_snapshot public.assessment_method_enum, ADD COLUMN disclosure_snapshot jsonb;

CREATE FUNCTION public.freeze_assessment_assignment_disclosure() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_m public.assessment_methods%ROWTYPE; v_p public.assessment_providers%ROWTYPE; v_terms text;
BEGIN SELECT * INTO v_m FROM public.assessment_methods WHERE id=NEW.method_id; SELECT * INTO v_p FROM public.assessment_providers WHERE id=v_m.provider_id;
v_terms:='assessment-method:'||v_m.id::text||':'||extract(epoch from v_m.updated_at)::bigint::text;
NEW.provider_id_snapshot:=v_p.id; NEW.method_snapshot:=v_m.method;
NEW.disclosure_snapshot:=jsonb_build_object('title_ar',v_m.title_ar,'title_en',v_m.title_en,'purpose_ar',v_m.purpose_ar,'purpose_en',v_m.purpose_en,'evidence_notice_ar',v_m.evidence_notice_ar,'evidence_notice_en',v_m.evidence_notice_en,'requires_consent',v_m.requires_consent,'terms_ref',v_terms,'provider_id',v_p.id,'provider_name_ar',v_p.name_ar,'provider_name_en',v_p.name_en,'provider_kind',v_p.kind,'requester_id',NEW.requested_by); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.freeze_assessment_assignment_disclosure() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assessment_assignment_freeze_disclosure BEFORE INSERT ON public.assessment_assignments FOR EACH ROW EXECUTE FUNCTION public.freeze_assessment_assignment_disclosure();

CREATE FUNCTION public.guard_assessment_assignment_sensitive_transition() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_catalog AS $$
BEGIN IF NEW.method_id IS DISTINCT FROM OLD.method_id OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id OR NEW.provider_id_snapshot IS DISTINCT FROM OLD.provider_id_snapshot OR NEW.method_snapshot IS DISTINCT FROM OLD.method_snapshot OR NEW.disclosure_snapshot IS DISTINCT FROM OLD.disclosure_snapshot THEN RAISE EXCEPTION 'assignment disclosure and provenance are immutable'; END IF;
IF NEW.consented_at IS DISTINCT FROM OLD.consented_at AND NEW.consent_terms_ref IS DISTINCT FROM (OLD.disclosure_snapshot->>'terms_ref') THEN RAISE EXCEPTION 'consent terms do not match the disclosed assignment'; END IF;
IF NEW.recording_ref IS DISTINCT FROM OLD.recording_ref AND NEW.state<>'completed' THEN RAISE EXCEPTION 'recording reference is accepted only on completion'; END IF; RETURN NEW; END $$;
CREATE TRIGGER assessment_assignment_sensitive_transition BEFORE UPDATE ON public.assessment_assignments FOR EACH ROW EXECUTE FUNCTION public.guard_assessment_assignment_sensitive_transition();

CREATE FUNCTION public.guard_assessment_method_after_assignment() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_catalog AS $$
BEGIN IF EXISTS(SELECT 1 FROM public.assessment_assignments a WHERE a.method_id=OLD.id) THEN RAISE EXCEPTION 'an assigned assessment method is immutable; retire it and create a new method'; END IF; RETURN COALESCE(NEW,OLD); END $$;
CREATE TRIGGER assessment_method_assigned_immutable BEFORE UPDATE OR DELETE ON public.assessment_methods FOR EACH ROW EXECUTE FUNCTION public.guard_assessment_method_after_assignment();

CREATE FUNCTION public.assessment_payload_has_forbidden_key(p_value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_catalog AS $$
DECLARE v_key text; v_child jsonb; BEGIN IF jsonb_typeof(p_value)='object' THEN FOR v_key,v_child IN SELECT key,value FROM jsonb_each(p_value) LOOP IF lower(v_key)=ANY(ARRAY['hiring_outcome','recommended_outcome','candidate_rank','match_percentage','culture_fit_score','personality_score','emotion_score','facial_score','voice_personality_score']) OR public.assessment_payload_has_forbidden_key(v_child) THEN RETURN true; END IF; END LOOP; ELSIF jsonb_typeof(p_value)='array' THEN FOR v_child IN SELECT value FROM jsonb_array_elements(p_value) LOOP IF public.assessment_payload_has_forbidden_key(v_child) THEN RETURN true; END IF; END LOOP; END IF; RETURN false; END $$;
REVOKE ALL ON FUNCTION public.assessment_payload_has_forbidden_key(jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ingest_assessment_result(p_assignment_id uuid,p_criterion_id uuid,p_payload jsonb,p_summary_ar text,p_summary_en text,p_limitations jsonb,p_provenance_ref text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_a public.assessment_assignments%ROWTYPE; v_result uuid; v_obs uuid; BEGIN SELECT * INTO v_a FROM public.assessment_assignments WHERE id=p_assignment_id;
IF v_a.id IS NULL OR v_a.state<>'completed' OR NOT public.can_access_hiring_workspace(public.hiring_application_business_profile(v_a.application_id),true) THEN RAISE EXCEPTION 'completed assignment not found' USING ERRCODE='insufficient_privilege'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.hiring_criteria c JOIN public.applications a ON a.hiring_role_id=c.hiring_role_id WHERE c.id=p_criterion_id AND a.id=v_a.application_id) THEN RAISE EXCEPTION 'criterion does not belong to the assessment role'; END IF;
IF jsonb_typeof(p_payload)<>'object' OR p_payload='{}'::jsonb OR public.assessment_payload_has_forbidden_key(p_payload) THEN RAISE EXCEPTION 'result payload is empty or contains a forbidden outcome, rank, or inference field'; END IF;
IF nullif(btrim(coalesce(p_provenance_ref,'')),'') IS NULL THEN RAISE EXCEPTION 'result provenance is required'; END IF;
INSERT INTO public.hiring_observations(source,source_table,source_id,application_id,criterion_id,method,evaluator_id,stage_id,evidence_found,note_ar,note_en,citations) VALUES(CASE WHEN v_a.method_snapshot='structured_interview' THEN 'interview_session'::public.hiring_observation_source_enum WHEN v_a.method_snapshot='work_sample' THEN 'work_sample'::public.hiring_observation_source_enum WHEN v_a.method_snapshot='structured_screening' THEN 'structured_screening'::public.hiring_observation_source_enum ELSE 'reference_check'::public.hiring_observation_source_enum END,'assessment_results',gen_random_uuid(),v_a.application_id,p_criterion_id,v_a.method_snapshot,auth.uid(),v_a.stage_id,true,p_summary_ar,p_summary_en,'[]') RETURNING id INTO v_obs;
INSERT INTO public.assessment_results(assignment_id,provider_id,criterion_id,payload,summary_ar,summary_en,limitations,provenance_ref,ingested_by,observation_id) VALUES(p_assignment_id,v_a.provider_id_snapshot,p_criterion_id,p_payload,p_summary_ar,p_summary_en,coalesce(p_limitations,'[]'),p_provenance_ref,auth.uid(),v_obs) RETURNING id INTO v_result; UPDATE public.hiring_observations SET source_id=v_result WHERE id=v_obs;
INSERT INTO public.hiring_evidence_attachments(application_id,criterion_id,stage_id,evidence_kind,evidence_record_id,candidate_visible,recorded_by) VALUES(v_a.application_id,p_criterion_id,v_a.stage_id,'assessment_result',v_result,false,auth.uid()); PERFORM public._write_audit_log(auth.uid(),'assessment.result_ingested','assessment_results',v_result,NULL,jsonb_build_object('assignment_id',p_assignment_id,'observation_id',v_obs,'sets_hiring_outcome',false)); RETURN v_result; END $$;

REVOKE SELECT ON public.assessment_providers FROM authenticated;
GRANT SELECT(id,code,name_ar,name_en,kind,active,capability_types,failure_state) ON public.assessment_providers TO authenticated;
REVOKE SELECT ON public.assessment_assignments FROM authenticated;
GRANT SELECT(id,method_id,application_id,stage_id,candidate_id,state,attempt_number,retry_of_assignment_id,requested_by,invited_at,expires_at,consented_at,consent_terms_ref,started_at,completed_at,withdrawn_at,failure_code,updated_at,provider_id_snapshot,method_snapshot,disclosure_snapshot) ON public.assessment_assignments TO authenticated;
NOTIFY pgrst,'reload schema';
