-- Wave 10: University identity mapping, affiliation, cohorts, outcome foundation.
-- Forward-only and additive. Production execution is not authorized by this file.
-- Catalog identity (universities_catalog) and owned Directory identity (companies)
-- remain distinct. Mapping is Staff-only, explicit, auditable, revocable, 1:1 active.

CREATE TYPE public.university_mapping_state_enum AS ENUM ('active', 'revoked');
CREATE TYPE public.university_affiliation_state_enum AS ENUM
  ('DECLARED', 'VERIFIED', 'NEEDS_REVIEW');
CREATE TYPE public.university_person_status_enum AS ENUM
  ('STUDENT', 'GRADUATE', 'OTHER');
CREATE TYPE public.university_degree_level_enum AS ENUM
  ('diploma', 'bachelor', 'master', 'doctorate', 'other');
CREATE TYPE public.university_cohort_membership_state_enum AS ENUM
  ('ACTIVE', 'ENDED', 'NEEDS_REVIEW');
CREATE TYPE public.university_cohort_membership_source_enum AS ENUM
  ('DECLARED_AFFILIATION', 'STAFF_LINK', 'INSTITUTION_ROSTER');
CREATE TYPE public.university_outcome_source_enum AS ENUM
  ('USER_DECLARED', 'VERIFIED_EMPLOYER', 'INSTITUTION_GOVERNED', 'EXTERNAL_GOVERNMENT');
CREATE TYPE public.university_outcome_presence_enum AS ENUM ('KNOWN', 'UNKNOWN');
CREATE TYPE public.university_outcome_category_enum AS ENUM
  ('EMPLOYED', 'FURTHER_STUDY', 'OTHER', 'UNKNOWN');
CREATE TYPE public.university_metric_computability_enum AS ENUM
  ('CONTRACT_ONLY', 'COMPUTABLE');

-- ---------------------------------------------------------------------------
-- Identity mapping — never inferred from name/domain.
-- ---------------------------------------------------------------------------

CREATE TABLE public.university_identity_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE RESTRICT,
  directory_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  mapping_state public.university_mapping_state_enum NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles (id) ON DELETE RESTRICT,
  audit_reason text NOT NULL CHECK (length(btrim(audit_reason)) BETWEEN 8 AND 2000),
  audit_reference text,
  CONSTRAINT university_identity_mappings_active_chk CHECK (
    (mapping_state = 'active' AND revoked_at IS NULL AND revoked_by IS NULL)
    OR (mapping_state = 'revoked' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  )
);

CREATE UNIQUE INDEX university_identity_mappings_active_catalog_uidx
  ON public.university_identity_mappings (catalog_university_id)
  WHERE mapping_state = 'active';

CREATE UNIQUE INDEX university_identity_mappings_active_directory_uidx
  ON public.university_identity_mappings (directory_id)
  WHERE mapping_state = 'active';

CREATE INDEX university_identity_mappings_directory_idx
  ON public.university_identity_mappings (directory_id, mapping_state);

COMMENT ON TABLE public.university_identity_mappings IS
  'Staff-only reconciliation between universities_catalog.id and companies.id. Not a merge of identity spaces.';

-- ---------------------------------------------------------------------------
-- Affiliation contract — DECLARED / VERIFIED / NEEDS_REVIEW. No email mandate.
-- ---------------------------------------------------------------------------

CREATE TABLE public.university_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE RESTRICT,
  college_id uuid REFERENCES public.colleges_catalog (id) ON DELETE SET NULL,
  major_id uuid REFERENCES public.majors_catalog (id) ON DELETE SET NULL,
  degree_level public.university_degree_level_enum,
  graduation_year smallint CHECK (
    graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2100)
  ),
  person_status public.university_person_status_enum NOT NULL,
  state public.university_affiliation_state_enum NOT NULL DEFAULT 'DECLARED',
  declared_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  verification_method text CHECK (
    verification_method IS NULL
    OR verification_method IN ('ROSTER', 'INVITE', 'CODE', 'SSO', 'EMAIL', 'API', 'MANUAL_REVIEW')
  ),
  verification_source_ref text,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_reason text,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX university_affiliations_active_individual_university_uidx
  ON public.university_affiliations (individual_id, catalog_university_id)
  WHERE revoked_at IS NULL;

