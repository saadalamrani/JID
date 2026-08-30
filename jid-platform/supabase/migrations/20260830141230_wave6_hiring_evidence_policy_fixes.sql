-- =============================================================================
-- Wave 6 / Hiring Evidence — corrective migration (forward-only, additive)
-- =============================================================================
-- Fixes two defects found by the nonprod RLS actor matrix:
--
--  1. `_write_audit_log(...)` was called with an explicit NULL for `p_metadata`,
--     but `public.audit_logs.metadata` is NOT NULL (the function default `'{}'`
--     only applies when the argument is omitted). Every Wave 6 write RPC raised
--     `null value in column "metadata"`. Fixed by dropping the trailing
--     NULL / NULL / NULL arguments so `p_metadata` defaults to `'{}'::jsonb`.
--
--  2. Several Wave 6 RLS policies gated on `EXISTS (SELECT 1 FROM
--     public.applications a JOIN public.hiring_roles r ...)`. That subquery runs
--     under the caller's `public.applications` RLS, which does not expose an
--     application row to an `interviewer` team member. Result: interviewers (who
--     ARE in the evidence-recording tier) could not create a scorecard or read
--     their own observations. Fixed by resolving the owning business profile /
--     role / applicant through SECURITY DEFINER helpers and re-gating the
--     policies on the existing authority functions.
--
-- Additive only. No table or column is dropped. No data is modified.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SECURITY DEFINER lookup helpers (bypass caller-side applications RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hiring_application_business_profile(p_application_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT r.business_profile_id
  FROM public.applications a
  JOIN public.hiring_roles r ON r.id = a.hiring_role_id
  WHERE a.id = p_application_id
$$;

CREATE OR REPLACE FUNCTION public.hiring_application_role(p_application_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT a.hiring_role_id FROM public.applications a WHERE a.id = p_application_id
$$;

CREATE OR REPLACE FUNCTION public.hiring_application_applicant(p_application_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT a.applicant_id FROM public.applications a WHERE a.id = p_application_id
$$;

CREATE OR REPLACE FUNCTION public.hiring_criterion_role(p_criterion_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT c.hiring_role_id FROM public.hiring_criteria c WHERE c.id = p_criterion_id
$$;

REVOKE ALL ON FUNCTION public.hiring_application_business_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hiring_application_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hiring_application_applicant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hiring_criterion_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hiring_application_business_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hiring_application_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hiring_application_applicant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hiring_criterion_role(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Re-gate application-scoped policies (methods layer)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS hiring_assessment_sessions_read ON public.hiring_assessment_sessions;
DROP POLICY IF EXISTS hiring_assessment_sessions_write ON public.hiring_assessment_sessions;
CREATE POLICY hiring_assessment_sessions_read ON public.hiring_assessment_sessions FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_application_business_profile(application_id), false));
CREATE POLICY hiring_assessment_sessions_write ON public.hiring_assessment_sessions FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_application_business_profile(application_id), true))
  WITH CHECK (public.can_access_hiring_workspace(
    public.hiring_application_business_profile(application_id), true));

DROP POLICY IF EXISTS hiring_work_sample_submissions_employer_read ON public.hiring_work_sample_submissions;
DROP POLICY IF EXISTS hiring_work_sample_submissions_candidate_read ON public.hiring_work_sample_submissions;
CREATE POLICY hiring_work_sample_submissions_employer_read ON public.hiring_work_sample_submissions FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_application_business_profile(application_id), false));
CREATE POLICY hiring_work_sample_submissions_candidate_read ON public.hiring_work_sample_submissions FOR SELECT TO authenticated
  USING (public.hiring_application_applicant(application_id) = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Re-gate application-scoped policies (observation / rating / scorecard /
--    decision-support layer)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS hiring_observations_insert ON public.hiring_observations;
DROP POLICY IF EXISTS hiring_observations_read ON public.hiring_observations;
CREATE POLICY hiring_observations_insert ON public.hiring_observations FOR INSERT TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid()
    AND public.can_record_hiring_evidence(
      public.hiring_application_business_profile(application_id))
    AND public.hiring_criterion_role(criterion_id)
        = public.hiring_application_role(application_id));
CREATE POLICY hiring_observations_read ON public.hiring_observations FOR SELECT TO authenticated
  USING (
    public.can_access_hiring_workspace(
      public.hiring_application_business_profile(application_id), false)
    AND public.hiring_evidence_peer_visible(application_id, stage_id, evaluator_id));

