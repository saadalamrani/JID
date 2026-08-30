-- =============================================================================
-- Wave 6 / Hiring Evidence — Observation -> rating -> scorecard -> decision
-- support (EXPAND, forward-only, additive)
-- =============================================================================
-- Extends Wave 5 frozen hiring contract. APPLIED to jid-nonprod as
-- schema_migrations version 20260830133658 on 2026-08-30 (forward-only).
--
-- Invariants enforced here:
--  * observation, rating, and decision-support are three distinct append-only
--    records; nothing is edited in place.
--  * a rating cannot exist without an observation.
--  * anchor_point NULL ("insufficient evidence to rate") and evidence_found
--    false are valid, non-negative states.
--  * NO aggregate score column anywhere.
--  * decision-support has NO outcome column and is always attributed to a human
--    requester. Consequential decisions stay in the Wave 5 Outcome model.
--  * an evaluator's observations/ratings become visible to peers only after that
--    evaluator's scorecard for the (application, stage) is SUBMITTED
--    (evaluator independence). Owners/hiring_admins may always read.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.hiring_observation_source_enum AS ENUM (
    'structured_screening',
    'work_sample',
    'interview_session',
    'reference_check'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 1. Observations (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.hiring_observation_source_enum NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.hiring_criteria(id) ON DELETE RESTRICT,
  method public.assessment_method_enum NOT NULL,
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE SET NULL,
  plan_item_id uuid REFERENCES public.hiring_assessment_plan_items(id) ON DELETE SET NULL,
  work_sample_task_id uuid REFERENCES public.hiring_work_sample_tasks(id) ON DELETE SET NULL,
  evidence_requested_ar text,
  evidence_requested_en text,
  evidence_found boolean NOT NULL,
  note_ar text,
  note_en text,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  supersedes_observation_id uuid REFERENCES public.hiring_observations(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_observations_application_idx
  ON public.hiring_observations(application_id, criterion_id);
CREATE INDEX hiring_observations_evaluator_idx
  ON public.hiring_observations(evaluator_id);

-- ---------------------------------------------------------------------------
-- 2. Ratings (append-only; one observation -> one anchor)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_scorecard_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid NOT NULL REFERENCES public.hiring_observations(id) ON DELETE CASCADE,
  rubric_version_id uuid NOT NULL REFERENCES public.hiring_rubric_versions(id) ON DELETE RESTRICT,
  anchor_point integer CHECK (anchor_point IS NULL OR anchor_point >= 1),
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rationale_ar text,
  rationale_en text,
  supersedes_rating_id uuid REFERENCES public.hiring_scorecard_ratings(id) ON DELETE RESTRICT,
  rated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_scorecard_ratings_observation_idx
  ON public.hiring_scorecard_ratings(observation_id);

-- ---------------------------------------------------------------------------
-- 3. Scorecards (per evaluator, per application, per stage)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE SET NULL,
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'in_progress' CHECK (state IN ('in_progress', 'submitted')),
  submitted_at timestamptz,
  frozen_rating_ids jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, stage_id, evaluator_id)
);

-- ---------------------------------------------------------------------------
-- 4. Decision support (append-only; NOT a decision; human-requested)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_assessment_decision_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE SET NULL,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  inputs_snapshot jsonb NOT NULL,
  summary_ar text,
  summary_en text,
  missing_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  inconsistencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_assist_ref jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_decision_support_application_idx
  ON public.hiring_assessment_decision_support(application_id, generated_at);

-- ---------------------------------------------------------------------------
-- 5. Evaluator-independence visibility helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hiring_evidence_peer_visible(
  p_application_id uuid,
  p_stage_id uuid,
  p_evaluator_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    -- you always see your own
    p_evaluator_id = auth.uid()
    -- owner / hiring_admin may always read for calibration
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = p_application_id
        AND public.can_manage_hiring_team(r.business_profile_id)
    )
    -- otherwise only once the owning evaluator has SUBMITTED their scorecard
    OR EXISTS (
      SELECT 1 FROM public.hiring_scorecards sc
      WHERE sc.application_id = p_application_id
        AND sc.evaluator_id = p_evaluator_id
        AND sc.state = 'submitted'
        AND (sc.stage_id IS NOT DISTINCT FROM p_stage_id)
    )
$$;
REVOKE ALL ON FUNCTION public.hiring_evidence_peer_visible(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hiring_evidence_peer_visible(uuid, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.hiring_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_scorecard_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_assessment_decision_support ENABLE ROW LEVEL SECURITY;

-- Observations: insert your own within the evidence-recording tier; read your own
-- always, peers only per the independence rule. No update/delete (append-only).
CREATE POLICY hiring_observations_insert ON public.hiring_observations FOR INSERT TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_record_hiring_evidence(r.business_profile_id))
    AND EXISTS (
      SELECT 1 FROM public.hiring_criteria c
      JOIN public.applications a ON a.id = application_id
      WHERE c.id = criterion_id AND c.hiring_role_id = a.hiring_role_id));
CREATE POLICY hiring_observations_read ON public.hiring_observations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_access_hiring_workspace(r.business_profile_id, false))
    AND public.hiring_evidence_peer_visible(application_id, stage_id, evaluator_id));

