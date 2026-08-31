-- Wave 11: privacy-safe University intelligence and readiness operations.
-- Additive and forward-only. The suppression threshold is product configuration,
-- not a statement of law or regulatory sufficiency.

CREATE TYPE public.university_readiness_activity_type_enum AS ENUM
  ('CAREER_WORKSHOP', 'PREPARATION_PROGRAM', 'EMPLOYER_SESSION', 'CAREER_EVENT', 'READINESS_INTERVENTION');
CREATE TYPE public.university_readiness_activity_status_enum AS ENUM
  ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE public.university_intelligence_privacy_config (
  config_key text PRIMARY KEY,
  minimum_group_size integer NOT NULL CHECK (minimum_group_size BETWEEN 2 AND 100),
  rationale text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.university_intelligence_privacy_config
  (config_key, minimum_group_size, rationale)
VALUES
  ('aggregate_default', 5, 'Conservative JID product default for small-group suppression; not a legal or regulatory threshold.');

CREATE TABLE public.university_program_alignment_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES public.university_cohorts(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  evidence_statement_ar text NOT NULL CHECK (length(btrim(evidence_statement_ar)) BETWEEN 8 AND 1000),
  evidence_statement_en text NOT NULL CHECK (length(btrim(evidence_statement_en)) BETWEEN 8 AND 1000),
  provenance_ref text NOT NULL CHECK (length(btrim(provenance_ref)) BETWEEN 1 AND 500),
  recorded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  revoked_at timestamptz,
  UNIQUE (cohort_id, job_id, provenance_ref)
);

COMMENT ON TABLE public.university_program_alignment_evidence IS
  'Explicit, provenance-bound program-to-published-opportunity evidence. Never a match score or employer endorsement.';

CREATE TABLE public.university_readiness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog(id) ON DELETE RESTRICT,
  cohort_id uuid REFERENCES public.university_cohorts(id) ON DELETE SET NULL,
  activity_type public.university_readiness_activity_type_enum NOT NULL,
  title_ar text NOT NULL CHECK (length(btrim(title_ar)) BETWEEN 2 AND 300),
  title_en text NOT NULL CHECK (length(btrim(title_en)) BETWEEN 2 AND 300),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status public.university_readiness_activity_status_enum NOT NULL,
  participation_count integer CHECK (participation_count IS NULL OR participation_count >= 0),
  provenance_ref text NOT NULL CHECK (length(btrim(provenance_ref)) BETWEEN 1 AND 500),
  recorded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT university_readiness_window_chk CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

COMMENT ON COLUMN public.university_readiness_activities.participation_count IS
  'Recorded aggregate attendance only. Null means not recorded; attendance does not imply readiness.';

INSERT INTO public.university_metric_definitions (
  metric_key, name_ar, name_en, source_definition, population_definition,
  window_definition, coverage_rule, missingness_rule, privacy_rule, computability
) VALUES
  (
    'known_outcome_coverage', 'تغطية المخرجات المعروفة', 'Known outcome coverage',
    'Distinct active verified cohort members with at least one active KNOWN outcome evidence row',
    'Active verified members of the selected cohort',
    'Current active cohort membership and non-revoked outcome evidence at query time',
    'Known members divided by eligible members; this is coverage, never an employment rate',
    'No evidence remains unknown and is never classified as unemployment or another outcome',
    'Aggregate only; suppressed when eligible population is below the configured product threshold',
    'COMPUTABLE'
  ),
  (
    'known_outcome_distribution', 'توزيع المخرجات المعروفة', 'Known outcome distribution',
    'Active KNOWN outcome evidence grouped by explicit recorded category and source',
    'Active verified members of the selected cohort who have provenance-bound evidence',
    'Current non-revoked evidence at query time',
    'Evidence-record distribution is shown separately from person-level coverage',
    'Unknown and absent evidence are not assigned to a known category',
    'Aggregate only; all category cells are suppressed with the parent small group',
    'COMPUTABLE'
  )
ON CONFLICT (metric_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.upsert_university_readiness_activity(
  p_activity_id uuid,
  p_cohort_id uuid,
  p_activity_type public.university_readiness_activity_type_enum,
  p_title_ar text,
  p_title_en text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status public.university_readiness_activity_status_enum,
  p_participation_count integer,
  p_provenance_ref text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_catalog uuid := public.current_mapped_catalog_university_id(); v_id uuid;
BEGIN
  IF v_catalog IS NULL THEN RAISE EXCEPTION 'Mapped University authority required' USING ERRCODE='42501'; END IF;
  IF p_cohort_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.university_cohorts c WHERE c.id=p_cohort_id AND c.catalog_university_id=v_catalog
  ) THEN RAISE EXCEPTION 'Cohort is outside mapped University' USING ERRCODE='42501'; END IF;
  IF p_activity_id IS NULL THEN
    INSERT INTO public.university_readiness_activities
      (catalog_university_id, cohort_id, activity_type, title_ar, title_en, starts_at, ends_at,
       status, participation_count, provenance_ref, recorded_by)
    VALUES (v_catalog, p_cohort_id, p_activity_type, btrim(p_title_ar), btrim(p_title_en),
      p_starts_at, p_ends_at, p_status, p_participation_count, btrim(p_provenance_ref), auth.uid())
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.university_readiness_activities SET
      cohort_id=p_cohort_id, activity_type=p_activity_type, title_ar=btrim(p_title_ar),
      title_en=btrim(p_title_en), starts_at=p_starts_at, ends_at=p_ends_at, status=p_status,
      participation_count=p_participation_count, provenance_ref=btrim(p_provenance_ref),
      updated_at=timezone('utc', now())
    WHERE id=p_activity_id AND catalog_university_id=v_catalog RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Activity not found in mapped University' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.record_university_program_alignment(
  p_cohort_id uuid, p_job_id uuid, p_statement_ar text, p_statement_en text, p_provenance_ref text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_catalog uuid := public.current_mapped_catalog_university_id(); v_id uuid;
BEGIN
  IF v_catalog IS NULL THEN RAISE EXCEPTION 'Mapped University authority required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.university_cohorts c WHERE c.id=p_cohort_id AND c.catalog_university_id=v_catalog)
    THEN RAISE EXCEPTION 'Cohort is outside mapped University' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=p_job_id AND j.status IN ('published','closing_soon'))
    THEN RAISE EXCEPTION 'Alignment requires a current published Opportunity'; END IF;
  INSERT INTO public.university_program_alignment_evidence
    (catalog_university_id, cohort_id, job_id, evidence_statement_ar, evidence_statement_en,
     provenance_ref, recorded_by)
  VALUES (v_catalog, p_cohort_id, p_job_id, btrim(p_statement_ar), btrim(p_statement_en),
    btrim(p_provenance_ref), auth.uid()) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.university_owner_intelligence_snapshot(p_cohort_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_catalog uuid := public.current_mapped_catalog_university_id();
  v_directory uuid := public.current_owned_university_directory_id();
  v_threshold integer;
  v_eligible integer;
  v_known integer;
  v_suppressed boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('mapping_present',false,'fail_closed_reason','unauthenticated'); END IF;
  IF v_directory IS NULL THEN RETURN jsonb_build_object('mapping_present',false,'fail_closed_reason','no_owned_profile'); END IF;
  IF v_catalog IS NULL THEN RETURN jsonb_build_object('mapping_present',false,'fail_closed_reason','unmapped'); END IF;
  IF p_cohort_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.university_cohorts c WHERE c.id=p_cohort_id AND c.catalog_university_id=v_catalog
  ) THEN RAISE EXCEPTION 'Cohort is outside mapped University' USING ERRCODE='42501'; END IF;
  SELECT minimum_group_size INTO v_threshold FROM public.university_intelligence_privacy_config WHERE config_key='aggregate_default';
  SELECT count(DISTINCT m.individual_id)::int INTO v_eligible
  FROM public.university_cohort_memberships m
  JOIN public.university_cohorts c ON c.id=m.cohort_id
  JOIN public.university_affiliations a ON a.id=m.affiliation_id
  WHERE c.catalog_university_id=v_catalog AND (p_cohort_id IS NULL OR c.id=p_cohort_id)
    AND m.state='ACTIVE' AND a.state='VERIFIED' AND a.revoked_at IS NULL;
  SELECT count(DISTINCT m.individual_id)::int INTO v_known
  FROM public.university_cohort_memberships m
  JOIN public.university_cohorts c ON c.id=m.cohort_id
  JOIN public.university_affiliations a ON a.id=m.affiliation_id
  WHERE c.catalog_university_id=v_catalog AND (p_cohort_id IS NULL OR c.id=p_cohort_id)
    AND m.state='ACTIVE' AND a.state='VERIFIED' AND a.revoked_at IS NULL
    AND EXISTS (SELECT 1 FROM public.university_outcome_evidence o
      WHERE o.affiliation_id=a.id AND o.presence='KNOWN' AND o.revoked_at IS NULL);
  v_suppressed := v_eligible > 0 AND v_eligible < v_threshold;
  RETURN jsonb_build_object(
    'mapping_present',true,'fail_closed_reason',NULL,'catalog_university_id',v_catalog,
    'selected_cohort_id',p_cohort_id,'suppression_threshold',v_threshold,
    'suppression_is_product_configuration',true,'suppressed',v_suppressed,
    'eligible_population',CASE WHEN v_suppressed THEN NULL ELSE v_eligible END,
    'known_outcome_count',CASE WHEN v_suppressed THEN NULL ELSE v_known END,
    'known_outcome_coverage',CASE WHEN v_suppressed OR v_eligible=0 THEN NULL ELSE round(v_known::numeric/v_eligible,4) END,
    'cohorts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'graduation_year',c.graduation_year,
      'degree_level',c.degree_level,'program_text',c.program_text,'major_id',c.major_id) ORDER BY c.graduation_year DESC)
      FROM public.university_cohorts c WHERE c.catalog_university_id=v_catalog),'[]'::jsonb),
    'outcome_distribution',CASE WHEN v_suppressed THEN '[]'::jsonb ELSE coalesce((
      SELECT jsonb_agg(jsonb_build_object('source',x.source,'category',x.category,'count',x.n)) FROM (
        SELECT o.source,o.category,count(*)::int n FROM public.university_outcome_evidence o
        JOIN public.university_cohort_memberships m ON m.affiliation_id=o.affiliation_id
        JOIN public.university_cohorts c ON c.id=m.cohort_id
        JOIN public.university_affiliations a ON a.id=m.affiliation_id
        WHERE c.catalog_university_id=v_catalog AND (p_cohort_id IS NULL OR c.id=p_cohort_id)
          AND m.state='ACTIVE' AND a.state='VERIFIED' AND a.revoked_at IS NULL
          AND o.presence='KNOWN' AND o.revoked_at IS NULL GROUP BY o.source,o.category
      ) x),'[]'::jsonb) END,
    'alignment_evidence',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',e.id,'cohort_id',e.cohort_id,'job_id',e.job_id,'title_ar',j.title_ar,'title_en',j.title_en,
      'required_skills',j.required_skills,'statement_ar',e.evidence_statement_ar,
      'statement_en',e.evidence_statement_en,'provenance_ref',e.provenance_ref,'recorded_at',e.recorded_at))
      FROM public.university_program_alignment_evidence e JOIN public.jobs j ON j.id=e.job_id
      WHERE e.catalog_university_id=v_catalog AND e.revoked_at IS NULL
        AND (p_cohort_id IS NULL OR e.cohort_id=p_cohort_id)),'[]'::jsonb),
    'readiness_activities',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',r.id,'cohort_id',r.cohort_id,'activity_type',r.activity_type,'title_ar',r.title_ar,
      'title_en',r.title_en,'starts_at',r.starts_at,'ends_at',r.ends_at,'status',r.status,
      'participation_count',r.participation_count,'provenance_ref',r.provenance_ref) ORDER BY r.starts_at DESC)
      FROM public.university_readiness_activities r WHERE r.catalog_university_id=v_catalog
        AND (p_cohort_id IS NULL OR r.cohort_id IS NULL OR r.cohort_id=p_cohort_id)),'[]'::jsonb),
    'methodology',(SELECT jsonb_agg(jsonb_build_object('metric_key',d.metric_key,'name_ar',d.name_ar,
      'name_en',d.name_en,'source_definition',d.source_definition,'population_definition',d.population_definition,
      'window_definition',d.window_definition,'coverage_rule',d.coverage_rule,'missingness_rule',d.missingness_rule,
      'privacy_rule',d.privacy_rule)) FROM public.university_metric_definitions d
      WHERE d.metric_key IN ('known_outcome_coverage','known_outcome_distribution'))
  );
