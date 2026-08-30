-- =============================================================================
-- Wave 6 / Hiring Evidence — Anchored rubrics (EXPAND, forward-only, additive)
-- =============================================================================
-- Extends the Wave 5 frozen hiring contract (70cbc30). Does NOT redefine
-- hiring_roles, hiring_criteria, hiring_stages, applications, or team authority.
--
-- APPLIED to jid-nonprod (hmjuijmaefajdjrjdsxu) as schema_migrations version
-- 20260830133421 on 2026-08-30, on the reconciled Wave 5 final lineage
-- (WAVE_5_COMPLETE eda1fac). Forward-only; DATA_LOSS=0. See
-- 20260830141230_wave6_hiring_evidence_policy_fixes.sql for the corrective
-- follow-up found by the nonprod RLS actor matrix.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Method vocabulary (scopes rubrics + observations to ROLE + CRITERION + METHOD)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.assessment_method_enum AS ENUM (
    'structured_screening',
    'work_sample',
    'structured_interview',
    'reference_check',
    'portfolio_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Finer-grained evidence-recording authority
--    Wave 5 `can_access_hiring_workspace(_, true)` limits WRITE to
--    owner/hiring_admin/recruiter. Interviewers must record their own
--    observations and ratings, so Wave 6 adds an evidence-recording tier that
--    also includes 'interviewer'. It never grants config or team-admin rights.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_record_hiring_evidence(
  p_business_profile_id uuid
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
      AND m.user_id = auth.uid()
      AND m.active
      AND m.role IN ('owner', 'hiring_admin', 'recruiter', 'interviewer')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  )
$$;

REVOKE ALL ON FUNCTION public.can_record_hiring_evidence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_record_hiring_evidence(uuid) TO authenticated;

-- Resolve the owning business profile for a hiring role (helper for RLS joins).
CREATE OR REPLACE FUNCTION public.hiring_role_business_profile(p_hiring_role_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT r.business_profile_id FROM public.hiring_roles r WHERE r.id = p_hiring_role_id
$$;

REVOKE ALL ON FUNCTION public.hiring_role_business_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hiring_role_business_profile(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Rubric definition — one anchored rubric per (criterion, method)
-- ---------------------------------------------------------------------------
CREATE TABLE public.hiring_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.hiring_criteria(id) ON DELETE CASCADE,
  method public.assessment_method_enum NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft', 'active', 'retired')),
  current_version_id uuid,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (criterion_id, method)
);

CREATE INDEX hiring_rubrics_role_idx ON public.hiring_rubrics(hiring_role_id);

-- Append-only version lineage.
CREATE TABLE public.hiring_rubric_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES public.hiring_rubrics(id) ON DELETE CASCADE,
  supersedes_version_id uuid REFERENCES public.hiring_rubric_versions(id) ON DELETE RESTRICT,
  scale_points integer NOT NULL CHECK (scale_points IN (3, 4, 5)),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX hiring_rubric_versions_rubric_idx
  ON public.hiring_rubric_versions(rubric_id, created_at);

-- Append-only behavioral anchors (BARS: behavioral, level-distinct, evidence-referenced).
CREATE TABLE public.hiring_rubric_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.hiring_rubric_versions(id) ON DELETE CASCADE,
  point integer NOT NULL CHECK (point >= 1),
  descriptor_ar text NOT NULL CHECK (length(btrim(descriptor_ar)) BETWEEN 1 AND 2000),
  descriptor_en text NOT NULL CHECK (length(btrim(descriptor_en)) BETWEEN 1 AND 2000),
  UNIQUE (version_id, point)
);

ALTER TABLE public.hiring_rubrics
  ADD CONSTRAINT hiring_rubrics_current_version_fk
  FOREIGN KEY (current_version_id)
  REFERENCES public.hiring_rubric_versions(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.hiring_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_rubric_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_rubric_anchors ENABLE ROW LEVEL SECURITY;

-- Rubric definitions are workspace configuration: read = any workspace member,
-- write = the Wave 5 write tier (owner/hiring_admin/recruiter).
CREATE POLICY hiring_rubrics_read ON public.hiring_rubrics FOR SELECT TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), false));
CREATE POLICY hiring_rubrics_write ON public.hiring_rubrics FOR ALL TO authenticated
  USING (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true))
  WITH CHECK (public.can_access_hiring_workspace(
    public.hiring_role_business_profile(hiring_role_id), true));