-- Ratings: same shape, keyed through the parent observation.
CREATE POLICY hiring_scorecard_ratings_insert ON public.hiring_scorecard_ratings FOR INSERT TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.hiring_observations o
      WHERE o.id = observation_id AND o.evaluator_id = auth.uid()));
CREATE POLICY hiring_scorecard_ratings_read ON public.hiring_scorecard_ratings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hiring_observations o
    JOIN public.applications a ON a.id = o.application_id
    JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE o.id = observation_id
      AND public.can_access_hiring_workspace(r.business_profile_id, false)
      AND public.hiring_evidence_peer_visible(o.application_id, o.stage_id, o.evaluator_id)));

-- Scorecards: an evaluator manages only their own; peers/managers read per the rule.
CREATE POLICY hiring_scorecards_own ON public.hiring_scorecards FOR ALL TO authenticated
  USING (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_record_hiring_evidence(r.business_profile_id)))
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_record_hiring_evidence(r.business_profile_id)));
CREATE POLICY hiring_scorecards_peer_read ON public.hiring_scorecards FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_access_hiring_workspace(r.business_profile_id, false))
    AND public.hiring_evidence_peer_visible(application_id, stage_id, evaluator_id));

-- Decision support: workspace members read; inserts are RPC-only (requested_by pinned).
CREATE POLICY hiring_decision_support_read ON public.hiring_assessment_decision_support FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id
      AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_decision_support_insert ON public.hiring_assessment_decision_support FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hiring_roles r ON r.id = a.hiring_role_id
      WHERE a.id = application_id
        AND public.can_access_hiring_workspace(r.business_profile_id, true)));

-- ---------------------------------------------------------------------------
-- 7. RPCs
-- ---------------------------------------------------------------------------

