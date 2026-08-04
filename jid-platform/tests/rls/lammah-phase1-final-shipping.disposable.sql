\set ON_ERROR_STOP on

-- Lammah Phase 1 disposable proof. All roles and rows are rolled back.
CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_value boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT COALESCE(p_value,false) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: %',p_message;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.expect_error(p_sql text, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE p_sql; EXCEPTION WHEN OTHERS THEN RETURN; END;
  RAISE EXCEPTION 'EXPECTED_ERROR_NOT_RAISED: %',p_message;
END;
$$;

BEGIN;

-- Disposable stacks started with newer Supabase CLI may omit the historical
-- authenticated SELECT grants that non-production already has. Restore the
-- minimum surface the Lammah matrix and staff RLS subqueries require.
GRANT SELECT ON TABLE public.profiles, public.companies, public.jobs,
  public.feature_flags, public.regions, public.applications,
  public.communication_batches, public.communication_log,
  public.lammah_radar_items, public.verification_requests,
  public.lammah_sources, public.lammah_opportunities
TO authenticated;

SELECT pg_temp.assert_true(
  (SELECT count(*)=12
   FROM pg_class relation
   JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
   WHERE namespace.nspname='public' AND relation.relkind='r'
     AND relation.relname=ANY(ARRAY[
       'lammah_sync_runs','lammah_raw_evidence','lammah_import_candidates',
       'lammah_candidate_facts','lammah_opportunity_facts','lammah_source_links',
       'lammah_duplicate_candidates','lammah_native_match_events',
       'lammah_lifecycle_events','lammah_review_queue','lammah_org_mapping_queue',
       'lammah_dead_letters'
     ])),
  'all twelve adjacent governed Lammah tables exist'
);

SELECT pg_temp.assert_true(
  (SELECT bool_and(relrowsecurity AND relforcerowsecurity)
   FROM pg_class WHERE oid=ANY(ARRAY[
     'public.lammah_sync_runs'::regclass,'public.lammah_raw_evidence'::regclass,
     'public.lammah_import_candidates'::regclass,'public.lammah_candidate_facts'::regclass,
     'public.lammah_opportunity_facts'::regclass,'public.lammah_source_links'::regclass,
     'public.lammah_duplicate_candidates'::regclass,'public.lammah_native_match_events'::regclass,
     'public.lammah_lifecycle_events'::regclass,'public.lammah_review_queue'::regclass,
     'public.lammah_org_mapping_queue'::regclass,'public.lammah_dead_letters'::regclass
   ])),
  'forced RLS protects every adjacent Lammah table'
);

SELECT pg_temp.assert_true(
  NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='lammah_worker_eu_careers'),
  'migration does not create the out-of-band LOGIN worker'
);

SELECT pg_temp.assert_true(
  (SELECT count(*)=4 AND bool_and(NOT is_enabled)
   FROM public.feature_flags
   WHERE key=ANY(ARRAY[
     'lammah.phase1_ingestion','lammah.connector_enabled',
     'lammah.auto_publication_enabled','lammah.catalog_bridge_enabled'
   ])),
  'all four Lammah operational flags default off'
);

SELECT pg_temp.assert_true(
  NOT has_schema_privilege('lammah_function_owner','public','CREATE')
  AND NOT pg_has_role('postgres','lammah_function_owner','USAGE'),
  'bounded function-owner handshake is revoked after migration'
);

SELECT pg_temp.assert_true(
  (SELECT approval_state='approved' AND robots_ok
      AND licence_basis IS NOT NULL AND terms_url IS NOT NULL
      AND robots_url IS NOT NULL AND apply_url_pattern IS NOT NULL
      AND record_identity_strategy IS NOT NULL AND technical_format IS NOT NULL
      AND evidence_retention_terms IS NOT NULL
      AND rate_limit_policy->>'max_pages'='1'
      AND rate_limit_policy->>'max_records'='20'
      AND rate_limit_policy->>'min_delay_ms'='1500'
      AND rate_limit_policy->>'request_timeout_ms'='15000'
      AND rate_limit_policy->>'retry_limit'='3'
   FROM public.lammah_sources WHERE source_key='eu_careers_cast'),
  'the single Phase-1 source carries the complete qualification record'
);

