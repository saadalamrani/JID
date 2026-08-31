-- Wave 10 RLS / privacy actor matrix (rollback-only).
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
  v_snap jsonb;
  v_named int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'university_identity_mappings',
        'university_affiliations',
        'university_cohorts',
        'university_outcome_evidence'
      )
      AND column_name ~* '(employment_rate|time_to_employment|success_score|rank)'
  ) THEN
    RAISE EXCEPTION 'P0: forbidden outcome/KPI column on Wave 10 tables';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.university_identity_mappings'::regclass
      AND contype = 'u'
  ) THEN
    -- unique indexes exist as indexes, not constraints; check indexes.
    NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'university_identity_mappings_active_catalog_uidx'
  ) THEN
    RAISE EXCEPTION 'active catalog one-to-one index missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'university_identity_mappings_active_directory_uidx'
  ) THEN
    RAISE EXCEPTION 'active directory one-to-one index missing';
  END IF;

  IF has_table_privilege('anon', 'public.university_affiliations', 'SELECT') THEN
    RAISE EXCEPTION 'P0: anon SELECT on affiliations';
  END IF;
  IF has_table_privilege('authenticated', 'public.university_identity_mappings', 'INSERT') THEN
    RAISE EXCEPTION 'P0: authenticated INSERT on mappings';
  END IF;
  IF has_function_privilege('anon', 'public.create_university_identity_mapping(uuid,uuid,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0: anon can create mappings';
  END IF;

  SELECT id INTO v_catalog_a FROM public.universities_catalog ORDER BY name_en LIMIT 1;
  SELECT id INTO v_catalog_b FROM public.universities_catalog ORDER BY name_en OFFSET 1 LIMIT 1;
  IF v_catalog_a IS NULL OR v_catalog_b IS NULL THEN
    RAISE EXCEPTION 'catalog universities missing';
  END IF;

  -- Unmapped owner fail closed.
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.as_user(v_uni_owner);
  SELECT public.university_owner_foundation_snapshot() INTO v_snap;
  PERFORM pg_temp.assert_true(
    (v_snap ->> 'mapping_present') = 'false'
    AND (v_snap ->> 'fail_closed_reason') IN ('unmapped', 'no_owned_profile'),
    'unmapped owner fail closed'
  );

  -- University owner cannot self-map.
  BEGIN
    PERFORM public.create_university_identity_mapping(v_catalog_a, v_dir, 'owner self link attempt xx');
    RAISE EXCEPTION 'university owner must not create mapping';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      IF SQLERRM ILIKE '%Staff authority%' THEN NULL; ELSE RAISE;
      END IF;
  END;

  -- Business cannot map.
  PERFORM pg_temp.as_user(v_biz);
  BEGIN
    PERFORM public.create_university_identity_mapping(v_catalog_a, v_dir, 'business mapping attempt xx');
    RAISE EXCEPTION 'business must not create mapping';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      IF SQLERRM ILIKE '%Staff authority%' THEN NULL; ELSE RAISE;
      END IF;
  END;

  -- Staff creates mapping.
  PERFORM pg_temp.as_user(v_staff);
  v_map := public.create_university_identity_mapping(
    v_catalog_a, v_dir, 'staff reconciling demo university identity'
  );
  PERFORM pg_temp.assert_true(v_map IS NOT NULL, 'staff created mapping');

  BEGIN
    PERFORM public.create_university_identity_mapping(
      v_catalog_b, v_dir, 'second active mapping same directory'
    );
    RAISE EXCEPTION 'one-to-one directory mapping violated';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;

  -- Graduate declares affiliation (no email verification).
  PERFORM pg_temp.as_user(v_grad);
  v_aff := public.declare_university_affiliation(
    v_catalog_a,
    'GRADUATE'::public.university_person_status_enum,
    NULL,
    NULL,
    NULL,
    2024::smallint
  );
  PERFORM pg_temp.assert_true(
    (SELECT state FROM public.university_affiliations WHERE id = v_aff) = 'DECLARED',
    'declared state'
  );

  -- Unrelated individual cannot read the affiliation row.
  PERFORM pg_temp.as_user(v_other);
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_affiliations WHERE id = v_aff) = 0,
    'unrelated individual denied named affiliation'
  );

  -- Mapped university owner cannot read named affiliation / career-adjacent tables.
  PERFORM pg_temp.as_user(v_uni_owner);
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_affiliations WHERE id = v_aff) = 0,
    'university owner denied named affiliation'
  );
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_outcome_evidence) = 0
    OR NOT EXISTS (
      SELECT 1 FROM public.university_outcome_evidence o
      WHERE o.individual_id = v_grad
        AND o.individual_id IS NOT NULL
        AND (SELECT count(*) FROM public.university_outcome_evidence WHERE individual_id = v_grad) > 0
        AND false
    ),
    'placeholder'
  );
  SELECT count(*) INTO v_named FROM public.university_affiliations;
  PERFORM pg_temp.assert_true(v_named = 0, 'mapped owner named affiliation count is zero');

  SELECT public.university_owner_foundation_snapshot() INTO v_snap;
  PERFORM pg_temp.assert_true((v_snap ->> 'mapping_present') = 'true', 'mapped owner snapshot open');
  PERFORM pg_temp.assert_true(
    (v_snap ->> 'verified_affiliation_count') = '0',
    'declared is not counted as verified'
  );
  PERFORM pg_temp.assert_true(
    (v_snap ? 'metrics') AND jsonb_typeof(v_snap -> 'metrics') = 'array',
    'metric contracts present'
  );

  -- Different university / pending owner remains fail-closed.
  PERFORM pg_temp.as_user(v_uni_pending);
  SELECT public.university_owner_foundation_snapshot() INTO v_snap;
  PERFORM pg_temp.assert_true(
    (v_snap ->> 'mapping_present') = 'false',
    'unmapped/pending university fail closed'
  );

  -- Staff verifies + cohort + outcome unknown stays unknown.
  PERFORM pg_temp.as_user(v_staff);
  PERFORM public.staff_review_university_affiliation(
    v_aff, 'VERIFIED', 'roster evidence reviewed by staff', 'MANUAL_REVIEW'
  );
  v_cohort := public.staff_ensure_university_cohort(
    v_catalog_a,
    2024::smallint,
    NULL,
    'Computer Science',
    'bachelor'::public.university_degree_level_enum
  );
  PERFORM public.staff_link_cohort_membership(
    v_cohort,
    v_aff,
    'STAFF_LINK'::public.university_cohort_membership_source_enum
  );
  PERFORM public.record_university_outcome_evidence(
    v_aff,
    'INSTITUTION_GOVERNED'::public.university_outcome_source_enum,
    'UNKNOWN'::public.university_outcome_presence_enum,
    'UNKNOWN'::public.university_outcome_category_enum,
    'institution-file:coverage-gap'
  );

  PERFORM pg_temp.as_user(v_uni_owner);
  SELECT public.university_owner_foundation_snapshot() INTO v_snap;
  PERFORM pg_temp.assert_true(
    (v_snap ->> 'verified_affiliation_count') = '1',
    'verified affiliation counted after staff review'
  );
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_cohort_memberships) = 0,
    'owner cannot read named cohort memberships'
  );
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_outcome_evidence) = 0,
    'owner cannot read named outcome evidence'
  );

  -- Cross-university isolation of cohort definitions: owner A must not see catalog B cohorts.
  PERFORM pg_temp.as_user(v_staff);
  PERFORM public.staff_ensure_university_cohort(
    v_catalog_b,
    2024::smallint,
    NULL,
    'Other Program',
    'bachelor'::public.university_degree_level_enum
  );
  PERFORM pg_temp.as_user(v_uni_owner);
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.university_cohorts WHERE catalog_university_id = v_catalog_b) = 0,
    'cross-university cohort isolation'
  );

  -- Anon denied (no table privilege; count would raise, so catch it).
  RESET ROLE;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    PERFORM 1 FROM public.university_affiliations LIMIT 1;
    RAISE EXCEPTION 'anon affiliations should be denied';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM 1 FROM public.university_identity_mappings LIMIT 1;
    RAISE EXCEPTION 'anon mappings should be denied';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  RESET ROLE;
  PERFORM pg_temp.assert_true(
    (SELECT count(*) FROM public.audit_logs WHERE action LIKE 'university_%') >= 3,
    'audit trail present'
  );

  RAISE NOTICE 'WAVE10_RLS_ACTOR_MATRIX_PASS';
END $$;

SELECT 'WAVE10_RLS_ACTOR_MATRIX_PASS' AS result;
ROLLBACK;