CREATE INDEX university_affiliations_catalog_state_idx
  ON public.university_affiliations (catalog_university_id, state)
  WHERE revoked_at IS NULL;

CREATE INDEX university_affiliations_individual_idx
  ON public.university_affiliations (individual_id, declared_at DESC);

COMMENT ON TABLE public.university_affiliations IS
  'Individual-declared University relationship. Affiliation is not Career Record access and is not blanket consent.';
COMMENT ON COLUMN public.university_affiliations.verification_method IS
  'Optional evidence method. University-email verification is never mandatory.';

-- ---------------------------------------------------------------------------
-- Cohorts and membership provenance.
-- ---------------------------------------------------------------------------

CREATE TABLE public.university_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE RESTRICT,
  major_id uuid REFERENCES public.majors_catalog (id) ON DELETE SET NULL,
  program_text text,
  graduation_year smallint NOT NULL CHECK (graduation_year >= 1950 AND graduation_year <= 2100),
  degree_level public.university_degree_level_enum,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT university_cohorts_program_present_chk CHECK (
    major_id IS NOT NULL OR length(btrim(coalesce(program_text, ''))) > 0
  )
);

CREATE UNIQUE INDEX university_cohorts_natural_uidx
  ON public.university_cohorts (
    catalog_university_id,
    graduation_year,
    (coalesce(major_id::text, '')),
    (coalesce(program_text, ''))
  );

CREATE INDEX university_cohorts_catalog_idx
  ON public.university_cohorts (catalog_university_id, graduation_year);