SET session_replication_role=replica;
INSERT INTO auth.users (
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
  confirmation_token,recovery_token,email_change_token_new,email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000','1a660001-0000-4000-8000-000000000001','authenticated','authenticated','lammah-reviewer@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','1a660002-0000-4000-8000-000000000002','authenticated','authenticated','lammah-super@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','1a660003-0000-4000-8000-000000000003','authenticated','authenticated','lammah-admin@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','1a660004-0000-4000-8000-000000000004','authenticated','authenticated','lammah-unentitled@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','1a660005-0000-4000-8000-000000000005','authenticated','authenticated','lammah-biz-owner@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','1a660006-0000-4000-8000-000000000006','authenticated','authenticated','lammah-entitled@pilot-synth.jid.local',crypt('x',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');

INSERT INTO public.profiles(id,full_name,role) VALUES
  ('1a660001-0000-4000-8000-000000000001','Lammah reviewer','staff'),
  ('1a660002-0000-4000-8000-000000000002','Lammah super admin','super_admin'),
  ('1a660003-0000-4000-8000-000000000003','Lammah admin denied','admin'),
  ('1a660004-0000-4000-8000-000000000004','Lammah unentitled actor','individual'),
  ('1a660006-0000-4000-8000-000000000006','Lammah entitled actor','individual');

INSERT INTO public.companies(
  id,name,name_ar,slug,entity_type,claimed_by,claim_requested_at,is_verified
) VALUES (
  '1a660101-0000-4000-8000-000000000101',
  'PILOT-SYNTH-Lammah Native Company','شركة لمّاح الاصطناعية',
  'pilot-synth-lammah-native-company','business',NULL,NULL,false
);

INSERT INTO public.business_profiles(
  id,directory_id,owner_user_id,display_name_ar,display_name_en,status,published_at
) VALUES (
  '1a660102-0000-4000-8000-000000000102',
  '1a660101-0000-4000-8000-000000000101',
  '1a660005-0000-4000-8000-000000000005',
  'شركة لمّاح الاصطناعية','PILOT-SYNTH-Lammah Native Company','published',now()
);
SET session_replication_role=origin;

INSERT INTO public.plans(
  id,key,name_ar,name_en,audience,price_monthly_sar,price_yearly_sar
) VALUES (
  '1a660201-0000-4000-8000-000000000201',
  'pilot-synth-lammah-entitled','خطة لمّاح الاختبارية',
  'PILOT-SYNTH Lammah entitlement','user',0,0
);
INSERT INTO public.plan_entitlements(plan_id,feature_key) VALUES
  ('1a660201-0000-4000-8000-000000000201','lammah_feed');
INSERT INTO public.subscriptions(
  id,plan_id,user_id,subscriber_type,billing_cycle,status,current_period_end
) VALUES (
  '1a660202-0000-4000-8000-000000000202',
  '1a660201-0000-4000-8000-000000000201',
  '1a660006-0000-4000-8000-000000000006',
  'user','monthly','active',now()+interval '30 days'
);

SELECT set_config('lammah.fixture_profiles_before',(SELECT count(*)::text FROM public.profiles),false);
SELECT set_config('lammah.fixture_verification_before',(SELECT count(*)::text FROM public.verification_requests),false);
SELECT set_config('lammah.fixture_applications_before',(SELECT count(*)::text FROM public.applications),false);
SELECT set_config('lammah.fixture_batches_before',(SELECT count(*)::text FROM public.communication_batches),false);
SELECT set_config('lammah.fixture_logs_before',(SELECT count(*)::text FROM public.communication_log),false);
SELECT set_config('lammah.fixture_radar_before',(SELECT count(*)::text FROM public.lammah_radar_items),false);

CREATE ROLE lammah_worker_eu_careers_fixture LOGIN INHERIT NOBYPASSRLS NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION IN ROLE lammah_worker;
GRANT lammah_worker_eu_careers_fixture TO postgres;

