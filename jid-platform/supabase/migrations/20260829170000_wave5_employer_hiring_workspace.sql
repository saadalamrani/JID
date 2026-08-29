-- Wave 5: Employer foundation, governed hiring workspace, and audit trail.
-- Forward-only and additive. Production execution is not authorized by this file.

CREATE TYPE public.hiring_team_role_enum AS ENUM
  ('owner', 'hiring_admin', 'recruiter', 'interviewer', 'viewer');
CREATE TYPE public.hiring_stage_kind_enum AS ENUM
  ('applied', 'review', 'screening', 'interview', 'offer', 'closed');
CREATE TYPE public.candidate_visible_status_enum AS ENUM
  ('submitted', 'in_review', 'action_required', 'interview', 'offer',
   'not_selected', 'hired', 'withdrawn');
CREATE TYPE public.hiring_outcome_enum AS ENUM
  ('hired', 'not_selected', 'withdrawn', 'role_cancelled');

CREATE TABLE public.hiring_team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.hiring_team_role_enum NOT NULL,
  active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_profile_id, user_id)
);

CREATE TABLE public.hiring_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE RESTRICT,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_state IN ('draft', 'active', 'paused', 'closed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hiring_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  description_ar text,
  description_en text,
  evidence_kinds text[] NOT NULL DEFAULT '{}',
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hiring_role_id, sort_order)
);

CREATE TABLE public.hiring_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  kind public.hiring_stage_kind_enum NOT NULL,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  candidate_visible_status public.candidate_visible_status_enum NOT NULL,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  terminal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hiring_role_id, sort_order)
);

ALTER TABLE public.applications
  ADD COLUMN hiring_role_id uuid REFERENCES public.hiring_roles(id) ON DELETE RESTRICT,
  ADD COLUMN current_hiring_stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE RESTRICT,
  ADD COLUMN candidate_visible_status public.candidate_visible_status_enum,
  ADD COLUMN outcome public.hiring_outcome_enum,
  ADD COLUMN outcome_reason text,
  ADD COLUMN outcome_recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN outcome_recorded_at timestamptz;

CREATE TABLE public.hiring_stage_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE RESTRICT,
  to_stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE RESTRICT,
  from_candidate_status public.candidate_visible_status_enum,
  to_candidate_status public.candidate_visible_status_enum NOT NULL,
  outcome public.hiring_outcome_enum,
  reason text,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hiring_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 5000),
  author_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hiring_evidence_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  criterion_id uuid REFERENCES public.hiring_criteria(id) ON DELETE RESTRICT,
  stage_id uuid REFERENCES public.hiring_stages(id) ON DELETE RESTRICT,
  evidence_kind text NOT NULL CHECK (evidence_kind IN
    ('screening_response', 'work_sample', 'interview_observation',
     'rubric_observation', 'scorecard', 'assessment_result')),
  evidence_record_id uuid NOT NULL,
  candidate_visible boolean NOT NULL DEFAULT false,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, evidence_kind, evidence_record_id)
);

CREATE INDEX hiring_memberships_user_idx ON public.hiring_team_memberships(user_id, active);
CREATE INDEX hiring_roles_profile_idx ON public.hiring_roles(business_profile_id);
CREATE INDEX hiring_stages_role_idx ON public.hiring_stages(hiring_role_id, sort_order);
CREATE INDEX hiring_transitions_application_idx
  ON public.hiring_stage_transitions(application_id, occurred_at);
CREATE INDEX hiring_notes_application_idx ON public.hiring_notes(application_id, created_at);

CREATE OR REPLACE FUNCTION public.can_access_hiring_workspace(
  p_business_profile_id uuid,
  p_write boolean DEFAULT false
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = p_business_profile_id
      AND bp.owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.hiring_team_memberships m
    WHERE m.business_profile_id = p_business_profile_id
      AND m.user_id = auth.uid() AND m.active
      AND (NOT p_write OR m.role IN ('owner', 'hiring_admin', 'recruiter'))
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  )
$$;

REVOKE ALL ON FUNCTION public.can_access_hiring_workspace(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_hiring_workspace(uuid, boolean) TO authenticated;

ALTER TABLE public.hiring_team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_evidence_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY hiring_memberships_read ON public.hiring_team_memberships FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(business_profile_id, false));
CREATE POLICY hiring_memberships_manage ON public.hiring_team_memberships FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(business_profile_id, true))
  WITH CHECK (public.can_access_hiring_workspace(business_profile_id, true));

CREATE POLICY hiring_roles_read ON public.hiring_roles FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(business_profile_id, false));
CREATE POLICY hiring_roles_write ON public.hiring_roles FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(business_profile_id, true))
  WITH CHECK (public.can_access_hiring_workspace(business_profile_id, true));

CREATE POLICY hiring_criteria_workspace ON public.hiring_criteria FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, false)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)));
CREATE POLICY hiring_stages_workspace ON public.hiring_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, false)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)));

