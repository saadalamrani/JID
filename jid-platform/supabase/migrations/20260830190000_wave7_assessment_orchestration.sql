-- Wave 7: governed assessment orchestration (forward-only, additive).
-- Provider results are purpose-bound evidence. They never set an application outcome.

CREATE TYPE public.assessment_provider_kind_enum AS ENUM
  ('internal', 'external', 'recorded_interview');
CREATE TYPE public.assessment_assignment_state_enum AS ENUM
  ('invited', 'ready', 'started', 'completed', 'expired', 'withdrawn',
   'cancelled', 'technical_failure', 'provider_failure');

CREATE TABLE public.assessment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$'),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  kind public.assessment_provider_kind_enum NOT NULL,
  active boolean NOT NULL DEFAULT true,
  capability_types public.assessment_method_enum[] NOT NULL,
  configuration_boundary jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_state text NOT NULL DEFAULT 'operational'
    CHECK (failure_state IN ('operational', 'degraded', 'unavailable')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT (configuration_boundary ?| ARRAY['secret','api_key','token','password']))
);

CREATE TABLE public.assessment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.assessment_providers(id) ON DELETE RESTRICT,
  method public.assessment_method_enum NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  purpose_ar text NOT NULL,
  purpose_en text NOT NULL,
  evidence_notice_ar text NOT NULL,
  evidence_notice_en text NOT NULL,
  requires_consent boolean NOT NULL DEFAULT true,
  expires_after_hours integer CHECK (expires_after_hours IS NULL OR expires_after_hours > 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessment_methods_role_idx ON public.assessment_methods(hiring_role_id);

CREATE TABLE public.assessment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id uuid NOT NULL REFERENCES public.assessment_methods(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE SET NULL,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  state public.assessment_assignment_state_enum NOT NULL DEFAULT 'invited',
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  retry_of_assignment_id uuid REFERENCES public.assessment_assignments(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  consented_at timestamptz,
  consent_terms_ref text,
  started_at timestamptz,
  completed_at timestamptz,
  withdrawn_at timestamptz,
  provider_session_ref text,
  recording_ref text,
  failure_code text,
  failure_detail text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (method_id, application_id, attempt_number),
  CHECK (state <> 'completed' OR completed_at IS NOT NULL),
  CHECK (state <> 'started' OR started_at IS NOT NULL),
  CHECK (state NOT IN ('technical_failure','provider_failure') OR failure_code IS NOT NULL)
);
CREATE INDEX assessment_assignments_application_idx ON public.assessment_assignments(application_id);
CREATE INDEX assessment_assignments_candidate_idx ON public.assessment_assignments(candidate_id, invited_at DESC);

CREATE TABLE public.assessment_assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assessment_assignments(id) ON DELETE CASCADE,
  from_state public.assessment_assignment_state_enum,
  to_state public.assessment_assignment_state_enum NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text,
  provider_event_ref text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES public.assessment_assignments(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.assessment_providers(id) ON DELETE RESTRICT,
  criterion_id uuid NOT NULL REFERENCES public.hiring_criteria(id) ON DELETE RESTRICT,
  payload jsonb NOT NULL,
  summary_ar text,
  summary_en text,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance_ref text NOT NULL,
  ingested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  observation_id uuid UNIQUE REFERENCES public.hiring_observations(id) ON DELETE RESTRICT,
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK (jsonb_typeof(limitations) = 'array'),
  CHECK (NOT (payload ?| ARRAY['hiring_outcome','recommended_outcome','candidate_rank','match_percentage','culture_fit_score','personality_score','emotion_score','facial_score','voice_personality_score']))
);

ALTER TABLE public.assessment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_providers_employer_read ON public.assessment_providers FOR SELECT TO authenticated
  USING (active OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('staff','super_admin')));
CREATE POLICY assessment_providers_staff_write ON public.assessment_providers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('staff','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('staff','super_admin')));
CREATE POLICY assessment_methods_workspace_read ON public.assessment_methods FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(public.hiring_role_business_profile(hiring_role_id), false));
CREATE POLICY assessment_methods_workspace_write ON public.assessment_methods FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(public.hiring_role_business_profile(hiring_role_id), true))
  WITH CHECK (public.can_access_hiring_workspace(public.hiring_role_business_profile(hiring_role_id), true));