SET ROLE lammah_worker_eu_careers_fixture;
SELECT pg_temp.assert_true(
  public.lammah_begin_run('PILOT-SYNTH-DISABLED','incremental','lammah_worker_eu_careers_fixture')->>'code'='disabled',
  'worker cannot begin while the master and connector flags are off'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  NOT has_table_privilege('lammah_worker_eu_careers_fixture','public.lammah_raw_evidence','SELECT')
  AND NOT has_table_privilege('lammah_worker_eu_careers_fixture','public.lammah_import_candidates','INSERT')
  AND NOT has_table_privilege('lammah_worker_eu_careers_fixture','public.lammah_opportunities','INSERT')
  AND NOT has_table_privilege('lammah_worker_eu_careers_fixture','public.jobs','INSERT')
  AND has_function_privilege('lammah_worker_eu_careers_fixture','public.lammah_begin_run(text,text,text)','EXECUTE')
  AND has_function_privilege('lammah_worker_eu_careers_fixture','public.ingest_lammah_candidate(uuid,jsonb)','EXECUTE'),
  'worker inherits bounded functions and no direct product or evidence-table access'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.configure_lammah_phase1(true,true,false,true,false,'Disposable manual-review phase')->>'ok')::boolean,
  'Super Admin enables ingestion while automatic publication stays off'
);
RESET ROLE;

SET ROLE lammah_worker_eu_careers_fixture;
SELECT pg_temp.assert_true(
  (public.lammah_begin_run(
    'PILOT-SYNTH-LAMMAH-DISPOSABLE-001','incremental','lammah_worker_eu_careers_fixture'
  )->>'ok')::boolean,
  'restricted worker begins one enabled run'
);
SELECT pg_temp.assert_true(
  public.lammah_begin_run(
    'PILOT-SYNTH-LAMMAH-DISPOSABLE-002','incremental','lammah_worker_eu_careers_fixture'
  )->>'code'='already_running_or_replayed',
  'single-flight boundary rejects a concurrent source run'
);
RESET ROLE;

SELECT set_config('lammah.fixture_run_id',(
  SELECT id::text FROM public.lammah_sync_runs
  WHERE external_run_id='PILOT-SYNTH-LAMMAH-DISPOSABLE-001'
),false);

SET ROLE lammah_worker_eu_careers_fixture;
DO $$
DECLARE
  v_result jsonb;
  v_replay jsonb;