CREATE POLICY hiring_transitions_employer_read ON public.hiring_stage_transitions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_transitions_candidate_read ON public.hiring_stage_transitions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id
    AND a.applicant_id = auth.uid()));
CREATE POLICY hiring_notes_workspace ON public.hiring_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)))
  WITH CHECK (author_user_id = auth.uid() AND EXISTS
    (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
     WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)));
CREATE POLICY hiring_evidence_employer ON public.hiring_evidence_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)))
  WITH CHECK (recorded_by = auth.uid() AND EXISTS
    (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
     WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)));
CREATE POLICY hiring_evidence_candidate_visible ON public.hiring_evidence_attachments FOR SELECT TO authenticated
  USING (candidate_visible AND EXISTS (SELECT 1 FROM public.applications a
    WHERE a.id = application_id AND a.applicant_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.transition_hiring_application(
  p_application_id uuid,
  p_to_stage_id uuid,
  p_outcome public.hiring_outcome_enum DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_app public.applications%ROWTYPE;
  v_stage public.hiring_stages%ROWTYPE;
  v_role public.hiring_roles%ROWTYPE;
  v_event_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;
  SELECT * INTO v_role FROM public.hiring_roles WHERE id = v_app.hiring_role_id;
  IF NOT FOUND OR NOT public.can_access_hiring_workspace(v_role.business_profile_id, true) THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_app.outcome IS NOT NULL THEN RAISE EXCEPTION 'closed application cannot transition'; END IF;
  SELECT * INTO v_stage FROM public.hiring_stages WHERE id = p_to_stage_id
    AND hiring_role_id = v_app.hiring_role_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'stage does not belong to application role'; END IF;
  IF v_stage.terminal <> (p_outcome IS NOT NULL) THEN
    RAISE EXCEPTION 'terminal stage and outcome must be recorded together';
  END IF;
  IF p_outcome = 'withdrawn' THEN
    RAISE EXCEPTION 'employer cannot withdraw an application';
  END IF;
  IF p_outcome IS NOT NULL AND nullif(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'terminal outcome requires a reason';
  END IF;

  INSERT INTO public.hiring_stage_transitions (
    application_id, from_stage_id, to_stage_id, from_candidate_status,
    to_candidate_status, outcome, reason, actor_user_id
  ) VALUES (
    v_app.id, v_app.current_hiring_stage_id, v_stage.id, v_app.candidate_visible_status,
    v_stage.candidate_visible_status, p_outcome, nullif(btrim(p_reason), ''), auth.uid()
  ) RETURNING id INTO v_event_id;

  UPDATE public.applications SET
    current_hiring_stage_id = v_stage.id,
    candidate_visible_status = v_stage.candidate_visible_status,
    outcome = p_outcome,
    outcome_reason = CASE WHEN p_outcome IS NULL THEN NULL ELSE btrim(p_reason) END,
    outcome_recorded_by = CASE WHEN p_outcome IS NULL THEN NULL ELSE auth.uid() END,
    outcome_recorded_at = CASE WHEN p_outcome IS NULL THEN NULL ELSE now() END,
    last_company_action_at = now(), status_changed_at = now(),
    status_changed_by = auth.uid(), updated_at = now()
  WHERE id = v_app.id;
  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_hiring_application(uuid, uuid, public.hiring_outcome_enum, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_hiring_application(uuid, uuid, public.hiring_outcome_enum, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_hiring_application(
  p_application_id uuid,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE v_app public.applications%ROWTYPE; v_event_id uuid;
BEGIN
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND OR v_app.applicant_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_app.outcome IS NOT NULL THEN RAISE EXCEPTION 'application already closed'; END IF;
  INSERT INTO public.hiring_stage_transitions (
    application_id, from_stage_id, to_stage_id, from_candidate_status,
    to_candidate_status, outcome, reason, actor_user_id
  ) VALUES (v_app.id, v_app.current_hiring_stage_id, NULL, v_app.candidate_visible_status,
    'withdrawn', 'withdrawn', nullif(btrim(p_reason), ''), auth.uid())
  RETURNING id INTO v_event_id;
  UPDATE public.applications SET candidate_visible_status = 'withdrawn', outcome = 'withdrawn',
    outcome_reason = nullif(btrim(p_reason), ''), outcome_recorded_by = auth.uid(),
    outcome_recorded_at = now(), status = 'withdrawn', status_changed_at = now(),
    status_changed_by = auth.uid(), updated_at = now() WHERE id = v_app.id;
  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_hiring_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_hiring_application(uuid, text) TO authenticated;

COMMENT ON TABLE public.hiring_stage_transitions IS
  'Wave 5 append-only hiring audit. Corrections append; rows are never updated or deleted.';
NOTIFY pgrst, 'reload schema';
