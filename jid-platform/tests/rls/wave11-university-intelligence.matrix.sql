-- Wave 11 aggregate/privacy actor matrix. Rollback-only against jid-nonprod.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_ok boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN
  IF NOT coalesce(p_ok, false) THEN RAISE EXCEPTION 'ASSERT: %', p_message; END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(p_uid uuid)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, true);
END $$;

DO $$
DECLARE
  v_staff uuid := 'b1000009-0000-4000-8000-000000000009';
  v_owner uuid := 'b1000007-0000-4000-8000-000000000007';
  v_other_owner uuid := 'b1000008-0000-4000-8000-000000000008';
  v_grad uuid := 'b1000001-0000-4000-8000-000000000001';
  v_individual uuid := 'b1000002-0000-4000-8000-000000000002';
  v_business uuid := 'b1000005-0000-4000-8000-000000000005';
  v_directory uuid := 'b2000003-0000-4000-8000-000000000003';
  v_catalog uuid;
  v_snapshot jsonb;
BEGIN
  SELECT id INTO v_catalog FROM public.universities_catalog ORDER BY name_en LIMIT 1;

  IF has_function_privilege('anon', 'public.university_owner_intelligence_snapshot(uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.upsert_university_readiness_activity(uuid,uuid,public.university_readiness_activity_type_enum,text,text,timestamptz,timestamptz,public.university_readiness_activity_status_enum,integer,text)', 'EXECUTE')
  THEN RAISE EXCEPTION 'P0: anon Wave 11 RPC execute'; END IF;
  IF has_table_privilege('authenticated', 'public.university_readiness_activities', 'INSERT')
    OR has_table_privilege('authenticated', 'public.university_program_alignment_evidence', 'INSERT')
  THEN RAISE EXCEPTION 'P0: direct authenticated operational write'; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.as_user(v_owner);
  SELECT public.university_owner_intelligence_snapshot(NULL) INTO v_snapshot;
  PERFORM pg_temp.assert_true((v_snapshot->>'mapping_present')='false', 'unmapped owner fails closed');

  PERFORM pg_temp.as_user(v_business);
  BEGIN
    PERFORM public.upsert_university_readiness_activity(NULL,NULL,'CAREER_WORKSHOP','ورشة مهنية','Career workshop',now(),NULL,'PLANNED',NULL,'matrix:business');
    RAISE EXCEPTION 'Business created University activity';
  EXCEPTION WHEN insufficient_privilege THEN NULL; WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%Mapped University authority%' THEN RAISE; END IF;
  END;

  PERFORM pg_temp.as_user(v_individual);
  SELECT public.university_owner_intelligence_snapshot(NULL) INTO v_snapshot;
  PERFORM pg_temp.assert_true((v_snapshot->>'mapping_present')='false', 'unrelated Individual gets no aggregate');

  PERFORM pg_temp.as_user(v_staff);
  PERFORM public.create_university_identity_mapping(v_catalog,v_directory,'Wave 11 actor matrix mapping');
END $$;

-- Complete fixture in a second block so actor switches are explicit.
DO $$
DECLARE
  v_staff uuid := 'b1000009-0000-4000-8000-000000000009';
  v_owner uuid := 'b1000007-0000-4000-8000-000000000007';
  v_other_owner uuid := 'b1000008-0000-4000-8000-000000000008';
  v_grad uuid := 'b1000001-0000-4000-8000-000000000001';
  v_catalog uuid := public.current_mapped_catalog_university_id();
  v_affiliation uuid; v_cohort uuid; v_activity uuid; v_job uuid; v_snapshot jsonb;
BEGIN
  -- Staff is current actor here; resolve catalog from the mapping directly.
  SELECT catalog_university_id INTO v_catalog FROM public.university_identity_mappings WHERE mapping_state='active' ORDER BY created_at DESC LIMIT 1;
  PERFORM pg_temp.as_user(v_grad);
  v_affiliation := public.declare_university_affiliation(v_catalog,'GRADUATE',NULL,NULL,NULL,2024::smallint);
  PERFORM pg_temp.as_user(v_staff);
  PERFORM public.staff_review_university_affiliation(v_affiliation,'VERIFIED','Wave 11 roster evidence','MANUAL_REVIEW');
  v_cohort := public.staff_ensure_university_cohort(v_catalog,2024::smallint,NULL,'Wave 11 Program','bachelor');
  PERFORM public.staff_link_cohort_membership(v_cohort,v_affiliation,'STAFF_LINK');
  PERFORM public.record_university_outcome_evidence(v_affiliation,'INSTITUTION_GOVERNED','KNOWN','EMPLOYED','matrix:explicit-known');

  PERFORM pg_temp.as_user(v_owner);
  SELECT public.university_owner_intelligence_snapshot(v_cohort) INTO v_snapshot;
  PERFORM pg_temp.assert_true((v_snapshot->>'suppressed')='true', 'small-n group suppressed');
  PERFORM pg_temp.assert_true(v_snapshot->'eligible_population'='null'::jsonb, 'small-n denominator hidden');
  PERFORM pg_temp.assert_true(v_snapshot->'outcome_distribution'='[]'::jsonb, 'small-n distribution hidden');
  PERFORM pg_temp.assert_true(NOT (v_snapshot::text ~ 'b1000001'), 'named graduate id absent');
  PERFORM pg_temp.assert_true((SELECT count(*) FROM public.career_evidence WHERE subject_id=v_grad)=0, 'private Career Record denied');
  PERFORM pg_temp.assert_true((SELECT count(*) FROM public.hiring_notes)=0, 'employer-private notes denied');

  v_activity := public.upsert_university_readiness_activity(NULL,v_cohort,'CAREER_WORKSHOP','ورشة الاستعداد المهني','Career readiness workshop',now(),NULL,'PLANNED',NULL,'matrix:activity');
  PERFORM pg_temp.assert_true(v_activity IS NOT NULL, 'mapped owner creates scoped readiness activity');
  PERFORM pg_temp.assert_true((SELECT participation_count FROM public.university_readiness_activities WHERE id=v_activity) IS NULL, 'unknown participation stays null');

  SELECT id INTO v_job FROM public.jobs WHERE status IN ('published','closing_soon') ORDER BY published_at DESC NULLS LAST LIMIT 1;
  IF v_job IS NOT NULL THEN
    PERFORM public.record_university_program_alignment(v_cohort,v_job,'ارتباط صريح بفرصة منشورة','Explicit link to a published Opportunity','matrix:alignment');
  END IF;

  PERFORM pg_temp.as_user(v_other_owner);
  SELECT public.university_owner_intelligence_snapshot(NULL) INTO v_snapshot;
  PERFORM pg_temp.assert_true((v_snapshot->>'mapping_present')='false', 'different University fails closed');
  SELECT public.university_owner_intelligence_snapshot(v_cohort) INTO v_snapshot;
  PERFORM pg_temp.assert_true((v_snapshot->>'mapping_present')='false' AND NOT (v_snapshot ? 'eligible_population'), 'different University cannot probe foreign cohort');
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.university_owner_intelligence_snapshot(NULL); RAISE EXCEPTION 'anon snapshot executed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

SELECT 'WAVE11_RLS_ACTOR_MATRIX_PASS' AS result;
ROLLBACK;