BEGIN
  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-MANUAL-A',
      'checksum_sha256',repeat('a',64),
      'request_identity','PILOT-SYNTH-MANUAL-A',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-manual-a',
      'apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'final_apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-manual-a'),
      'url_validation_evidence',jsonb_build_object('status_code',200,'final_host','europa.eu'),
      'retrieved_at',now(),
      'source_published_at',now()-interval '1 day',
      'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job',
      'title_original','PILOT-SYNTH Manual opportunity A',
      'title_en','PILOT-SYNTH Manual opportunity A',
      'organization_raw_name','European Union',
      'location_country','Germany',
      'location_city','Frankfurt',
      'payload_body','<html><body>PILOT-SYNTH-MANUAL-A</body></html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Manual opportunity A'),
      'content_type','text/html',
      'personal_data_dominated',false,
      'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'manual candidate A is accepted');
  PERFORM set_config('lammah.fixture_candidate_a',v_result->>'candidate_id',false);
  PERFORM pg_temp.assert_true(v_result->>'state'='pending_review','manual candidate routes to review while auto is off');

  v_replay:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-MANUAL-A',
      'checksum_sha256',repeat('a',64),
      'request_identity','PILOT-SYNTH-MANUAL-A',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-manual-a',
      'apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'final_apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-manual-a'),
      'url_validation_evidence',jsonb_build_object('status_code',200,'final_host','europa.eu'),
      'retrieved_at',now(),
      'source_published_at',now()-interval '1 day',
      'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job',
      'title_original','PILOT-SYNTH Manual opportunity A',
      'title_en','PILOT-SYNTH Manual opportunity A',
      'organization_raw_name','European Union',
      'location_country','Germany',
      'location_city','Frankfurt',
      'payload_body','<html><body>PILOT-SYNTH-MANUAL-A</body></html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Manual opportunity A'),
      'content_type','text/html',
      'personal_data_dominated',false,
      'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true(
    (v_replay->>'ok')::boolean AND v_replay->>'code'='replayed'
      AND v_replay->>'candidate_id'=v_result->>'candidate_id',
    'identical retrieval replays the same candidate'
  );
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.lammah_import_candidates
   WHERE source_record_id='PILOT-SYNTH-MANUAL-A')
  AND (SELECT replayed_count=1 FROM public.lammah_sync_runs
       WHERE id=current_setting('lammah.fixture_run_id')::uuid),
  'replay produces no duplicate row and increments the run counter'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660003-0000-4000-8000-000000000003',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.lammah_import_candidates)
  AND public.claim_lammah_candidate(current_setting('lammah.fixture_candidate_a')::uuid)->>'code'='lammah_review_forbidden',
  'admin is explicitly denied from Lammah internals and review RPCs'
);
SELECT set_config('request.jwt.claim.sub','1a660004-0000-4000-8000-000000000004',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.lammah_import_candidates),
  'ordinary authenticated user cannot read Lammah internals'
);
SELECT set_config('request.jwt.claim.sub','1a660001-0000-4000-8000-000000000001',false);
DO $$
DECLARE v_result jsonb;
BEGIN
  v_result:=public.claim_lammah_candidate(current_setting('lammah.fixture_candidate_a')::uuid);
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND NOT (v_result->>'view_only')::boolean,'Staff claims candidate A');
  v_result:=public.review_lammah_candidate(
    current_setting('lammah.fixture_candidate_a')::uuid,'approve',
    'Official source evidence, deterministic URL, and exact facts reviewed.',NULL,NULL
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'Staff approves candidate A after manual gates');
  v_result:=public.publish_lammah_candidate(
    current_setting('lammah.fixture_candidate_a')::uuid,
    'Manual publication after complete evidence review.'
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'Staff publishes approved candidate A');
  PERFORM set_config('lammah.fixture_opportunity_a',v_result->>'opportunity_id',false);
  v_result:=public.publish_lammah_candidate(
    current_setting('lammah.fixture_candidate_a')::uuid,
    'Idempotent publication replay.'
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND v_result->>'code'='already_published','publication replay is idempotent');
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT status='active' AND publication_candidate_id=current_setting('lammah.fixture_candidate_a')::uuid
      AND source_name='EU Careers / EPSO'
      AND location_country='Germany' AND location_city='Frankfurt'
   FROM public.lammah_opportunities WHERE id=current_setting('lammah.fixture_opportunity_a')::uuid)
  AND (SELECT count(*)>=7 FROM public.lammah_opportunity_facts
       WHERE opportunity_id=current_setting('lammah.fixture_opportunity_a')::uuid AND active)
  AND (SELECT bool_and(provenance_snapshot ? 'evidence_checksum' AND provenance_snapshot ? 'source_url')
       FROM public.lammah_opportunity_facts
       WHERE opportunity_id=current_setting('lammah.fixture_opportunity_a')::uuid AND active)
  AND (SELECT count(*)=1 FROM public.lammah_source_links
       WHERE opportunity_id=current_setting('lammah.fixture_opportunity_a')::uuid),
  'manual publication retains official link and field-level provenance'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660004-0000-4000-8000-000000000004',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=0 FROM public.lammah_opportunities
   WHERE id=current_setting('lammah.fixture_opportunity_a')::uuid)
  AND public.report_lammah_problem(
    current_setting('lammah.fixture_opportunity_a')::uuid,'PILOT-SYNTH entitlement denial'
  )->>'code'='lammah_entitlement_required',
  'unentitled user cannot read inventory or invoke the report action'
);
SELECT set_config('request.jwt.claim.sub','1a660006-0000-4000-8000-000000000006',false);
SELECT pg_temp.assert_true(
  (SELECT count(*)=1 FROM public.lammah_opportunities
   WHERE id=current_setting('lammah.fixture_opportunity_a')::uuid),
  'entitled user can read the active current opportunity'
);
RESET ROLE;

SET ROLE anon;
SELECT pg_temp.expect_error(
  'SELECT count(*) FROM public.lammah_opportunities',
  'anonymous actor has no Lammah inventory table privilege'
);
RESET ROLE;

