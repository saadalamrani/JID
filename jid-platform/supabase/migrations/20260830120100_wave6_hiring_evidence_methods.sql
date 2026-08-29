-- =============================================================================
-- Wave 6 / Hiring Evidence — Method layer: screening plans, work samples,
-- interview plans, sessions (EXPAND, forward-only, additive)
-- =============================================================================
-- Extends Wave 5 frozen hiring contract. REMOTE APPLY IS NOT AUTHORIZED BY THIS
-- FILE (see 20260830120000 header — Wave 5 P1 migration-lane divergence).
-- No proctoring, camera, microphone, keystroke, or plagiarism-verdict columns
-- exist or may be added here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Assessment plans (structured screening + structured interview)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_assessment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  method public.assessment_method_enum NOT NULL
    CHECK (method IN ('structured_screening', 'structured_interview')),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'active', 'retired')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_assessment_plans_role_idx ON public.hiring_assessment_plans(hiring_role_id);

CREATE TABLE public.hiring_assessment_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.hiring_assessment_plans(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.hiring_criteria(id) ON DELETE RESTRICT,
  rubric_id uuid REFERENCES public.hiring_rubrics(id) ON DELETE SET NULL,
  prompt_ar text NOT NULL CHECK (length(btrim(prompt_ar)) BETWEEN 1 AND 4000),
  prompt_en text NOT NULL CHECK (length(btrim(prompt_en)) BETWEEN 1 AND 4000),
  expected_evidence_ar text,
  expected_evidence_en text,
  is_core boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  draft_state text NOT NULL DEFAULT 'human_authored'
    CHECK (draft_state IN ('human_authored', 'ai_drafted', 'human_approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, sort_order)
);

-- ---------------------------------------------------------------------------
-- 2. Work sample tasks + candidate submissions
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_work_sample_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  criterion_id uuid REFERENCES public.hiring_criteria(id) ON DELETE SET NULL,
  rubric_id uuid REFERENCES public.hiring_rubrics(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  instructions_ar text NOT NULL,
  instructions_en text NOT NULL,
  expected_evidence_ar text,
  expected_evidence_en text,
  time_box_minutes integer CHECK (time_box_minutes IS NULL OR time_box_minutes > 0),
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'active', 'retired')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_work_sample_tasks_role_idx ON public.hiring_work_sample_tasks(hiring_role_id);

CREATE TABLE public.hiring_work_sample_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.hiring_work_sample_tasks(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  submitted_at timestamptz,
  state text NOT NULL DEFAULT 'assigned'
    CHECK (state IN ('assigned', 'submitted', 'withdrawn', 'expired')),
  artifact_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  candidate_note_ar text,
  candidate_note_en text,
  consent jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, application_id)
);
CREATE INDEX hiring_work_sample_submissions_application_idx
  ON public.hiring_work_sample_submissions(application_id);

-- ---------------------------------------------------------------------------
-- 3. Assessment sessions (one conducted interview/screening instance)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.hiring_assessment_plans(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE SET NULL,
  state text NOT NULL DEFAULT 'planned'
    CHECK (state IN ('planned', 'conducted', 'cancelled')),
  scheduled_at timestamptz,
  conducted_at timestamptz,
  interviewer_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hiring_assessment_sessions_application_idx
  ON public.hiring_assessment_sessions(application_id);

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.hiring_assessment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_assessment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_work_sample_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_work_sample_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Plans / tasks / sessions are workspace config: read = member, write = write tier.
CREATE POLICY hiring_assessment_plans_read ON public.hiring_assessment_plans FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), false));
CREATE POLICY hiring_assessment_plans_write ON public.hiring_assessment_plans FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true))
  WITH CHECK (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true));

CREATE POLICY hiring_assessment_plan_items_read ON public.hiring_assessment_plan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_assessment_plans p WHERE p.id = plan_id
    AND public.can_access_hiring_workspace(
      public.hiring_role_business_profile(p.hiring_role_id), false)));
CREATE POLICY hiring_assessment_plan_items_write ON public.hiring_assessment_plan_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_assessment_plans p WHERE p.id = plan_id
    AND public.can_access_hiring_workspace(
      public.hiring_role_business_profile(p.hiring_role_id), true)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_assessment_plans p WHERE p.id = plan_id
    AND public.can_access_hiring_workspace(
      public.hiring_role_business_profile(p.hiring_role_id), true)));