-- Versions + anchors are append-only: SELECT for workspace members, INSERT for the
-- write tier, and NO update/delete policy (immutable to everyone but staff-owned
-- maintenance, which runs as service_role).
CREATE POLICY hiring_rubric_versions_read ON public.hiring_rubric_versions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hiring_rubrics rb
    WHERE rb.id = rubric_id
      AND public.can_access_hiring_workspace(
        public.hiring_role_business_profile(rb.hiring_role_id), false)));
CREATE POLICY hiring_rubric_versions_insert ON public.hiring_rubric_versions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.hiring_rubrics rb
    WHERE rb.id = rubric_id
      AND public.can_access_hiring_workspace(
        public.hiring_role_business_profile(rb.hiring_role_id), true)));

CREATE POLICY hiring_rubric_anchors_read ON public.hiring_rubric_anchors FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hiring_rubric_versions v
    JOIN public.hiring_rubrics rb ON rb.id = v.rubric_id
    WHERE v.id = version_id
      AND public.can_access_hiring_workspace(
        public.hiring_role_business_profile(rb.hiring_role_id), false)));
CREATE POLICY hiring_rubric_anchors_insert ON public.hiring_rubric_anchors FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hiring_rubric_versions v
    JOIN public.hiring_rubrics rb ON rb.id = v.rubric_id
    WHERE v.id = version_id
      AND public.can_access_hiring_workspace(
        public.hiring_role_business_profile(rb.hiring_role_id), true)));

-- ---------------------------------------------------------------------------
-- 5. Atomic version publish — append version + anchors, advance the pointer
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_hiring_rubric_version(
  p_rubric_id uuid,
  p_scale_points integer,
  p_anchors jsonb   -- [{ "point": 1, "descriptor_ar": "...", "descriptor_en": "..." }, ...]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rubric public.hiring_rubrics%ROWTYPE;
  v_bp uuid;
  v_version_id uuid;
  v_anchor jsonb;
  v_count integer;
  v_points integer[];
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
    INTO v_count, v_points
  FROM jsonb_array_elements(p_anchors) a;

  IF v_count <> p_scale_points THEN
    RAISE EXCEPTION 'exactly % anchors are required for a % point scale',
      p_scale_points, p_scale_points;
  END IF;

  IF v_points IS DISTINCT FROM (SELECT array_agg(g ORDER BY g)
                                FROM generate_series(1, p_scale_points) g) THEN
    RAISE EXCEPTION 'anchor points must be exactly 1..% with no gaps or duplicates',
      p_scale_points;
  END IF;

  INSERT INTO public.hiring_rubric_versions
    (rubric_id, supersedes_version_id, scale_points, created_by)
  VALUES (p_rubric_id, v_rubric.current_version_id, p_scale_points, auth.uid())
  RETURNING id INTO v_version_id;

  FOR v_anchor IN SELECT * FROM jsonb_array_elements(p_anchors) LOOP
    IF nullif(btrim(coalesce(v_anchor->>'descriptor_ar', '')), '') IS NULL
       OR nullif(btrim(coalesce(v_anchor->>'descriptor_en', '')), '') IS NULL THEN
      RAISE EXCEPTION 'each anchor requires descriptor_ar and descriptor_en';
    END IF;
    INSERT INTO public.hiring_rubric_anchors
      (version_id, point, descriptor_ar, descriptor_en)
    VALUES (
      v_version_id,
      (v_anchor->>'point')::int,
      btrim(v_anchor->>'descriptor_ar'),
      btrim(v_anchor->>'descriptor_en')
    );
  END LOOP;

  UPDATE public.hiring_rubrics
     SET current_version_id = v_version_id,
         state = CASE WHEN state = 'draft' THEN 'active' ELSE state END,
         updated_at = now()
   WHERE id = p_rubric_id;

  PERFORM public._write_audit_log(
    auth.uid(), 'hiring_evidence.rubric_version_published',
    'hiring_rubrics', p_rubric_id,
    jsonb_build_object('previous_version_id', v_rubric.current_version_id),
    jsonb_build_object('version_id', v_version_id, 'scale_points', p_scale_points),
    NULL, NULL, NULL
  );

  RETURN v_version_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_hiring_rubric_version(uuid, integer, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_hiring_rubric_version(uuid, integer, jsonb)
  TO authenticated;

COMMENT ON TABLE public.hiring_rubric_versions IS
  'Wave 6 append-only anchored-rubric versions. Never updated or deleted; a change '
  'publishes a superseding version via publish_hiring_rubric_version().';

NOTIFY pgrst, 'reload schema';