SET ROLE lammah_worker_eu_careers_fixture;
DO $$
DECLARE v_result jsonb;
BEGIN
  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-DUPLICATE-B','checksum_sha256',repeat('b',64),
      'request_identity','PILOT-SYNTH-DUPLICATE-B',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-duplicate-b',
      'apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'final_apply_url','https://europa.eu/apply/pilot-synth-manual-a',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-manual-a'),
      'url_validation_evidence',jsonb_build_object('status_code',200),
      'retrieved_at',now(),'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job','title_original','PILOT-SYNTH Duplicate B',
      'title_en','PILOT-SYNTH Duplicate B','organization_raw_name','European Union',
      'payload_body','<html>PILOT-SYNTH-DUPLICATE-B</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Duplicate B'),
      'content_type','text/html','personal_data_dominated',false,'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean,'duplicate candidate B is retained for review');
  PERFORM set_config('lammah.fixture_candidate_b',v_result->>'candidate_id',false);
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT match_outcome='duplicate_external' AND review_flags=ARRAY['duplicate_external']::text[]
   FROM public.lammah_import_candidates WHERE id=current_setting('lammah.fixture_candidate_b')::uuid)
  AND (SELECT count(*)=1 AND bool_and(deterministic)
       FROM public.lammah_duplicate_candidates
       WHERE candidate_id=current_setting('lammah.fixture_candidate_b')::uuid),
  'normalized official URL creates an explicit deterministic external-duplicate case'
);

INSERT INTO public.jobs(
  id,business_profile_id,company_id,title_ar,title_en,status,application_deadline,
  published_at,external_apply_url,experience_level
) VALUES (
  '1a660103-0000-4000-8000-000000000103',
  '1a660102-0000-4000-8000-000000000102',
  '1a660101-0000-4000-8000-000000000101',
  'PILOT-SYNTH Native precedence','PILOT-SYNTH Native precedence','published',
  now()+interval '30 days',now(),'https://europa.eu/apply/pilot-synth-native','entry'
);

SET ROLE lammah_worker_eu_careers_fixture;
DO $$
DECLARE v_result jsonb;
BEGIN
  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-NATIVE-C','checksum_sha256',repeat('c',64),
      'request_identity','PILOT-SYNTH-NATIVE-C',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-native-c',
      'apply_url','https://europa.eu/apply/pilot-synth-native',
      'final_apply_url','https://europa.eu/apply/pilot-synth-native',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-native'),
      'url_validation_evidence',jsonb_build_object('status_code',200),
      'retrieved_at',now(),'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job','title_original','PILOT-SYNTH Native precedence',
      'title_en','PILOT-SYNTH Native precedence','organization_raw_name','PILOT-SYNTH-Lammah Native Company',
      'payload_body','<html>PILOT-SYNTH-NATIVE-C</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Native precedence'),
      'content_type','text/html','personal_data_dominated',false,'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND v_result->>'state'='suppressed_by_native','native published job suppresses candidate C');
  PERFORM set_config('lammah.fixture_candidate_c',v_result->>'candidate_id',false);
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*)=1 AND bool_and(deterministic)
   FROM public.lammah_native_match_events
   WHERE candidate_id=current_setting('lammah.fixture_candidate_c')::uuid
     AND native_job_id='1a660103-0000-4000-8000-000000000103')
  AND NOT EXISTS(SELECT 1 FROM public.lammah_review_queue
                 WHERE candidate_id=current_setting('lammah.fixture_candidate_c')::uuid)
  AND NOT EXISTS(SELECT 1 FROM public.lammah_opportunities
                 WHERE publication_candidate_id=current_setting('lammah.fixture_candidate_c')::uuid),
  'native precedence is terminal before Lammah publication'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.configure_lammah_phase1(true,true,true,true,true,'Disposable earned automatic publication')->>'ok')::boolean,
  'Super Admin enables both global and source automatic-publication gates'
);
RESET ROLE;