CREATE POLICY hiring_work_sample_tasks_read ON public.hiring_work_sample_tasks FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), false));
CREATE POLICY hiring_work_sample_tasks_write ON public.hiring_work_sample_tasks FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true))
  WITH CHECK (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true));

CREATE POLICY hiring_assessment_sessions_read ON public.hiring_assessment_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_assessment_sessions_write ON public.hiring_assessment_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)));

-- Work sample submissions: employer reads via role join; candidate reads/writes OWN
-- via application ownership. Writes go through RPCs; direct candidate UPDATE is limited
-- to its own row and the state machine is enforced in the RPC.
CREATE POLICY hiring_work_sample_submissions_employer_read ON public.hiring_work_sample_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_work_sample_submissions_candidate_read ON public.hiring_work_sample_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a
    WHERE a.id = application_id AND a.applicant_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. RPCs — employer assigns, candidate submits / withdraws
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_work_sample(
  p_task_id uuid,
  p_application_id uuid,
  p_due_at timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
    auth.uid(), 'hiring_evidence.work_sample_assigned',
    'hiring_work_sample_submissions', v_id, NULL,
    jsonb_build_object('task_id', p_task_id, 'application_id', p_application_id), NULL, NULL, NULL);

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_work_sample(uuid, uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_work_sample(uuid, uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_work_sample(
  p_submission_id uuid,
  p_artifact_refs jsonb,
  p_note_ar text DEFAULT NULL,
  p_note_en text DEFAULT NULL,
  p_terms_ref text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_sub public.hiring_work_sample_submissions%ROWTYPE;
  v_app public.applications%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.hiring_work_sample_submissions
    WHERE id = p_submission_id FOR UPDATE;
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
    UPDATE public.hiring_work_sample_submissions
       SET state = 'expired', updated_at = now() WHERE id = p_submission_id;
    RAISE EXCEPTION 'the submission window has closed';
  END IF;
  IF jsonb_typeof(p_artifact_refs) <> 'array' OR jsonb_array_length(p_artifact_refs) = 0 THEN
    RAISE EXCEPTION 'at least one artifact reference is required';
  END IF;

  UPDATE public.hiring_work_sample_submissions SET
    state = 'submitted',
    submitted_at = now(),
    artifact_refs = p_artifact_refs,
    candidate_note_ar = nullif(btrim(coalesce(p_note_ar, '')), ''),
    candidate_note_en = nullif(btrim(coalesce(p_note_en, '')), ''),
    consent = jsonb_build_object('acknowledged_at', now(),
      'terms_ref', coalesce(nullif(btrim(coalesce(p_terms_ref, '')), ''), 'default')),
    updated_at = now()
  WHERE id = p_submission_id;

  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.work_sample_submitted',
    'hiring_work_sample_submissions', p_submission_id, NULL,
    jsonb_build_object('artifact_count', jsonb_array_length(p_artifact_refs)), NULL, NULL, NULL);

  RETURN p_submission_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_work_sample(uuid, jsonb, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_work_sample(uuid, jsonb, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_work_sample(p_submission_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_sub public.hiring_work_sample_submissions%ROWTYPE;
  v_app public.applications%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.hiring_work_sample_submissions
    WHERE id = p_submission_id FOR UPDATE;
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

  UPDATE public.hiring_work_sample_submissions
     SET state = 'withdrawn', updated_at = now() WHERE id = p_submission_id;

  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.work_sample_withdrawn',
    'hiring_work_sample_submissions', p_submission_id, NULL, NULL, NULL, NULL, NULL);

  RETURN p_submission_id;
END;
$$;
REVOKE ALL ON FUNCTION public.withdraw_work_sample(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_work_sample(uuid) TO authenticated;

COMMENT ON TABLE public.hiring_work_sample_submissions IS
  'Wave 6 candidate work-sample responses. Candidate may submit and withdraw. '
  'Deadline lapse sets state=expired; it never produces a rating. No proctoring data.';

NOTIFY pgrst, 'reload schema';