DROP POLICY IF EXISTS hiring_scorecard_ratings_read ON public.hiring_scorecard_ratings;
CREATE POLICY hiring_scorecard_ratings_read ON public.hiring_scorecard_ratings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hiring_observations o
    WHERE o.id = observation_id
      AND public.can_access_hiring_workspace(
        public.hiring_application_business_profile(o.application_id), false)
      AND public.hiring_evidence_peer_visible(o.application_id, o.stage_id, o.evaluator_id)));

DROP POLICY IF EXISTS hiring_scorecards_own ON public.hiring_scorecards;
DROP POLICY IF EXISTS hiring_scorecards_peer_read ON public.hiring_scorecards;
CREATE POLICY hiring_scorecards_own ON public.hiring_scorecards FOR ALL TO authenticated
  USING (
    evaluator_id = auth.uid()
    AND public.can_record_hiring_evidence(
      public.hiring_application_business_profile(application_id)))
  WITH CHECK (
    evaluator_id = auth.uid()
    AND public.can_record_hiring_evidence(
      public.hiring_application_business_profile(application_id)));
CREATE POLICY hiring_scorecards_peer_read ON public.hiring_scorecards FOR SELECT TO authenticated
  USING (
    public.can_access_hiring_workspace(
      public.hiring_application_business_profile(application_id), false)
    AND public.hiring_evidence_peer_visible(application_id, stage_id, evaluator_id));

DROP POLICY IF EXISTS hiring_decision_support_read ON public.hiring_assessment_decision_support;
DROP POLICY IF EXISTS hiring_decision_support_insert ON public.hiring_assessment_decision_support;
CREATE POLICY hiring_decision_support_read ON public.hiring_assessment_decision_support FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_application_business_profile(application_id), false));
CREATE POLICY hiring_decision_support_insert ON public.hiring_assessment_decision_support FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.can_access_hiring_workspace(
      public.hiring_application_business_profile(application_id), true));

