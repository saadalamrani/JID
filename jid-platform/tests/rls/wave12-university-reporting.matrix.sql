-- Wave 12 RLS / privacy actor matrix (rollback-only).
-- Run against jid-nonprod inside a transaction that always rolls back.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_ok boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT coalesce(p_ok, false) THEN
    RAISE EXCEPTION 'ASSERT: %', p_message;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(p_uid uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text,
    true
  );
END $$;

DO $$
DECLARE
  v_staff uuid := 'b1000009-0000-4000-8000-000000000009';
  v_uni_owner uuid := 'b1000007-0000-4000-8000-000000000007';
  v_uni_pending uuid := 'b1000008-0000-4000-8000-000000000008';
  v_grad uuid := 'b1000001-0000-4000-8000-000000000001';
  v_other uuid := 'b1000002-0000-4000-8000-000000000002';
  v_biz uuid := 'b1000005-0000-4000-8000-000000000005';
  v_dir uuid := 'b2000003-0000-4000-8000-000000000003';
  v_catalog_a uuid;
  v_catalog_b uuid;
  v_map uuid;
  v_aff uuid;
  v_cohort uuid;
  v_preview jsonb;
  v_report jsonb;
  v_export jsonb;
  v_id uuid;
  v_named int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'university_report_generate'
  ) THEN
    RAISE EXCEPTION 'Wave 12 reporting RPCs missing';
  END IF;

  IF has_table_privilege('anon', 'public.university_report_snapshots', 'SELECT') THEN
    RAISE EXCEPTION 'P0: anon SELECT on report snapshots';
  END IF;
  IF has_table_privilege('authenticated', 'public.university_report_snapshots', 'INSERT') THEN
    RAISE EXCEPTION 'P0: authenticated INSERT on report snapshots';
  END IF;
  IF has_function_privilege('anon', 'public.university_report_generate(public.university_report_type_enum,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0: anon can generate reports';
  END IF;

  SELECT id INTO v_catalog_a FROM public.universities_catalog ORDER BY name_en LIMIT 1;
  SELECT id INTO v_catalog_b FROM public.universities_catalog ORDER BY name_en OFFSET 1 LIMIT 1;
  IF v_catalog_a IS NULL OR v_catalog_b IS NULL THEN
    RAISE EXCEPTION 'catalog universities missing';
  END IF;

  SET LOCAL ROLE authenticated;

  -- Unmapped owner fail closed.
  PERFORM pg_temp.as_user(v_uni_owner);
  SELECT public.university_report_preview('data_coverage_methodology', NULL) INTO v_preview;
  PERFORM pg_temp.assert_true(
    (v_preview ->> 'ok') = 'false'
    AND (v_preview ->> 'fail_closed_reason') IN ('unmapped', 'no_owned_profile'),
    'unmapped owner report preview fail closed'
  );

  -- Individual graduate cannot generate institutional reports.
  PERFORM pg_temp.as_user(v_grad);
  SELECT public.university_report_generate('cohort_outcome_summary', NULL) INTO v_report;
  PERFORM pg_temp.assert_true(
    (v_report ->> 'ok') = 'false',
    'individual graduate cannot generate university report'
  );

  -- Business cannot generate.
  PERFORM pg_temp.as_user(v_biz);
  SELECT public.university_report_generate('employer_alignment_summary', NULL) INTO v_report;
  PERFORM pg_temp.assert_true(
    (v_report ->> 'ok') = 'false',
    'business cannot generate university report'
  );

  -- Staff maps identity, verifies one graduate, small-n cohort.
  PERFORM pg_temp.as_user(v_staff);
  v_map := public.create_university_identity_mapping(
    v_catalog_a, v_dir, 'staff reconciling demo university for wave12 reports'
  );
  PERFORM pg_temp.as_user(v_grad);
  v_aff := public.declare_university_affiliation(
    v_catalog_a,
    'GRADUATE'::public.university_person_status_enum,
    NULL, NULL, NULL, 2024::smallint
  );
  PERFORM pg_temp.as_user(v_staff);
  PERFORM public.staff_review_university_affiliation(
    v_aff, 'VERIFIED', 'roster evidence reviewed by staff', 'MANUAL_REVIEW'
  );
  v_cohort := public.staff_ensure_university_cohort(
    v_catalog_a, 2024::smallint, NULL, 'Computer Science',
    'bachelor'::public.university_degree_level_enum
  );
  PERFORM public.staff_link_cohort_membership(
    v_cohort, v_aff, 'STAFF_LINK'::public.university_cohort_membership_source_enum
  );
  PERFORM public.record_university_outcome_evidence(
    v_aff,
    'VERIFIED_EMPLOYER'::public.university_outcome_source_enum,
    'KNOWN'::public.university_outcome_presence_enum,
    'EMPLOYED'::public.university_outcome_category_enum,
    'employer-file:wave12-small-n'
  );

  -- Mapped owner can generate; small-n remains suppressed in payload and export.
  PERFORM pg_temp.as_user(v_uni_owner);
  SELECT public.university_report_generate('cohort_outcome_summary', v_cohort) INTO v_report;
  PERFORM pg_temp.assert_true((v_report ->> 'ok') = 'true', 'mapped owner generated report');
  v_id := (v_report ->> 'report_id')::uuid;
  PERFORM pg_temp.assert_true(v_id IS NOT NULL, 'report id present');
  PERFORM pg_temp.assert_true((v_report -> 'benchmark' ->> 'status') = 'UNAVAILABLE', 'no live benchmark');
  PERFORM pg_temp.assert_true((v_report -> 'benchmark' ->> 'live') = 'false', 'benchmark live false');
  PERFORM pg_temp.assert_true((v_report -> 'accreditation_boundary' ->> 'certifies_compliance') = 'false', 'no accreditation claim');
  PERFORM pg_temp.assert_true(NOT (v_report ? 'email'), 'no email key');
  PERFORM pg_temp.assert_true(NOT (v_report ? 'individual_id'), 'no individual_id key');
  PERFORM pg_temp.assert_true(
    (v_report -> 'privacy_rules' -> 'named_graduate_fields') = '[]'::jsonb,
    'named graduate fields empty'
  );

  SELECT public.university_report_export_payload(v_id) INTO v_export;
  PERFORM pg_temp.assert_true((v_export ->> 'report_id') = v_id::text, 'export returns same snapshot');
  PERFORM pg_temp.assert_true(
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_export -> 'aggregates') a
      WHERE (a ->> 'suppressed') = 'true' AND a ->> 'value' IS NULL
    ),
    'suppressed aggregate remains null in export'
  );
  PERFORM pg_temp.assert_true(
    NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_export -> 'aggregates') a
      WHERE (a ->> 'suppressed') = 'true' AND a ->> 'value' IS NOT NULL
    ),
    'no suppressed value leaked through export'
  );

  SELECT count(*) INTO v_named FROM public.university_affiliations;
  PERFORM pg_temp.assert_true(v_named = 0, 'owner still cannot read named affiliations');

  -- Cross-university isolation.
  PERFORM pg_temp.as_user(v_uni_pending);
  SELECT public.university_report_get(v_id) INTO v_report;
  PERFORM pg_temp.assert_true(
    (v_report ->> 'ok') = 'false'
    AND (v_report ->> 'fail_closed_reason') IN ('unauthorized', 'unmapped', 'no_owned_profile'),
    'different/unmapped university denied snapshot'
  );
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_report_snapshots WHERE id = v_id) = 0,
    'unmapped owner cannot SELECT foreign snapshot row'
  );

  -- Staff authorized to read.
  PERFORM pg_temp.as_user(v_staff);
  SELECT public.university_report_get(v_id) INTO v_report;
  PERFORM pg_temp.assert_true((v_report ->> 'report_id') = v_id::text, 'staff can read snapshot');

  -- Unrelated individual denied.
  PERFORM pg_temp.as_user(v_other);
  SELECT public.university_report_get(v_id) INTO v_report;
  PERFORM pg_temp.assert_true((v_report ->> 'ok') = 'false', 'unrelated individual denied report');

  RESET ROLE;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    PERFORM 1 FROM public.university_report_snapshots LIMIT 1;
    RAISE EXCEPTION 'anon snapshots should be denied';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  RESET ROLE;
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.audit_logs WHERE action = 'university_report.generated') >= 1,
    'report generation audit present'
  );

  RAISE NOTICE 'WAVE12_RLS_ACTOR_MATRIX_PASS';
END $$;

SELECT 'WAVE12_RLS_ACTOR_MATRIX_PASS' AS result;
ROLLBACK;