END; $$;

ALTER TABLE public.university_intelligence_privacy_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_program_alignment_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_readiness_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY university_intelligence_config_staff_read ON public.university_intelligence_privacy_config
  FOR SELECT TO authenticated USING (public.is_privileged_staff());
CREATE POLICY university_alignment_staff_or_owner_read ON public.university_program_alignment_evidence
  FOR SELECT TO authenticated USING (public.is_privileged_staff() OR catalog_university_id=public.current_mapped_catalog_university_id());
CREATE POLICY university_readiness_staff_or_owner_read ON public.university_readiness_activities
  FOR SELECT TO authenticated USING (public.is_privileged_staff() OR catalog_university_id=public.current_mapped_catalog_university_id());

REVOKE ALL ON public.university_intelligence_privacy_config, public.university_program_alignment_evidence,
  public.university_readiness_activities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.university_intelligence_privacy_config, public.university_program_alignment_evidence,
  public.university_readiness_activities TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_university_readiness_activity(uuid,uuid,public.university_readiness_activity_type_enum,text,text,timestamptz,timestamptz,public.university_readiness_activity_status_enum,integer,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.record_university_program_alignment(uuid,uuid,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.university_owner_intelligence_snapshot(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.upsert_university_readiness_activity(uuid,uuid,public.university_readiness_activity_type_enum,text,text,timestamptz,timestamptz,public.university_readiness_activity_status_enum,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_university_program_alignment(uuid,uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_owner_intelligence_snapshot(uuid) TO authenticated;