SET ROLE lammah_worker_eu_careers_fixture;
DO $$
DECLARE v_result jsonb;
BEGIN
  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-AUTO-D','checksum_sha256',repeat('d',64),
      'request_identity','PILOT-SYNTH-AUTO-D',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-auto-d',
      'apply_url','https://europa.eu/apply/pilot-synth-auto-d',
      'final_apply_url','https://europa.eu/apply/pilot-synth-auto-d',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-auto-d'),
      'url_validation_evidence',jsonb_build_object('status_code',200),
      'retrieved_at',now(),'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job','title_original','PILOT-SYNTH Automatic D',
      'title_en','PILOT-SYNTH Automatic D','organization_raw_name','European Union',
      'payload_body','<html>PILOT-SYNTH-AUTO-D</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Automatic D'),
      'content_type','text/html','personal_data_dominated',false,'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND v_result->>'state'='published','eligible candidate D auto-publishes');
  PERFORM set_config('lammah.fixture_candidate_d',v_result->>'candidate_id',false);
  PERFORM set_config('lammah.fixture_opportunity_d',v_result->>'published_opportunity_id',false);
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT auto_gate_checklist->>'eligible'='true'
      AND (SELECT count(*)=13 FROM jsonb_object_keys(auto_gate_checklist) key WHERE key LIKE 'gate_%')
   FROM public.lammah_import_candidates WHERE id=current_setting('lammah.fixture_candidate_d')::uuid)
  AND EXISTS(
    SELECT 1 FROM public.lammah_lifecycle_events
    WHERE candidate_id=current_setting('lammah.fixture_candidate_d')::uuid
      AND event_type='opportunity_auto_published'
      AND (details->'gate_checklist'->>'eligible')::boolean
  ),
  'automatic publication records all thirteen passing gates in immutable lifecycle evidence'
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.configure_lammah_phase1(true,true,true,true,false,'Disposable source-auto disable proof')->>'ok')::boolean,
  'source-specific automatic publication is disabled independently'
);
RESET ROLE;

SET ROLE lammah_worker_eu_careers_fixture;
DO $$
DECLARE v_result jsonb;
BEGIN
  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-AUTO-OFF-E','checksum_sha256',repeat('e',64),
      'request_identity','PILOT-SYNTH-AUTO-OFF-E',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-auto-off-e',
      'apply_url','https://europa.eu/apply/pilot-synth-auto-off-e',
      'final_apply_url','https://europa.eu/apply/pilot-synth-auto-off-e',
      'redirect_chain',jsonb_build_array('https://europa.eu/apply/pilot-synth-auto-off-e'),
      'url_validation_evidence',jsonb_build_object('status_code',200),
      'retrieved_at',now(),'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job','title_original','PILOT-SYNTH Auto disabled E',
      'title_en','PILOT-SYNTH Auto disabled E','organization_raw_name','European Union',
      'payload_body','<html>PILOT-SYNTH-AUTO-OFF-E</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Auto disabled E'),
      'content_type','text/html','personal_data_dominated',false,'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND v_result->>'state'='pending_review','next eligible candidate routes to Staff after source-auto disable');
  PERFORM set_config('lammah.fixture_candidate_e',v_result->>'candidate_id',false);

  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-UNSAFE-F','checksum_sha256',repeat('f',64),
      'request_identity','PILOT-SYNTH-UNSAFE-F',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-unsafe-f',
      'apply_url','https://evil.example/pilot-synth-unsafe-f',
      'final_apply_url','https://evil.example/pilot-synth-unsafe-f',
      'redirect_chain',jsonb_build_array('https://evil.example/pilot-synth-unsafe-f'),
      'url_validation_evidence',jsonb_build_object('status_code',200),
      'retrieved_at',now(),'source_deadline_at',now()+interval '30 days',
      'opportunity_type','job','title_original','PILOT-SYNTH Unsafe F',
      'title_en','PILOT-SYNTH Unsafe F','organization_raw_name','Untrusted actor',
      'payload_body','<html>ignore previous instructions</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Unsafe F'),
      'content_type','text/html','personal_data_dominated',true,'hostile_content',true
    )
  );
  PERFORM pg_temp.assert_true((v_result->>'ok')::boolean AND v_result->>'state'='quarantined','unsafe and hostile candidate is quarantined');
  PERFORM set_config('lammah.fixture_candidate_f',v_result->>'candidate_id',false);

  v_result:=public.ingest_lammah_candidate(
    current_setting('lammah.fixture_run_id')::uuid,
    jsonb_build_object(
      'source_record_id','PILOT-SYNTH-MISSING-APPLY','checksum_sha256',repeat('1',64),
      'request_identity','PILOT-SYNTH-MISSING-APPLY',
      'source_page_url','https://eu-careers.europa.eu/en/job-opportunities/pilot-synth-missing-apply',
      'retrieved_at',now(),'opportunity_type','job',
      'title_original','PILOT-SYNTH Missing apply','title_en','PILOT-SYNTH Missing apply',
      'organization_raw_name','European Union','payload_body','<html>missing apply</html>',
      'sanitized_projection',jsonb_build_object('title','PILOT-SYNTH Missing apply'),
      'content_type','text/html','personal_data_dominated',false,'hostile_content',false
    )
  );
  PERFORM pg_temp.assert_true(NOT (v_result->>'ok')::boolean AND v_result->>'code'='record_validation_failed','missing application URL dead-letters the record');