CREATE TABLE public.university_cohort_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.university_cohorts (id) ON DELETE CASCADE,
  affiliation_id uuid NOT NULL REFERENCES public.university_affiliations (id) ON DELETE CASCADE,
  individual_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  source public.university_cohort_membership_source_enum NOT NULL,
  state public.university_cohort_membership_state_enum NOT NULL DEFAULT 'ACTIVE',
  linked_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  ended_at timestamptz,
  ended_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT university_cohort_memberships_ended_chk CHECK (
    (state = 'ACTIVE' AND ended_at IS NULL)
    OR (state <> 'ACTIVE' AND ended_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX university_cohort_memberships_active_uidx
  ON public.university_cohort_memberships (cohort_id, affiliation_id)
  WHERE state = 'ACTIVE';

CREATE INDEX university_cohort_memberships_individual_idx
  ON public.university_cohort_memberships (individual_id, state);

COMMENT ON TABLE public.university_cohort_memberships IS
  'Cohort membership with provenance. Membership is not named Individual disclosure to University owners.';

-- ---------------------------------------------------------------------------
-- Outcome evidence — unknown remains unknown. No missingness inference.
-- ---------------------------------------------------------------------------

CREATE TABLE public.university_outcome_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliation_id uuid NOT NULL REFERENCES public.university_affiliations (id) ON DELETE CASCADE,
  individual_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE RESTRICT,
  source public.university_outcome_source_enum NOT NULL,
  presence public.university_outcome_presence_enum NOT NULL DEFAULT 'UNKNOWN',
  category public.university_outcome_category_enum NOT NULL DEFAULT 'UNKNOWN',
  provenance_ref text NOT NULL CHECK (length(btrim(provenance_ref)) BETWEEN 1 AND 500),
  recorded_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  notes text,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT university_outcome_evidence_unknown_chk CHECK (
    (presence = 'UNKNOWN' AND category = 'UNKNOWN')
    OR (presence = 'KNOWN' AND category <> 'UNKNOWN')
  )
);

CREATE INDEX university_outcome_evidence_catalog_idx
  ON public.university_outcome_evidence (catalog_university_id, source)
  WHERE revoked_at IS NULL;

CREATE INDEX university_outcome_evidence_individual_idx
  ON public.university_outcome_evidence (individual_id, recorded_at DESC);

COMMENT ON TABLE public.university_outcome_evidence IS
  'Provenance-bound outcome evidence. Missing data is UNKNOWN, never unemployed.';

-- ---------------------------------------------------------------------------
-- Metric contracts — schema without pretending rates exist.
-- ---------------------------------------------------------------------------

CREATE TABLE public.university_metric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  source_definition text NOT NULL,
  population_definition text NOT NULL,
  window_definition text NOT NULL,
  coverage_rule text NOT NULL,
  missingness_rule text NOT NULL,
  privacy_rule text NOT NULL,
  computability public.university_metric_computability_enum NOT NULL DEFAULT 'CONTRACT_ONLY',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.university_metric_definitions (
  metric_key, name_ar, name_en, source_definition, population_definition,
  window_definition, coverage_rule, missingness_rule, privacy_rule, computability
) VALUES
  (
    'verified_affiliation_count',
    'عدد الانتماءات الموثّقة',
    'Verified affiliation count',
    'university_affiliations where state=VERIFIED and revoked_at is null',
    'Individuals with a verified catalog-university affiliation',
    'All currently active verified rows',
    'Count only VERIFIED rows; DECLARED and NEEDS_REVIEW are excluded',
    'Missing affiliation is unknown, not a negative outcome',
    'Aggregate only. Named Individual rows are never returned to University owners',
    'COMPUTABLE'
  ),
  (
    'active_cohort_membership_count',
    'عدد عضويات الأفواج النشطة',
    'Active cohort membership count',
    'university_cohort_memberships where state=ACTIVE',
    'Verified affiliations linked to a cohort of the mapped catalog university',
    'Currently active memberships',
    'Count memberships whose affiliation is VERIFIED; unmapped owners receive no row',
    'Absent membership is unknown, not unemployment',
    'Aggregate only. Membership individual_id is hidden from University owners',
    'COMPUTABLE'
  ),
  (
    'outcome_evidence_count',
    'عدد أدلة المخرجات ذات المصدر',
    'Outcome evidence count by source',
    'university_outcome_evidence where revoked_at is null',
    'Outcome rows with explicit provenance for the mapped catalog university',
    'Currently active evidence rows',
    'Count by source; UNKNOWN presence is reported as unknown coverage',
    'NO RESPONSE, no JID application, and no profile update never become UNEMPLOYED',
    'Aggregate only. No named Individual, CV, application, or Career Record fields',
    'COMPUTABLE'
  ),
  (
    'employment_rate',
    'معدل التوظيف',
    'Employment rate',
    'Not computable in Wave 10 — outcome coverage is incomplete and missingness is not negative',
    'Not defined until coverage, window, and verified employment evidence exist',
    'Not defined',
    'Wave 10 does not compute this metric',
    'Missingness remains unknown; never inferred as unemployed',
    'Not displayed as a rate',
    'CONTRACT_ONLY'
  );

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_mapped_catalog_university_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT m.catalog_university_id
  FROM public.university_identity_mappings m
  JOIN public.university_profiles up ON up.directory_id = m.directory_id
  WHERE up.owner_user_id = (SELECT auth.uid())
    AND up.status IS DISTINCT FROM 'suspended'
    AND m.mapping_state = 'active'
    AND m.revoked_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_owned_university_directory_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT up.directory_id
  FROM public.university_profiles up
  WHERE up.owner_user_id = (SELECT auth.uid())
    AND up.status IS DISTINCT FROM 'suspended'
  ORDER BY up.updated_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_mapped_catalog_university_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_owned_university_directory_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_mapped_catalog_university_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_owned_university_directory_id() TO authenticated;

COMMENT ON FUNCTION public.current_mapped_catalog_university_id() IS
  'Fail-closed catalog id for the session University owner. Null when mapping is absent.';

-- ---------------------------------------------------------------------------
-- Staff mapping RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_university_identity_mapping(
  p_catalog_university_id uuid,
  p_directory_id uuid,
  p_audit_reason text,
  p_audit_reference text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Staff authority required to reconcile University identity' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_audit_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Audit reason is required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_directory_id AND c.entity_type = 'university'
  ) THEN
    RAISE EXCEPTION 'directory_id is not a University Directory record';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.university_profiles up WHERE up.directory_id = p_directory_id
  ) THEN
    RAISE EXCEPTION 'Owned University Profile is required before mapping';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.universities_catalog u WHERE u.id = p_catalog_university_id
  ) THEN
    RAISE EXCEPTION 'catalog_university_id not found';
  END IF;

  INSERT INTO public.university_identity_mappings (
    catalog_university_id, directory_id, created_by, audit_reason, audit_reference
  ) VALUES (
    p_catalog_university_id, p_directory_id, v_actor, btrim(p_audit_reason), nullif(btrim(p_audit_reference), '')
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_identity.mapped',
    'university_identity_mapping',
    v_id,
    NULL,
    jsonb_build_object(
      'catalog_university_id', p_catalog_university_id,
      'directory_id', p_directory_id,
      'audit_reason', btrim(p_audit_reason)
    )
  );

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_university_identity_mapping(
  p_mapping_id uuid,
  p_audit_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.university_identity_mappings%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Staff authority required to revoke University identity mapping' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_audit_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Audit reason is required';
  END IF;

  SELECT * INTO v_row
  FROM public.university_identity_mappings
  WHERE id = p_mapping_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Mapping not found';
  END IF;
  IF v_row.mapping_state <> 'active' THEN
    RAISE EXCEPTION 'Mapping is not active';
  END IF;

  UPDATE public.university_identity_mappings
  SET
    mapping_state = 'revoked',
    revoked_at = timezone('utc', now()),
    revoked_by = v_actor,
    audit_reason = btrim(p_audit_reason)
  WHERE id = p_mapping_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_identity.revoked',
    'university_identity_mapping',
    p_mapping_id,
    jsonb_build_object('mapping_state', 'active'),
    jsonb_build_object('mapping_state', 'revoked', 'audit_reason', btrim(p_audit_reason))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Individual affiliation RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.declare_university_affiliation(
  p_catalog_university_id uuid,
  p_person_status public.university_person_status_enum,
  p_college_id uuid DEFAULT NULL,
  p_major_id uuid DEFAULT NULL,
  p_degree_level public.university_degree_level_enum DEFAULT NULL,
  p_graduation_year smallint DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
  v_role public.user_role_enum;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor;
  IF v_role IS DISTINCT FROM 'individual' THEN
    RAISE EXCEPTION 'Only an Individual may declare University affiliation' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.university_affiliations (
    individual_id, catalog_university_id, college_id, major_id,
    degree_level, graduation_year, person_status, state
  ) VALUES (
    v_actor, p_catalog_university_id, p_college_id, p_major_id,
    p_degree_level, p_graduation_year, p_person_status, 'DECLARED'
  )
  RETURNING id INTO v_id;

  UPDATE public.profiles
  SET university_id = p_catalog_university_id,
      college_id = coalesce(p_college_id, college_id),
      major_id = coalesce(p_major_id, major_id),
      graduation_year = coalesce(p_graduation_year, graduation_year),
      updated_at = timezone('utc', now())
  WHERE id = v_actor;

  PERFORM public._write_audit_log(
    v_actor,
    'university_affiliation.declared',
    'university_affiliation',
    v_id,
    NULL,
    jsonb_build_object('catalog_university_id', p_catalog_university_id, 'state', 'DECLARED')
  );

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_university_affiliation_review(
  p_affiliation_id uuid,
  p_review_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_review_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Review reason is required';
  END IF;

  UPDATE public.university_affiliations
  SET
    state = 'NEEDS_REVIEW',
    review_reason = btrim(p_review_reason),
    updated_at = timezone('utc', now())
  WHERE id = p_affiliation_id
    AND individual_id = v_actor
    AND revoked_at IS NULL
    AND state = 'DECLARED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Affiliation not eligible for review request' USING ERRCODE = '42501';
  END IF;

  PERFORM public._write_audit_log(
    v_actor,
    'university_affiliation.needs_review',
    'university_affiliation',
    p_affiliation_id,
    jsonb_build_object('state', 'DECLARED'),
    jsonb_build_object('state', 'NEEDS_REVIEW')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_university_affiliation(
  p_affiliation_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.university_affiliations%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT * INTO v_row FROM public.university_affiliations WHERE id = p_affiliation_id FOR UPDATE;
  IF v_row.id IS NULL OR v_row.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Affiliation not found';
  END IF;
  IF v_row.individual_id IS DISTINCT FROM v_actor AND NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Not authorized to revoke this affiliation' USING ERRCODE = '42501';
  END IF;

  UPDATE public.university_affiliations
  SET
    revoked_at = timezone('utc', now()),
    revoked_by = v_actor,
    review_reason = btrim(p_reason),
    updated_at = timezone('utc', now())
  WHERE id = p_affiliation_id;

  UPDATE public.university_cohort_memberships
  SET state = 'ENDED', ended_at = timezone('utc', now()), ended_by = v_actor
  WHERE affiliation_id = p_affiliation_id AND state = 'ACTIVE';

  PERFORM public._write_audit_log(
    v_actor,
    'university_affiliation.revoked',
    'university_affiliation',
    p_affiliation_id,
    jsonb_build_object('state', v_row.state),
    jsonb_build_object('revoked', true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_review_university_affiliation(
  p_affiliation_id uuid,
  p_decision text,
  p_reason text,
  p_verification_method text DEFAULT 'MANUAL_REVIEW'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.university_affiliations%ROWTYPE;
  v_new public.university_affiliation_state_enum;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Staff authority required' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('VERIFIED', 'NEEDS_REVIEW') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  IF length(btrim(coalesce(p_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  v_new := p_decision::public.university_affiliation_state_enum;
  SELECT * INTO v_row FROM public.university_affiliations WHERE id = p_affiliation_id FOR UPDATE;
  IF v_row.id IS NULL OR v_row.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Affiliation not found';
  END IF;

  UPDATE public.university_affiliations
  SET
    state = v_new,
    review_reason = btrim(p_reason),
    verification_method = CASE WHEN v_new = 'VERIFIED' THEN p_verification_method ELSE verification_method END,
    verified_at = CASE WHEN v_new = 'VERIFIED' THEN timezone('utc', now()) ELSE verified_at END,
    verified_by = CASE WHEN v_new = 'VERIFIED' THEN v_actor ELSE verified_by END,
    updated_at = timezone('utc', now())
  WHERE id = p_affiliation_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_affiliation.reviewed',
    'university_affiliation',
    p_affiliation_id,
    jsonb_build_object('state', v_row.state),
    jsonb_build_object('state', v_new, 'reason', btrim(p_reason))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Cohort + outcome RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.staff_ensure_university_cohort(
  p_catalog_university_id uuid,
  p_graduation_year smallint,
  p_major_id uuid DEFAULT NULL,
  p_program_text text DEFAULT NULL,
  p_degree_level public.university_degree_level_enum DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Staff authority required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_id
  FROM public.university_cohorts
  WHERE catalog_university_id = p_catalog_university_id
    AND graduation_year = p_graduation_year
    AND coalesce(major_id::text, '') = coalesce(p_major_id::text, '')
    AND coalesce(program_text, '') = coalesce(p_program_text, '');

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.university_cohorts (
    catalog_university_id, major_id, program_text, graduation_year, degree_level, created_by
  ) VALUES (
    p_catalog_university_id, p_major_id, nullif(btrim(p_program_text), ''), p_graduation_year, p_degree_level, v_actor
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_cohort.created',
    'university_cohort',
    v_id,
    NULL,
    jsonb_build_object('catalog_university_id', p_catalog_university_id, 'graduation_year', p_graduation_year)
  );
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_link_cohort_membership(
  p_cohort_id uuid,
  p_affiliation_id uuid,
  p_source public.university_cohort_membership_source_enum DEFAULT 'STAFF_LINK'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_aff public.university_affiliations%ROWTYPE;
  v_cohort public.university_cohorts%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'Staff authority required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_aff FROM public.university_affiliations WHERE id = p_affiliation_id;
  SELECT * INTO v_cohort FROM public.university_cohorts WHERE id = p_cohort_id;
  IF v_aff.id IS NULL OR v_cohort.id IS NULL THEN
    RAISE EXCEPTION 'Cohort or affiliation not found';
  END IF;
  IF v_aff.revoked_at IS NOT NULL OR v_aff.state <> 'VERIFIED' THEN
    RAISE EXCEPTION 'Only verified affiliations may join a cohort';
  END IF;
  IF v_aff.catalog_university_id IS DISTINCT FROM v_cohort.catalog_university_id THEN
    RAISE EXCEPTION 'Affiliation university does not match cohort';
  END IF;

  INSERT INTO public.university_cohort_memberships (
    cohort_id, affiliation_id, individual_id, source
  ) VALUES (
    p_cohort_id, p_affiliation_id, v_aff.individual_id, p_source
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_cohort.member_linked',
    'university_cohort_membership',
    v_id,
    NULL,
    jsonb_build_object('cohort_id', p_cohort_id, 'affiliation_id', p_affiliation_id, 'source', p_source)
  );
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_university_outcome_evidence(
  p_affiliation_id uuid,
  p_source public.university_outcome_source_enum,
  p_presence public.university_outcome_presence_enum,
  p_category public.university_outcome_category_enum,
  p_provenance_ref text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_aff public.university_affiliations%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_aff FROM public.university_affiliations WHERE id = p_affiliation_id AND revoked_at IS NULL;
  IF v_aff.id IS NULL THEN
    RAISE EXCEPTION 'Affiliation not found';
  END IF;

  IF p_source = 'USER_DECLARED' THEN
    IF v_aff.individual_id IS DISTINCT FROM v_actor THEN
      RAISE EXCEPTION 'Only the Individual may record a user-declared outcome' USING ERRCODE = '42501';
    END IF;
  ELSIF p_source IN ('INSTITUTION_GOVERNED', 'EXTERNAL_GOVERNMENT') THEN
    IF NOT public.is_privileged_staff() THEN
      RAISE EXCEPTION 'Staff authority required for institutional or external outcomes' USING ERRCODE = '42501';
    END IF;
  ELSIF p_source = 'VERIFIED_EMPLOYER' THEN
    IF NOT public.is_privileged_staff() THEN
      RAISE EXCEPTION 'Staff authority required to attach verified employer outcomes' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.university_outcome_evidence (
    affiliation_id, individual_id, catalog_university_id,
    source, presence, category, provenance_ref, recorded_by
  ) VALUES (
    p_affiliation_id, v_aff.individual_id, v_aff.catalog_university_id,
    p_source, p_presence, p_category, btrim(p_provenance_ref), v_actor
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_outcome.recorded',
    'university_outcome_evidence',
    v_id,
    NULL,
    jsonb_build_object('source', p_source, 'presence', p_presence, 'category', p_category)
  );
  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Owner foundation snapshot — aggregate only, fail closed without mapping.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.university_owner_foundation_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_catalog uuid;
  v_directory uuid;
  v_mapping uuid;
  v_mapping_at timestamptz;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('mapping_present', false, 'fail_closed_reason', 'unauthenticated');
  END IF;

  v_directory := public.current_owned_university_directory_id();
  IF v_directory IS NULL THEN
    RETURN jsonb_build_object('mapping_present', false, 'fail_closed_reason', 'no_owned_profile');
  END IF;

  SELECT m.id, m.catalog_university_id, m.created_at
    INTO v_mapping, v_catalog, v_mapping_at
  FROM public.university_identity_mappings m
  WHERE m.directory_id = v_directory
    AND m.mapping_state = 'active'
  LIMIT 1;

  IF v_mapping IS NULL OR v_catalog IS NULL THEN
    RETURN jsonb_build_object(
      'mapping_present', false,
      'directory_id', v_directory,
      'fail_closed_reason', 'unmapped'
    );
  END IF;

  RETURN jsonb_build_object(
    'mapping_present', true,
    'mapping_id', v_mapping,
    'directory_id', v_directory,
    'catalog_university_id', v_catalog,
    'mapped_at', v_mapping_at,
    'fail_closed_reason', NULL,
    'verified_affiliation_count', (
      SELECT count(*)::int FROM public.university_affiliations a
      WHERE a.catalog_university_id = v_catalog
        AND a.state = 'VERIFIED'
        AND a.revoked_at IS NULL
    ),
    'declared_affiliation_count_hidden', true,
    'cohorts', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'graduation_year', c.graduation_year,
        'degree_level', c.degree_level,
        'program_text', c.program_text,
        'major_id', c.major_id,
        'active_membership_count', (
          SELECT count(*)::int
          FROM public.university_cohort_memberships m
          JOIN public.university_affiliations a ON a.id = m.affiliation_id
          WHERE m.cohort_id = c.id
            AND m.state = 'ACTIVE'
            AND a.state = 'VERIFIED'
            AND a.revoked_at IS NULL
        )
      ) ORDER BY c.graduation_year DESC)
      FROM public.university_cohorts c
      WHERE c.catalog_university_id = v_catalog
    ), '[]'::jsonb),
    'outcome_counts', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'source', x.source,
        'presence', x.presence,
        'category', x.category,
        'count', x.n
      ))
      FROM (
        SELECT o.source, o.presence, o.category, count(*)::int AS n
        FROM public.university_outcome_evidence o
        WHERE o.catalog_university_id = v_catalog
          AND o.revoked_at IS NULL
        GROUP BY o.source, o.presence, o.category
      ) x
    ), '[]'::jsonb),
    'metrics', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'metric_key', d.metric_key,
        'name_ar', d.name_ar,
        'name_en', d.name_en,
        'source_definition', d.source_definition,
        'population_definition', d.population_definition,
        'window_definition', d.window_definition,
        'coverage_rule', d.coverage_rule,
        'missingness_rule', d.missingness_rule,
        'privacy_rule', d.privacy_rule,
        'computability', d.computability,
        'value', CASE
          WHEN d.metric_key = 'verified_affiliation_count' THEN (
            SELECT count(*)::int FROM public.university_affiliations a
            WHERE a.catalog_university_id = v_catalog AND a.state = 'VERIFIED' AND a.revoked_at IS NULL
          )
          WHEN d.metric_key = 'active_cohort_membership_count' THEN (
            SELECT count(*)::int
            FROM public.university_cohort_memberships m
            JOIN public.university_cohorts c ON c.id = m.cohort_id
            JOIN public.university_affiliations a ON a.id = m.affiliation_id
            WHERE c.catalog_university_id = v_catalog
              AND m.state = 'ACTIVE'
              AND a.state = 'VERIFIED'
              AND a.revoked_at IS NULL
          )
          WHEN d.metric_key = 'outcome_evidence_count' THEN (
            SELECT count(*)::int FROM public.university_outcome_evidence o
            WHERE o.catalog_university_id = v_catalog AND o.revoked_at IS NULL
          )
          ELSE NULL
        END
      ) ORDER BY d.metric_key)
      FROM public.university_metric_definitions d
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_university_identity_mapping(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_university_identity_mapping(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.declare_university_affiliation(uuid, public.university_person_status_enum, uuid, uuid, public.university_degree_level_enum, smallint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_university_affiliation_review(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_university_affiliation(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_review_university_affiliation(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_ensure_university_cohort(uuid, smallint, uuid, text, public.university_degree_level_enum) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_link_cohort_membership(uuid, uuid, public.university_cohort_membership_source_enum) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_university_outcome_evidence(uuid, public.university_outcome_source_enum, public.university_outcome_presence_enum, public.university_outcome_category_enum, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_owner_foundation_snapshot() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_university_identity_mapping(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_university_identity_mapping(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declare_university_affiliation(uuid, public.university_person_status_enum, uuid, uuid, public.university_degree_level_enum, smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_university_affiliation_review(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_university_affiliation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_review_university_affiliation(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_ensure_university_cohort(uuid, smallint, uuid, text, public.university_degree_level_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_link_cohort_membership(uuid, uuid, public.university_cohort_membership_source_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_university_outcome_evidence(uuid, public.university_outcome_source_enum, public.university_outcome_presence_enum, public.university_outcome_category_enum, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_owner_foundation_snapshot() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS — named Individual data never reaches University owners.
-- ---------------------------------------------------------------------------

ALTER TABLE public.university_identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_cohort_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_outcome_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_metric_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY university_identity_mappings_staff_select
  ON public.university_identity_mappings
  FOR SELECT TO authenticated
  USING (public.is_privileged_staff());

CREATE POLICY university_identity_mappings_owner_select
  ON public.university_identity_mappings
  FOR SELECT TO authenticated
  USING (
    mapping_state = 'active'
    AND directory_id = public.current_owned_university_directory_id()
  );

CREATE POLICY university_affiliations_own_select
  ON public.university_affiliations
  FOR SELECT TO authenticated
  USING (individual_id = (SELECT auth.uid()) OR public.is_privileged_staff());

CREATE POLICY university_cohorts_staff_or_mapped_owner_select
  ON public.university_cohorts
  FOR SELECT TO authenticated
  USING (
    public.is_privileged_staff()
    OR catalog_university_id = public.current_mapped_catalog_university_id()
  );

CREATE POLICY university_cohort_memberships_own_or_staff_select
  ON public.university_cohort_memberships
  FOR SELECT TO authenticated
  USING (individual_id = (SELECT auth.uid()) OR public.is_privileged_staff());

CREATE POLICY university_outcome_evidence_own_or_staff_select
  ON public.university_outcome_evidence
  FOR SELECT TO authenticated
  USING (individual_id = (SELECT auth.uid()) OR public.is_privileged_staff());

CREATE POLICY university_metric_definitions_authenticated_select
  ON public.university_metric_definitions
  FOR SELECT TO authenticated
  USING (true);