CREATE POLICY assessment_assignments_employer_read ON public.assessment_assignments FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(public.hiring_application_business_profile(application_id), false));
CREATE POLICY assessment_assignments_candidate_read ON public.assessment_assignments FOR SELECT TO authenticated
  USING (candidate_id = auth.uid());
CREATE POLICY assessment_events_employer_read ON public.assessment_assignment_events FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(public.hiring_application_business_profile(
    (SELECT a.application_id FROM public.assessment_assignments a WHERE a.id=assignment_id)), false));
CREATE POLICY assessment_events_candidate_read ON public.assessment_assignment_events FOR SELECT TO authenticated
  USING ((SELECT a.candidate_id FROM public.assessment_assignments a WHERE a.id=assignment_id) = auth.uid());
CREATE POLICY assessment_results_employer_read ON public.assessment_results FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(public.hiring_application_business_profile(
    (SELECT a.application_id FROM public.assessment_assignments a WHERE a.id=assignment_id)), false));

CREATE OR REPLACE FUNCTION public.assign_assessment(p_method_id uuid, p_application_id uuid, p_stage_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_method public.assessment_methods%ROWTYPE; v_app public.applications%ROWTYPE;
  v_provider public.assessment_providers%ROWTYPE; v_id uuid; v_exp timestamptz;
BEGIN
  SELECT * INTO v_method FROM public.assessment_methods WHERE id=p_method_id AND active;
  SELECT * INTO v_app FROM public.applications WHERE id=p_application_id;
  IF v_method.id IS NULL OR v_app.id IS NULL OR v_method.hiring_role_id IS DISTINCT FROM v_app.hiring_role_id
     OR NOT public.can_access_hiring_workspace(public.hiring_application_business_profile(p_application_id), true) THEN
    RAISE EXCEPTION 'assessment method or application not found' USING ERRCODE='insufficient_privilege';
  END IF;
  IF v_app.outcome IS NOT NULL THEN RAISE EXCEPTION 'cannot assign an assessment to a closed application'; END IF;
  SELECT * INTO v_provider FROM public.assessment_providers WHERE id=v_method.provider_id;
  IF NOT v_provider.active OR v_provider.failure_state='unavailable' OR NOT (v_method.method=ANY(v_provider.capability_types)) THEN
    RAISE EXCEPTION 'assessment provider is unavailable or incompatible';
  END IF;
  IF p_stage_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.hiring_stages s WHERE s.id=p_stage_id AND s.hiring_role_id=v_app.hiring_role_id) THEN
    RAISE EXCEPTION 'stage does not belong to the application role';
  END IF;
  v_exp := CASE WHEN v_method.expires_after_hours IS NULL THEN NULL ELSE now() + make_interval(hours=>v_method.expires_after_hours) END;
  INSERT INTO public.assessment_assignments(method_id,application_id,stage_id,candidate_id,requested_by,expires_at)
  VALUES(p_method_id,p_application_id,p_stage_id,v_app.applicant_id,auth.uid(),v_exp) RETURNING id INTO v_id;
  INSERT INTO public.assessment_assignment_events(assignment_id,to_state,actor_user_id,reason) VALUES(v_id,'invited',auth.uid(),'assigned');
  PERFORM public._write_audit_log(auth.uid(),'assessment.assignment_created','assessment_assignments',v_id,NULL,
    jsonb_build_object('application_id',p_application_id,'method_id',p_method_id));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.transition_assessment_assignment(
  p_assignment_id uuid, p_action text, p_terms_ref text DEFAULT NULL,
  p_provider_session_ref text DEFAULT NULL, p_recording_ref text DEFAULT NULL,
  p_failure_code text DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_a public.assessment_assignments%ROWTYPE; v_m public.assessment_methods%ROWTYPE;
  v_p public.assessment_providers%ROWTYPE; v_next public.assessment_assignment_state_enum;
  v_candidate boolean; v_employer boolean;
BEGIN
  SELECT * INTO v_a FROM public.assessment_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'assignment not found' USING ERRCODE='insufficient_privilege'; END IF;
  SELECT * INTO v_m FROM public.assessment_methods WHERE id=v_a.method_id;
  SELECT * INTO v_p FROM public.assessment_providers WHERE id=v_m.provider_id;
  v_candidate := v_a.candidate_id=auth.uid();
  v_employer := public.can_access_hiring_workspace(public.hiring_application_business_profile(v_a.application_id), true);
  IF p_action='consent' AND v_candidate AND v_a.state='invited' THEN v_next:='ready';
  ELSIF p_action='start' AND v_candidate AND v_a.state='ready' THEN v_next:='started';
  ELSIF p_action='withdraw' AND v_candidate AND v_a.state IN ('invited','ready','started') THEN v_next:='withdrawn';
  ELSIF p_action='cancel' AND v_employer AND v_a.state IN ('invited','ready','started') THEN v_next:='cancelled';
  ELSIF p_action='complete' AND v_employer AND v_a.state='started' THEN v_next:='completed';
  ELSIF p_action='technical_failure' AND (v_candidate OR v_employer) AND v_a.state IN ('ready','started') THEN v_next:='technical_failure';
  ELSIF p_action='provider_failure' AND v_employer AND v_a.state IN ('invited','ready','started') THEN v_next:='provider_failure';
  ELSE RAISE EXCEPTION 'action is not allowed from the current state' USING ERRCODE='insufficient_privilege'; END IF;
  IF p_action='consent' AND v_m.requires_consent AND nullif(btrim(coalesce(p_terms_ref,'')),'') IS NULL THEN RAISE EXCEPTION 'consent terms reference is required'; END IF;
  IF v_p.kind='recorded_interview' AND p_action='complete' AND (p_provider_session_ref IS NULL OR p_recording_ref IS NULL) THEN RAISE EXCEPTION 'recorded interview completion requires session and recording references'; END IF;
  IF v_next IN ('technical_failure','provider_failure') AND nullif(btrim(coalesce(p_failure_code,'')),'') IS NULL THEN RAISE EXCEPTION 'failure code is required'; END IF;
  UPDATE public.assessment_assignments SET state=v_next, updated_at=now(),
    consented_at=CASE WHEN p_action='consent' THEN now() ELSE consented_at END,
    consent_terms_ref=CASE WHEN p_action='consent' THEN p_terms_ref ELSE consent_terms_ref END,
    started_at=CASE WHEN p_action='start' THEN now() ELSE started_at END,
    completed_at=CASE WHEN p_action='complete' THEN now() ELSE completed_at END,
    withdrawn_at=CASE WHEN p_action='withdraw' THEN now() ELSE withdrawn_at END,
    provider_session_ref=coalesce(p_provider_session_ref,provider_session_ref), recording_ref=coalesce(p_recording_ref,recording_ref),
    failure_code=CASE WHEN v_next IN ('technical_failure','provider_failure') THEN p_failure_code ELSE failure_code END,
    failure_detail=CASE WHEN v_next IN ('technical_failure','provider_failure') THEN p_reason ELSE failure_detail END
  WHERE id=p_assignment_id;
  INSERT INTO public.assessment_assignment_events(assignment_id,from_state,to_state,actor_user_id,reason)
  VALUES(p_assignment_id,v_a.state,v_next,auth.uid(),p_reason);
  PERFORM public._write_audit_log(auth.uid(),'assessment.assignment_'||p_action,'assessment_assignments',p_assignment_id,
    jsonb_build_object('state',v_a.state),jsonb_build_object('state',v_next,'failure_is_candidate_evidence',false));
  RETURN p_assignment_id;
END $$;

CREATE OR REPLACE FUNCTION public.retry_assessment_assignment(p_assignment_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_a public.assessment_assignments%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO v_a FROM public.assessment_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF NOT FOUND OR v_a.state NOT IN ('technical_failure','provider_failure') OR
     NOT public.can_access_hiring_workspace(public.hiring_application_business_profile(v_a.application_id), true) THEN
    RAISE EXCEPTION 'failed assignment not found' USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.assessment_assignments(method_id,application_id,stage_id,candidate_id,state,attempt_number,retry_of_assignment_id,requested_by,expires_at)
  SELECT method_id,application_id,stage_id,candidate_id,'invited',attempt_number+1,id,auth.uid(),expires_at FROM public.assessment_assignments WHERE id=p_assignment_id
  RETURNING id INTO v_id;
  INSERT INTO public.assessment_assignment_events(assignment_id,to_state,actor_user_id,reason) VALUES(v_id,'invited',auth.uid(),'retry');
  PERFORM public._write_audit_log(auth.uid(),'assessment.assignment_retried','assessment_assignments',v_id,NULL,
    jsonb_build_object('retry_of',p_assignment_id,'technical_failure_is_negative_evidence',false));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.ingest_assessment_result(
  p_assignment_id uuid, p_criterion_id uuid, p_payload jsonb, p_summary_ar text,
  p_summary_en text, p_limitations jsonb, p_provenance_ref text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_a public.assessment_assignments%ROWTYPE; v_m public.assessment_methods%ROWTYPE; v_result uuid; v_obs uuid;
BEGIN
  SELECT * INTO v_a FROM public.assessment_assignments WHERE id=p_assignment_id;
  SELECT * INTO v_m FROM public.assessment_methods WHERE id=v_a.method_id;
  IF v_a.id IS NULL OR v_a.state<>'completed' OR NOT public.can_record_hiring_evidence(public.hiring_application_business_profile(v_a.application_id)) THEN
    RAISE EXCEPTION 'completed assignment not found' USING ERRCODE='insufficient_privilege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hiring_criteria c WHERE c.id=p_criterion_id AND c.hiring_role_id=v_m.hiring_role_id) THEN RAISE EXCEPTION 'criterion does not belong to the assessment role'; END IF;
  IF jsonb_typeof(p_payload)<>'object' OR p_payload ?| ARRAY['hiring_outcome','recommended_outcome','candidate_rank','match_percentage','culture_fit_score','personality_score','emotion_score','facial_score','voice_personality_score'] THEN RAISE EXCEPTION 'result payload contains a forbidden outcome, rank, or inference field'; END IF;
  INSERT INTO public.hiring_observations(source,source_table,source_id,application_id,criterion_id,method,evaluator_id,stage_id,evidence_found,note_ar,note_en,citations)
  VALUES(CASE WHEN v_m.method='structured_interview' THEN 'interview_session'::public.hiring_observation_source_enum ELSE 'reference_check'::public.hiring_observation_source_enum END,
    'assessment_results',gen_random_uuid(),v_a.application_id,p_criterion_id,v_m.method,auth.uid(),v_a.stage_id,true,p_summary_ar,p_summary_en,'[]') RETURNING id INTO v_obs;
  INSERT INTO public.assessment_results(assignment_id,provider_id,criterion_id,payload,summary_ar,summary_en,limitations,provenance_ref,ingested_by,observation_id)
  VALUES(p_assignment_id,v_m.provider_id,p_criterion_id,p_payload,p_summary_ar,p_summary_en,coalesce(p_limitations,'[]'),p_provenance_ref,auth.uid(),v_obs) RETURNING id INTO v_result;
  UPDATE public.hiring_observations SET source_id=v_result WHERE id=v_obs;
  INSERT INTO public.hiring_evidence_attachments(application_id,criterion_id,stage_id,evidence_kind,evidence_record_id,candidate_visible,recorded_by)
  VALUES(v_a.application_id,p_criterion_id,v_a.stage_id,'assessment_result',v_result,false,auth.uid());
  PERFORM public._write_audit_log(auth.uid(),'assessment.result_ingested','assessment_results',v_result,NULL,
    jsonb_build_object('assignment_id',p_assignment_id,'observation_id',v_obs,'sets_hiring_outcome',false));
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.assign_assessment(uuid,uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.transition_assessment_assignment(uuid,text,text,text,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.retry_assessment_assignment(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.ingest_assessment_result(uuid,uuid,jsonb,text,text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assign_assessment(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_assessment_assignment(uuid,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_assessment_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_assessment_result(uuid,uuid,jsonb,text,text,jsonb,text) TO authenticated;
GRANT SELECT ON public.assessment_providers,public.assessment_methods,public.assessment_assignments,public.assessment_assignment_events,public.assessment_results TO authenticated;
GRANT INSERT,UPDATE ON public.assessment_providers,public.assessment_methods TO authenticated;

NOTIFY pgrst, 'reload schema';