END;
$$;
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT review_flags @> ARRAY['url_validation_failure','hostile_content','personal_data_review']::text[]
   FROM public.lammah_import_candidates WHERE id=current_setting('lammah.fixture_candidate_f')::uuid)
  AND EXISTS(SELECT 1 FROM public.lammah_review_queue
             WHERE candidate_id=current_setting('lammah.fixture_candidate_f')::uuid AND queue_state='open')
  AND NOT EXISTS(SELECT 1 FROM public.lammah_opportunities
                 WHERE publication_candidate_id=current_setting('lammah.fixture_candidate_f')::uuid)
  AND EXISTS(SELECT 1 FROM public.lammah_dead_letters
             WHERE source_record_id='PILOT-SYNTH-MISSING-APPLY'),
  'unsafe URL and hostile/personal-data gates route to review and never publish'
);

UPDATE public.lammah_opportunities SET expires_at=now()-interval '1 minute'
WHERE id=current_setting('lammah.fixture_opportunity_d')::uuid;
SELECT pg_temp.assert_true(
  (public.expire_stale_lammah_opportunities()->>'expired_count')::integer>=1,
  'expiry transition processes the due published opportunity'
);
SELECT pg_temp.assert_true(
  (SELECT status='expired' FROM public.lammah_opportunities
   WHERE id=current_setting('lammah.fixture_opportunity_d')::uuid)
  AND EXISTS(SELECT 1 FROM public.lammah_lifecycle_events
             WHERE opportunity_id=current_setting('lammah.fixture_opportunity_d')::uuid
               AND event_type='opportunity_expired'),
  'expiry retains the row and appends lifecycle evidence instead of hard deletion'
);

SELECT set_config('lammah.fixture_evidence_b',(
  SELECT evidence_id::text FROM public.lammah_import_candidates
  WHERE id=current_setting('lammah.fixture_candidate_b')::uuid
),false);
UPDATE public.lammah_raw_evidence SET deletion_eligible_at=now()-interval '1 day'
WHERE id=current_setting('lammah.fixture_evidence_b')::uuid;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.set_lammah_evidence_legal_hold(
    current_setting('lammah.fixture_evidence_b')::uuid,true,'Disposable legal hold proof'
  )->>'ok')::boolean,
  'Super Admin places a documented legal hold'
);
SELECT pg_temp.assert_true(
  (public.run_lammah_retention_now('Disposable held retention pass')->>'ok')::boolean
  AND (SELECT payload_body IS NOT NULL FROM public.lammah_raw_evidence
       WHERE id=current_setting('lammah.fixture_evidence_b')::uuid),
  'retention preserves a held payload'
);
SELECT pg_temp.assert_true(
  (public.set_lammah_evidence_legal_hold(
    current_setting('lammah.fixture_evidence_b')::uuid,false,'Disposable legal hold release'
  )->>'ok')::boolean,
  'Super Admin releases the legal hold with audit reason'
);
SELECT pg_temp.assert_true(
  (public.run_lammah_retention_now('Disposable eligible retention pass')->>'ok')::boolean,
  'retention executes after hold release'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT payload_body IS NULL AND retention_state='payload_deleted'
      AND payload_deleted_at IS NOT NULL AND checksum_sha256=repeat('b',64)
   FROM public.lammah_raw_evidence WHERE id=current_setting('lammah.fixture_evidence_b')::uuid),
  'retention deletes only payload content while preserving evidence metadata and checksum'
);

SELECT pg_temp.expect_error(
  format('UPDATE public.lammah_lifecycle_events SET reason=%L WHERE candidate_id=%L',
    'tampered',current_setting('lammah.fixture_candidate_a')),
  'lifecycle audit events are immutable'
);
SELECT pg_temp.expect_error(
  format('DELETE FROM public.lammah_native_match_events WHERE candidate_id=%L',
    current_setting('lammah.fixture_candidate_c')),
  'native precedence events are immutable'
);
SELECT pg_temp.expect_error(
  format('UPDATE public.lammah_raw_evidence SET payload_body=%L WHERE id=%L',
    'tampered',(
      SELECT evidence_id::text FROM public.lammah_import_candidates
      WHERE id=current_setting('lammah.fixture_candidate_a')::uuid
    )),
  'captured raw evidence payload is immutable outside retention'
);