-- ---------------------------------------------------------------------------
-- 4. Fix the audit-log calls in every Wave 6 write RPC
--    (drop the trailing NULL metadata / ip / user_agent arguments)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_hiring_rubric_version(
  p_rubric_id uuid, p_scale_points integer, p_anchors jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_rubric public.hiring_rubrics%ROWTYPE;
  v_bp uuid; v_version_id uuid; v_anchor jsonb; v_count integer; v_points integer[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_rubric FROM public.hiring_rubrics WHERE id = p_rubric_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'rubric not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_bp := public.hiring_role_business_profile(v_rubric.hiring_role_id);
  IF NOT public.can_access_hiring_workspace(v_bp, true) THEN
    RAISE EXCEPTION 'rubric not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_scale_points NOT IN (3, 4, 5) THEN
    RAISE EXCEPTION 'scale_points must be 3, 4, or 5';
  END IF;
  IF jsonb_typeof(p_anchors) <> 'array' THEN
    RAISE EXCEPTION 'anchors must be a JSON array';
  END IF;
  SELECT count(*), array_agg((a->>'point')::int ORDER BY (a->>'point')::int)
    INTO v_count, v_points FROM jsonb_array_elements(p_anchors) a;
  IF v_count <> p_scale_points THEN
    RAISE EXCEPTION 'exactly % anchors are required for a % point scale', p_scale_points, p_scale_points;
  END IF;
  IF v_points IS DISTINCT FROM (SELECT array_agg(g ORDER BY g) FROM generate_series(1, p_scale_points) g) THEN
    RAISE EXCEPTION 'anchor points must be exactly 1..% with no gaps or duplicates', p_scale_points;
  END IF;
  INSERT INTO public.hiring_rubric_versions (rubric_id, supersedes_version_id, scale_points, created_by)
  VALUES (p_rubric_id, v_rubric.current_version_id, p_scale_points, auth.uid())
  RETURNING id INTO v_version_id;
  FOR v_anchor IN SELECT * FROM jsonb_array_elements(p_anchors) LOOP
    IF nullif(btrim(coalesce(v_anchor->>'descriptor_ar', '')), '') IS NULL
       OR nullif(btrim(coalesce(v_anchor->>'descriptor_en', '')), '') IS NULL THEN
      RAISE EXCEPTION 'each anchor requires descriptor_ar and descriptor_en';
    END IF;
    INSERT INTO public.hiring_rubric_anchors (version_id, point, descriptor_ar, descriptor_en)
    VALUES (v_version_id, (v_anchor->>'point')::int,
      btrim(v_anchor->>'descriptor_ar'), btrim(v_anchor->>'descriptor_en'));
  END LOOP;
  UPDATE public.hiring_rubrics
     SET current_version_id = v_version_id,
         state = CASE WHEN state = 'draft' THEN 'active' ELSE state END,
         updated_at = now()
   WHERE id = p_rubric_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.rubric_version_published', 'hiring_rubrics', p_rubric_id,
    jsonb_build_object('previous_version_id', v_rubric.current_version_id),
    jsonb_build_object('version_id', v_version_id, 'scale_points', p_scale_points));
  RETURN v_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_work_sample(
  p_task_id uuid, p_application_id uuid, p_due_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_task public.hiring_work_sample_tasks%ROWTYPE;
  v_app public.applications%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_task FROM public.hiring_work_sample_tasks WHERE id = p_task_id;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF v_task.id IS NULL OR v_app.id IS NULL THEN
    RAISE EXCEPTION 'task or application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_role FROM public.hiring_roles WHERE id = v_app.hiring_role_id;
  IF v_role.id IS NULL OR v_role.id IS DISTINCT FROM v_task.hiring_role_id THEN
    RAISE EXCEPTION 'task does not belong to the application role';
  END IF;
  IF NOT public.can_access_hiring_workspace(v_role.business_profile_id, true) THEN
    RAISE EXCEPTION 'task or application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_app.outcome IS NOT NULL THEN
    RAISE EXCEPTION 'cannot assign a work sample on a closed application';
  END IF;
  INSERT INTO public.hiring_work_sample_submissions
    (task_id, application_id, submitted_by, assigned_at, due_at, state)
  VALUES (p_task_id, p_application_id, v_app.applicant_id, now(), p_due_at, 'assigned')
  ON CONFLICT (task_id, application_id) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'this task is already assigned to the application';
  END IF;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.work_sample_assigned', 'hiring_work_sample_submissions', v_id, NULL,
    jsonb_build_object('task_id', p_task_id, 'application_id', p_application_id));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_work_sample(
  p_submission_id uuid, p_artifact_refs jsonb, p_note_ar text DEFAULT NULL,
  p_note_en text DEFAULT NULL, p_terms_ref text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_sub public.hiring_work_sample_submissions%ROWTYPE;
  v_app public.applications%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.hiring_work_sample_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = v_sub.application_id;
  IF v_app.applicant_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'submission not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_sub.state <> 'assigned' THEN
    RAISE EXCEPTION 'only an assigned work sample can be submitted';
  END IF;
  IF v_sub.due_at IS NOT NULL AND now() > v_sub.due_at THEN
    UPDATE public.hiring_work_sample_submissions SET state = 'expired', updated_at = now() WHERE id = p_submission_id;
    RAISE EXCEPTION 'the submission window has closed';
  END IF;
  IF jsonb_typeof(p_artifact_refs) <> 'array' OR jsonb_array_length(p_artifact_refs) = 0 THEN
    RAISE EXCEPTION 'at least one artifact reference is required';
  END IF;
  UPDATE public.hiring_work_sample_submissions SET
    state = 'submitted', submitted_at = now(), artifact_refs = p_artifact_refs,
    candidate_note_ar = nullif(btrim(coalesce(p_note_ar, '')), ''),
    candidate_note_en = nullif(btrim(coalesce(p_note_en, '')), ''),
    consent = jsonb_build_object('acknowledged_at', now(),
      'terms_ref', coalesce(nullif(btrim(coalesce(p_terms_ref, '')), ''), 'default')),
    updated_at = now()
  WHERE id = p_submission_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.work_sample_submitted', 'hiring_work_sample_submissions', p_submission_id, NULL,
    jsonb_build_object('artifact_count', jsonb_array_length(p_artifact_refs)));
  RETURN p_submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_work_sample(p_submission_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_sub public.hiring_work_sample_submissions%ROWTYPE;
  v_app public.applications%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.hiring_work_sample_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = v_sub.application_id;
  IF v_app.applicant_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'submission not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_sub.state NOT IN ('assigned', 'submitted') THEN
    RAISE EXCEPTION 'this submission can no longer be withdrawn';
  END IF;
  UPDATE public.hiring_work_sample_submissions SET state = 'withdrawn', updated_at = now() WHERE id = p_submission_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.work_sample_withdrawn', 'hiring_work_sample_submissions', p_submission_id);
  RETURN p_submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_hiring_observation(
  p_application_id uuid, p_criterion_id uuid, p_method public.assessment_method_enum,
  p_source public.hiring_observation_source_enum, p_source_table text, p_source_id uuid,
  p_evidence_found boolean, p_stage_id uuid DEFAULT NULL, p_note_ar text DEFAULT NULL,
  p_note_en text DEFAULT NULL, p_evidence_requested_ar text DEFAULT NULL,
  p_evidence_requested_en text DEFAULT NULL, p_citations jsonb DEFAULT '[]'::jsonb,
  p_plan_item_id uuid DEFAULT NULL, p_work_sample_task_id uuid DEFAULT NULL,
  p_supersedes_observation_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_app public.applications%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_kind text; v_obs_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_role FROM public.hiring_roles WHERE id = v_app.hiring_role_id;
  IF NOT FOUND OR NOT public.can_record_hiring_evidence(v_role.business_profile_id) THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hiring_criteria c
                 WHERE c.id = p_criterion_id AND c.hiring_role_id = v_app.hiring_role_id) THEN
    RAISE EXCEPTION 'criterion does not belong to the application role';
  END IF;
  IF p_evidence_found IS NULL THEN
    RAISE EXCEPTION 'evidence_found must be true or false (missing evidence is recorded as false, not null)';
  END IF;
  v_kind := CASE p_method
    WHEN 'structured_screening' THEN 'screening_response'
    WHEN 'work_sample' THEN 'work_sample'
    WHEN 'structured_interview' THEN 'interview_observation'
    WHEN 'portfolio_review' THEN 'rubric_observation'
    WHEN 'reference_check' THEN 'assessment_result'
  END;
  INSERT INTO public.hiring_observations (
    source, source_table, source_id, application_id, criterion_id, method,
    evaluator_id, stage_id, plan_item_id, work_sample_task_id,
    evidence_requested_ar, evidence_requested_en, evidence_found,
    note_ar, note_en, citations, supersedes_observation_id
  ) VALUES (
    p_source, p_source_table, p_source_id, p_application_id, p_criterion_id, p_method,
    auth.uid(), p_stage_id, p_plan_item_id, p_work_sample_task_id,
    nullif(btrim(coalesce(p_evidence_requested_ar, '')), ''),
    nullif(btrim(coalesce(p_evidence_requested_en, '')), ''),
    p_evidence_found,
    nullif(btrim(coalesce(p_note_ar, '')), ''),
    nullif(btrim(coalesce(p_note_en, '')), ''),
    coalesce(p_citations, '[]'::jsonb),
    p_supersedes_observation_id
  ) RETURNING id INTO v_obs_id;
  INSERT INTO public.hiring_evidence_attachments (
    application_id, criterion_id, stage_id, evidence_kind, evidence_record_id,
    candidate_visible, recorded_by
  ) VALUES (
    p_application_id, p_criterion_id, p_stage_id, v_kind, v_obs_id, false, auth.uid()
  ) ON CONFLICT (application_id, evidence_kind, evidence_record_id) DO NOTHING;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.observation_recorded', 'hiring_observations', v_obs_id, NULL,
    jsonb_build_object('criterion_id', p_criterion_id, 'method', p_method,
      'evidence_found', p_evidence_found));
  RETURN v_obs_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_hiring_rating(
  p_observation_id uuid, p_rubric_version_id uuid, p_anchor_point integer DEFAULT NULL,
  p_rationale_ar text DEFAULT NULL, p_rationale_en text DEFAULT NULL,
  p_supersedes_rating_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_obs public.hiring_observations%ROWTYPE;
  v_scale integer; v_rating_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_obs FROM public.hiring_observations WHERE id = p_observation_id;
  IF NOT FOUND OR v_obs.evaluator_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'observation not found for this evaluator' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT scale_points INTO v_scale FROM public.hiring_rubric_versions WHERE id = p_rubric_version_id;
  IF v_scale IS NULL THEN
    RAISE EXCEPTION 'rubric version not found';
  END IF;
  IF p_anchor_point IS NOT NULL AND (p_anchor_point < 1 OR p_anchor_point > v_scale) THEN
    RAISE EXCEPTION 'anchor_point must be between 1 and % or null', v_scale;
  END IF;
  INSERT INTO public.hiring_scorecard_ratings (
    observation_id, rubric_version_id, anchor_point, evaluator_id,
    rationale_ar, rationale_en, supersedes_rating_id
  ) VALUES (
    p_observation_id, p_rubric_version_id, p_anchor_point, auth.uid(),
    nullif(btrim(coalesce(p_rationale_ar, '')), ''),
    nullif(btrim(coalesce(p_rationale_en, '')), ''),
    p_supersedes_rating_id
  ) RETURNING id INTO v_rating_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.rating_recorded', 'hiring_scorecard_ratings', v_rating_id, NULL,
    jsonb_build_object('observation_id', p_observation_id,
      'anchor_point', p_anchor_point, 'rubric_version_id', p_rubric_version_id));
  RETURN v_rating_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_hiring_scorecard(p_scorecard_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_sc public.hiring_scorecards%ROWTYPE;
  v_ids jsonb;
BEGIN
  SELECT * INTO v_sc FROM public.hiring_scorecards WHERE id = p_scorecard_id FOR UPDATE;
  IF NOT FOUND OR v_sc.evaluator_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'scorecard not found for this evaluator' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_sc.state = 'submitted' THEN
    RAISE EXCEPTION 'scorecard already submitted';
  END IF;
  SELECT coalesce(jsonb_agg(rt.id ORDER BY rt.rated_at), '[]'::jsonb) INTO v_ids
  FROM public.hiring_scorecard_ratings rt
  JOIN public.hiring_observations o ON o.id = rt.observation_id
  WHERE rt.evaluator_id = auth.uid()
    AND o.application_id = v_sc.application_id
    AND (o.stage_id IS NOT DISTINCT FROM v_sc.stage_id);
  IF v_ids = '[]'::jsonb THEN
    RAISE EXCEPTION 'a scorecard needs at least one rating before it can be submitted';
  END IF;
  UPDATE public.hiring_scorecards
     SET state = 'submitted', submitted_at = now(), frozen_rating_ids = v_ids
   WHERE id = p_scorecard_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.scorecard_submitted', 'hiring_scorecards', p_scorecard_id, NULL,
    jsonb_build_object('rating_count', jsonb_array_length(v_ids)));
  RETURN p_scorecard_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_hiring_decision_support(
  p_application_id uuid, p_stage_id uuid, p_summary_ar text, p_summary_en text,
  p_missing_evidence jsonb DEFAULT '[]'::jsonb, p_inconsistencies jsonb DEFAULT '[]'::jsonb,
  p_ai_assist_ref jsonb DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
DECLARE
  v_app public.applications%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_inputs jsonb; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_role FROM public.hiring_roles WHERE id = v_app.hiring_role_id;
  IF NOT FOUND OR NOT public.can_access_hiring_workspace(v_role.business_profile_id, true) THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT jsonb_build_object(
    'scorecard_ids', coalesce((SELECT jsonb_agg(sc.id) FROM public.hiring_scorecards sc
       WHERE sc.application_id = p_application_id
         AND (sc.stage_id IS NOT DISTINCT FROM p_stage_id) AND sc.state = 'submitted'), '[]'::jsonb),
    'observation_ids', coalesce((SELECT jsonb_agg(o.id) FROM public.hiring_observations o
       WHERE o.application_id = p_application_id
         AND (o.stage_id IS NOT DISTINCT FROM p_stage_id)), '[]'::jsonb)
  ) INTO v_inputs;
  INSERT INTO public.hiring_assessment_decision_support (
    application_id, stage_id, requested_by, inputs_snapshot,
    summary_ar, summary_en, missing_evidence, inconsistencies, ai_assist_ref
  ) VALUES (
    p_application_id, p_stage_id, auth.uid(), v_inputs,
    nullif(btrim(coalesce(p_summary_ar, '')), ''),
    nullif(btrim(coalesce(p_summary_en, '')), ''),
    coalesce(p_missing_evidence, '[]'::jsonb),
    coalesce(p_inconsistencies, '[]'::jsonb),
    p_ai_assist_ref
  ) RETURNING id INTO v_id;
  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.decision_support_generated',
    'hiring_assessment_decision_support', v_id, NULL,
    jsonb_build_object('stage_id', p_stage_id, 'ai_assisted', (p_ai_assist_ref IS NOT NULL)));
  RETURN v_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
