\set ON_ERROR_STOP on
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(p_ok boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT coalesce(p_ok,false) THEN RAISE EXCEPTION 'ASSERT: %',p_message; END IF; END $$;
CREATE OR REPLACE FUNCTION pg_temp.assert_denied(p_sql text, p_message text)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN EXECUTE p_sql; RAISE EXCEPTION 'ASSERT: expected denial: %',p_message;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

-- Existing Wave 5 nonprod fixture: role/application/candidate/business.
INSERT INTO public.hiring_criteria(id,hiring_role_id,label_ar,label_en,evidence_kinds,required,sort_order)
VALUES('a7000001-0000-4000-8000-000000000001','06e54989-d17d-4c9f-94f3-87772488f3d3','التواصل المنظم','Structured communication',ARRAY['assessment_result'],true,700);

INSERT INTO public.hiring_team_memberships(business_profile_id,user_id,role,active,invited_by) VALUES
('b3000001-0000-4000-8000-000000000001','7bcdda1e-5c30-45fa-ad1f-1a2ece88fe8b','hiring_admin',true,'b1000005-0000-4000-8000-000000000005'),
('b3000001-0000-4000-8000-000000000001','b1000003-0000-4000-8000-000000000003','recruiter',true,'b1000005-0000-4000-8000-000000000005'),
('b3000001-0000-4000-8000-000000000001','b1000004-0000-4000-8000-000000000004','interviewer',true,'b1000005-0000-4000-8000-000000000005'),
('b3000001-0000-4000-8000-000000000001','b1000006-0000-4000-8000-000000000006','viewer',true,'b1000005-0000-4000-8000-000000000005'),
('b3000001-0000-4000-8000-000000000001','b1000008-0000-4000-8000-000000000008','recruiter',false,'b1000005-0000-4000-8000-000000000005');

INSERT INTO public.business_profiles(id,directory_id,owner_user_id,display_name_ar,display_name_en,status)
VALUES('a7000002-0000-4000-8000-000000000002','73770146-f26c-41d1-aec6-d866bb81ae95','4e090250-413e-423c-9e1f-4fd4b20208bb','شركة أخرى','Other Business','draft');

INSERT INTO public.assessment_providers(id,code,name_ar,name_en,kind,capability_types,created_by)
VALUES('a7000003-0000-4000-8000-000000000003','wave7_recorded','مزود مقابلة مسجلة','Recorded interview provider','recorded_interview',ARRAY['structured_interview']::public.assessment_method_enum[],'b1000009-0000-4000-8000-000000000009');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b1000005-0000-4000-8000-000000000005',true);
INSERT INTO public.assessment_methods(id,hiring_role_id,provider_id,method,title_ar,title_en,purpose_ar,purpose_en,evidence_notice_ar,evidence_notice_en,requires_consent,created_by)
VALUES('a7000004-0000-4000-8000-000000000004','06e54989-d17d-4c9f-94f3-87772488f3d3','a7000003-0000-4000-8000-000000000003','structured_interview','مقابلة منظمة مسجلة','Recorded structured interview','جمع دليل مرتبط بمعيار الدور','Collect role-criterion evidence','قد يعود التسجيل وملخصه إلى جهة التوظيف','The recording and summary may return to the employer',true,'b1000005-0000-4000-8000-000000000005');
INSERT INTO public.assessment_methods(id,hiring_role_id,provider_id,method,title_ar,title_en,purpose_ar,purpose_en,evidence_notice_ar,evidence_notice_en,requires_consent,created_by)
VALUES('a7000005-0000-4000-8000-000000000005','06e54989-d17d-4c9f-94f3-87772488f3d3','a7000003-0000-4000-8000-000000000003','structured_interview','مقابلة متابعة','Follow-up interview','جمع دليل متابعة','Collect follow-up evidence','قد يعود التسجيل وملخصه إلى جهة التوظيف','The recording and summary may return to the employer',true,'b1000005-0000-4000-8000-000000000005');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.assessment_methods WHERE id='a7000004-0000-4000-8000-000000000004'),'owner configures method');