SET ROLE service_role;
SELECT pg_temp.assert_true(
  NOT has_table_privilege('service_role','public.lammah_opportunities','INSERT'),
  'service role has no direct Lammah publication-table INSERT privilege'
);
SELECT pg_temp.expect_error(
  $$INSERT INTO public.lammah_opportunities(
      source_id,source_name,company_name_raw,title_en,opportunity_type,external_url,
      external_ref_hash,status,extraction_confidence
    ) VALUES (
      '6a6d6d61-682d-4100-8000-000000000001','EU Careers / EPSO','PILOT-SYNTH direct write',
      'PILOT-SYNTH direct write','job','https://europa.eu/apply/direct-write',
      repeat('9',64),'active',1
    )$$,
  'service role cannot bypass the governed publication path'
);
RESET ROLE;

SELECT pg_temp.assert_true(
  (SELECT count(*)::text=current_setting('lammah.fixture_profiles_before') FROM public.profiles)
  AND (SELECT count(*)::text=current_setting('lammah.fixture_verification_before') FROM public.verification_requests)
  AND (SELECT count(*)::text=current_setting('lammah.fixture_applications_before') FROM public.applications)
  AND (SELECT count(*)::text=current_setting('lammah.fixture_batches_before') FROM public.communication_batches)
  AND (SELECT count(*)::text=current_setting('lammah.fixture_logs_before') FROM public.communication_log)
  AND (SELECT count(*)::text=current_setting('lammah.fixture_radar_before') FROM public.lammah_radar_items)
  AND (SELECT claimed_by IS NULL AND claim_requested_at IS NULL AND NOT is_verified
       FROM public.companies WHERE id='1a660101-0000-4000-8000-000000000101'),
  'pipeline creates zero Profile, Verification, ownership, application, communication, or radar side effects'
);

SET ROLE lammah_worker_eu_careers_fixture;
SELECT pg_temp.assert_true(
  (public.lammah_finish_run(
    current_setting('lammah.fixture_run_id')::uuid,'succeeded',7,1,0,
    jsonb_build_object(
      'checked_source_record_ids',jsonb_build_array(
        'PILOT-SYNTH-MANUAL-A','PILOT-SYNTH-DUPLICATE-B','PILOT-SYNTH-NATIVE-C',
        'PILOT-SYNTH-AUTO-D','PILOT-SYNTH-AUTO-OFF-E','PILOT-SYNTH-UNSAFE-F'
      ),
      'seen_source_record_ids',jsonb_build_array(
        'PILOT-SYNTH-MANUAL-A','PILOT-SYNTH-DUPLICATE-B','PILOT-SYNTH-NATIVE-C',
        'PILOT-SYNTH-AUTO-D','PILOT-SYNTH-AUTO-OFF-E','PILOT-SYNTH-UNSAFE-F'
      )
    ),NULL,NULL
  )->>'ok')::boolean,
  'worker finishes the run with bounded real counters and checkpoint'
);
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','1a660002-0000-4000-8000-000000000002',false);
SELECT pg_temp.assert_true(
  (public.configure_lammah_phase1(false,false,false,false,false,'Disposable shutdown and rollback')->>'ok')::boolean,
  'Super Admin kill switches stop ingestion and automatic publication without deleting rows'
);
RESET ROLE;

SELECT 'LAMMAH_PHASE1_DISPOSABLE_PASS' AS result;
ROLLBACK;

SELECT pg_temp.assert_true(
  NOT EXISTS(SELECT 1 FROM public.profiles WHERE id::text LIKE '1a6600%')
  AND NOT EXISTS(SELECT 1 FROM public.jobs WHERE id='1a660103-0000-4000-8000-000000000103')
  AND NOT EXISTS(SELECT 1 FROM public.lammah_import_candidates
                 WHERE source_record_id LIKE 'PILOT-SYNTH-%')
  AND NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='lammah_worker_eu_careers_fixture'),
  'rollback leaves zero disposable fixture or elevated-role residue'
);
SELECT 'LAMMAH_PHASE1_DISPOSABLE_CLEAN' AS result;