-- 7.1 Record an observation + attach it to the Wave 5 pointer table atomically.
CREATE OR REPLACE FUNCTION public.record_hiring_observation(
  p_application_id uuid,
  p_criterion_id uuid,
  p_method public.assessment_method_enum,
  p_source public.hiring_observation_source_enum,
  p_source_table text,
  p_source_id uuid,
  p_evidence_found boolean,
  p_stage_id uuid DEFAULT NULL,
  p_note_ar text DEFAULT NULL,
  p_note_en text DEFAULT NULL,
  p_evidence_requested_ar text DEFAULT NULL,
  p_evidence_requested_en text DEFAULT NULL,
  p_citations jsonb DEFAULT '[]'::jsonb,
  p_plan_item_id uuid DEFAULT NULL,
  p_work_sample_task_id uuid DEFAULT NULL,
  p_supersedes_observation_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_app public.applications%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_kind text;
  v_obs_id uuid;
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

  -- Attach through the Wave 5 pointer table (idempotent on the Wave 5 unique key).
  INSERT INTO public.hiring_evidence_attachments (
    application_id, criterion_id, stage_id, evidence_kind, evidence_record_id,
    candidate_visible, recorded_by
  ) VALUES (
    p_application_id, p_criterion_id, p_stage_id, v_kind, v_obs_id, false, auth.uid()
  ) ON CONFLICT (application_id, evidence_kind, evidence_record_id) DO NOTHING;

  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.observation_recorded',
    'hiring_observations', v_obs_id, NULL,
    jsonb_build_object('criterion_id', p_criterion_id, 'method', p_method,
      'evidence_found', p_evidence_found), NULL, NULL, NULL);

  RETURN v_obs_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_hiring_observation(
  uuid, uuid, public.assessment_method_enum, public.hiring_observation_source_enum,
  text, uuid, boolean, uuid, text, text, text, text, jsonb, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_hiring_observation(
  uuid, uuid, public.assessment_method_enum, public.hiring_observation_source_enum,
  text, uuid, boolean, uuid, text, text, text, text, jsonb, uuid, uuid, uuid) TO authenticated;

-- 7.2 Record a rating against one observation and one rubric version.
CREATE OR REPLACE FUNCTION public.record_hiring_rating(
  p_observation_id uuid,
  p_rubric_version_id uuid,
  p_anchor_point integer DEFAULT NULL,
  p_rationale_ar text DEFAULT NULL,
  p_rationale_en text DEFAULT NULL,
  p_supersedes_rating_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_obs public.hiring_observations%ROWTYPE;
  v_scale integer;
  v_rating_id uuid;
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
    auth.uid(), 'hiring_evidence.rating_recorded',
    'hiring_scorecard_ratings', v_rating_id, NULL,
    jsonb_build_object('observation_id', p_observation_id,
      'anchor_point', p_anchor_point, 'rubric_version_id', p_rubric_version_id),
    NULL, NULL, NULL);

  RETURN v_rating_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_hiring_rating(uuid, uuid, integer, text, text, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_hiring_rating(uuid, uuid, integer, text, text, uuid)
  TO authenticated;

-- 7.3 Submit a scorecard: freeze the evaluator's rating id set for (application, stage).
CREATE OR REPLACE FUNCTION public.submit_hiring_scorecard(p_scorecard_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
    auth.uid(), 'hiring_evidence.scorecard_submitted',
    'hiring_scorecards', p_scorecard_id, NULL,
    jsonb_build_object('rating_count', jsonb_array_length(v_ids)), NULL, NULL, NULL);

  RETURN p_scorecard_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_hiring_scorecard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_hiring_scorecard(uuid) TO authenticated;

-- 7.4 Generate decision support. No outcome parameter exists by design.
CREATE OR REPLACE FUNCTION public.generate_hiring_decision_support(
  p_application_id uuid,
  p_stage_id uuid,
  p_summary_ar text,
  p_summary_en text,
  p_missing_evidence jsonb DEFAULT '[]'::jsonb,
  p_inconsistencies jsonb DEFAULT '[]'::jsonb,
  p_ai_assist_ref jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_app public.applications%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_inputs jsonb;
  v_id uuid;
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
    jsonb_build_object('stage_id', p_stage_id, 'ai_assisted', (p_ai_assist_ref IS NOT NULL)),
    NULL, NULL, NULL);

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_hiring_decision_support(uuid, uuid, text, text, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_hiring_decision_support(uuid, uuid, text, text, jsonb, jsonb, jsonb)
  TO authenticated;

COMMENT ON TABLE public.hiring_observations IS
  'Wave 6 append-only evaluator observations. Corrections append a superseding row. '
  'evidence_found=false is a valid neutral state.';
COMMENT ON TABLE public.hiring_scorecard_ratings IS
  'Wave 6 append-only ratings. Each cites exactly one observation and one rubric version. '
  'anchor_point NULL = insufficient evidence to rate. No aggregate column exists.';
COMMENT ON TABLE public.hiring_assessment_decision_support IS
  'Wave 6 human-requested decision support. Has no outcome column. The consequential '
  'decision is recorded only through the Wave 5 Outcome model by an accountable human.';

NOTIFY pgrst, 'reload schema';