-- Hiring admin and recruiter can assign; interviewer/viewer/inactive/cross-org/university cannot.
SELECT set_config('request.jwt.claim.sub','7bcdda1e-5c30-45fa-ad1f-1a2ece88fe8b',true);
SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL);
SELECT set_config('request.jwt.claim.sub','b1000003-0000-4000-8000-000000000003',true);
SELECT public.assign_assessment('a7000005-0000-4000-8000-000000000005','b3000009-0000-4000-8000-000000000009',NULL);
SELECT set_config('request.jwt.claim.sub','b1000004-0000-4000-8000-000000000004',true);
SELECT pg_temp.assert_denied($q$SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL)$q$,'interviewer assign');
SELECT set_config('request.jwt.claim.sub','b1000006-0000-4000-8000-000000000006',true);
SELECT pg_temp.assert_denied($q$SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL)$q$,'viewer assign');
SELECT set_config('request.jwt.claim.sub','b1000008-0000-4000-8000-000000000008',true);
SELECT pg_temp.assert_denied($q$SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL)$q$,'inactive member assign');
SELECT set_config('request.jwt.claim.sub','4e090250-413e-423c-9e1f-4fd4b20208bb',true);
SELECT pg_temp.assert_denied($q$SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL)$q$,'different business assign');
SELECT set_config('request.jwt.claim.sub','b1000007-0000-4000-8000-000000000007',true);
SELECT pg_temp.assert_denied($q$SELECT public.assign_assessment('a7000004-0000-4000-8000-000000000004','b3000009-0000-4000-8000-000000000009',NULL)$q$,'university assign');

-- Candidate sees only own assignment, receives notice, consents, starts, and reports technical failure.
SELECT set_config('request.jwt.claim.sub','b1000001-0000-4000-8000-000000000001',true);
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.assessment_assignments),'candidate own assignments');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.assessment_results),'candidate cannot read employer results');
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments ORDER BY invited_at LIMIT 1),'consent',(SELECT disclosure_snapshot->>'terms_ref' FROM public.assessment_assignments WHERE state='invited' ORDER BY invited_at LIMIT 1),NULL,NULL,NULL,NULL);
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='ready'),'start',NULL,'provider-session-failed',NULL,NULL,NULL);
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='started'),'technical_failure',NULL,NULL,NULL,'NETWORK_INTERRUPTION','candidate reported interruption');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.assessment_assignments WHERE state='technical_failure'),'explicit technical failure');

-- Another individual cannot see candidate assignment. Employer retries; failure creates no evidence.
SELECT set_config('request.jwt.claim.sub','b1000002-0000-4000-8000-000000000002',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.assessment_assignments),'another candidate denied');
SELECT set_config('request.jwt.claim.sub','b1000005-0000-4000-8000-000000000005',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.hiring_evidence_attachments WHERE evidence_record_id IN (SELECT id FROM public.assessment_assignments)),'technical failure is not evidence');
SELECT public.retry_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='technical_failure'));

-- Complete the second assignment as a recorded interview, then ingest purpose-bound evidence.
SELECT set_config('request.jwt.claim.sub','b1000001-0000-4000-8000-000000000001',true);
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='invited' ORDER BY invited_at LIMIT 1),'consent',(SELECT disclosure_snapshot->>'terms_ref' FROM public.assessment_assignments WHERE state='invited' ORDER BY invited_at LIMIT 1),NULL,NULL,NULL,NULL);
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='ready' ORDER BY invited_at LIMIT 1),'start',NULL,'provider-session-ok',NULL,NULL,NULL);
SELECT set_config('request.jwt.claim.sub','b1000005-0000-4000-8000-000000000005',true);
SELECT public.transition_assessment_assignment((SELECT id FROM public.assessment_assignments WHERE state='started'),'complete',NULL,'provider-session-ok','recording://purpose-bound/wave7',NULL,NULL);
SELECT public.ingest_assessment_result((SELECT id FROM public.assessment_assignments WHERE state='completed'),'a7000001-0000-4000-8000-000000000001','{"evidence":"structured response"}'::jsonb,'دليل منظم','Structured evidence','["Provider supplied; human review required"]'::jsonb,'provider:event:wave7');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.assessment_results),'result ingested');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.hiring_evidence_attachments WHERE evidence_kind='assessment_result'),'Wave 6 evidence handoff');
SELECT pg_temp.assert_true((SELECT outcome IS NULL FROM public.applications WHERE id='b3000009-0000-4000-8000-000000000009'),'result does not set hiring outcome');
RESET ROLE;
SELECT pg_temp.assert_true((SELECT count(*)>=10 FROM public.audit_logs WHERE action LIKE 'assessment.%'),'orchestration audit trail');
SET LOCAL ROLE authenticated;

-- Cross-org, university, unrelated individual, and anon read nothing private.
SELECT set_config('request.jwt.claim.sub','4e090250-413e-423c-9e1f-4fd4b20208bb',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.assessment_assignments),'cross-org read denied');
SELECT set_config('request.jwt.claim.sub','b1000007-0000-4000-8000-000000000007',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.assessment_assignments),'university read denied');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.assessment_assignments),'anon read denied');

RESET ROLE;
SELECT 'WAVE7_RLS_ACTOR_MATRIX_PASS' AS result;
ROLLBACK;





