-- Wave 2 final closure — atomic application CV snapshot (P1).
-- Forward-only additive. Does not edit 20260827120000 / 20260827120001.
--
-- public.create_application_cv_snapshot atomically:
--   1. authenticates the caller
--   2. resolves and row-locks the application
--   3. proves applicant ownership (applications.applicant_id = auth.uid())
--   4. proves CV ownership matches the same subject
--   5. uses APPLICATION snapshot purpose
--   6. preserves create_cv_projection_snapshot C5 recipient/purpose rules
--   7. creates one immutable CV projection snapshot
--   8. sets applications.cv_snapshot_id = snapshot_id in the SAME call
--   9. returns the snapshot id
--
-- If any step fails, neither the snapshot nor the application pointer persist.
-- A non-null applications.cv_snapshot_id is never silently overwritten.

-- ---------------------------------------------------------------------------
-- 1. create_application_cv_snapshot
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_application_cv_snapshot(
  p_application_id       uuid,
  p_cv_id                uuid,
  p_authorization_id     uuid,
  p_retention_policy_ref jsonb,
  p_expires_at           timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_app public.applications%ROWTYPE;
  v_cv_owner uuid;
  v_cv public.cvs%ROWTYPE;
  v_auth public.disclosure_authorizations%ROWTYPE;
  v_payload jsonb;
  v_manifest jsonb;
  v_snapshot_id uuid;
  v_updated integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_application_id IS NULL OR p_cv_id IS NULL OR p_authorization_id IS NULL THEN
    RAISE EXCEPTION 'application_id, cv_id and authorization_id are required';
  END IF;

  IF p_retention_policy_ref IS NULL OR NOT private.jid_is_reference_json(p_retention_policy_ref) THEN
    RAISE EXCEPTION 'retention_policy_ref must be a versioned reference object';
  END IF;

  SELECT * INTO v_app
    FROM public.applications
   WHERE id = p_application_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application % not found for current subject', p_application_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_app.applicant_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'application % not found for current subject', p_application_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT user_id INTO v_cv_owner FROM public.cvs WHERE id = p_cv_id;
  IF v_cv_owner IS NULL OR v_cv_owner IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'cv % not found for current subject', p_cv_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Fail closed on existing pointer before creating a snapshot. The UPDATE
  -- below is the atomic race guard: if it affects 0 rows, the inner snapshot
  -- insert is rolled back with the function.
  IF v_app.cv_snapshot_id IS NOT NULL THEN
    RAISE EXCEPTION 'application % already has a cv snapshot', p_application_id
      USING ERRCODE = 'unique_violation';
  END IF;

  SELECT * INTO v_auth FROM public.disclosure_authorizations WHERE id = p_authorization_id;
  IF NOT FOUND
     OR v_auth.subject_id IS DISTINCT FROM v_uid
     OR v_auth.state <> 'ACTIVE'
     OR v_auth.revoked_at IS NOT NULL
     OR v_auth.effective_at > now()
     OR (v_auth.expires_at IS NOT NULL AND v_auth.expires_at < now()) THEN
    RAISE EXCEPTION 'disclosure authorization % is not active for this subject', p_authorization_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_auth.recipient_type <> 'BUSINESS' THEN
    RAISE EXCEPTION 'APPLICATION snapshot requires a BUSINESS recipient authorization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_app.company_id IS NOT NULL
     AND (v_auth.recipient_ref IS NULL OR (v_auth.recipient_ref ->> 'id') IS DISTINCT FROM v_app.company_id::text) THEN
    RAISE EXCEPTION 'disclosure authorization recipient does not match the application company'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_cv FROM public.cvs WHERE id = p_cv_id;

  SELECT coalesce(jsonb_agg(
           jsonb_build_object(
             'evidence_id', i.evidence_id,
             'revision_id', e.current_revision_id
           ) ORDER BY s.sort_order, i.sort_order
         ), '[]'::jsonb)
    INTO v_manifest
    FROM public.cv_projection_items i
    JOIN public.cv_projection_sections s ON s.id = i.section_id
    JOIN public.career_evidence e ON e.id = i.evidence_id
   WHERE i.cv_id = p_cv_id
     AND i.is_selected
     AND e.subject_id = v_uid
     AND e.current_revision_id IS NOT NULL;

  v_payload := jsonb_build_object(
    'cv_id', p_cv_id,
    'application_id', p_application_id,
    'title', v_cv.title,
    'summary', v_cv.summary,
    'locale', v_cv.locale,
    'template_key', v_cv.template_key,
    'assembled_at', now()
  );

  v_snapshot_id := public.create_cv_projection_snapshot(
    p_cv_id,
    'APPLICATION'::public.cv_snapshot_purpose_enum,
    CASE WHEN v_cv.locale IN ('ar', 'en') THEN v_cv.locale ELSE 'ar' END,
    coalesce(nullif(btrim(v_cv.template_key), ''), 'classic'),
    v_payload,
    v_manifest,
    p_retention_policy_ref,
    p_application_id,
    p_authorization_id,
    p_expires_at
  );

  UPDATE public.applications
     SET cv_snapshot_id = v_snapshot_id,
         updated_at = now()
   WHERE id = p_application_id
     AND applicant_id = v_uid
     AND cv_snapshot_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'application snapshot link failed'
      USING ERRCODE = 'unique_violation';
  END IF;

  PERFORM public._write_audit_log(
    v_uid, 'cv_projection.application_snapshot_linked', 'applications', p_application_id,
    NULL, jsonb_build_object('cv_snapshot_id', v_snapshot_id, 'cv_id', p_cv_id)
  );

  RETURN v_snapshot_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_application_cv_snapshot(uuid, uuid, uuid, jsonb, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_application_cv_snapshot(uuid, uuid, uuid, jsonb, timestamptz)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.create_application_cv_snapshot(uuid, uuid, uuid, jsonb, timestamptz) IS
  'Wave 2 P1: atomically create an APPLICATION CV snapshot and point applications.cv_snapshot_id at it. Fail-closed; no silent overwrite.';

-- ---------------------------------------------------------------------------
-- 2. advance_career_evidence_disclosure_policy
--    Policies are immutable; a change appends a PRIVATE successor and advances
--    the evidence root. Visibility cannot leave PRIVATE.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_career_evidence_disclosure_policy(
  p_evidence_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ev public.career_evidence%ROWTYPE;
  v_new_policy uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_ev FROM public.career_evidence WHERE id = p_evidence_id FOR UPDATE;
  IF NOT FOUND OR v_ev.subject_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'evidence % not found for current subject', p_evidence_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.career_evidence_disclosure_policies (subject_id, created_by, supersedes_policy_id)
  VALUES (v_uid, v_uid, v_ev.disclosure_policy_id)
  RETURNING id INTO v_new_policy;

  UPDATE public.career_evidence
     SET disclosure_policy_id = v_new_policy,
         updated_at = now()
   WHERE id = p_evidence_id
     AND subject_id = v_uid;

  PERFORM public._write_audit_log(
    v_uid, 'career_evidence.disclosure_policy_advanced', 'career_evidence', p_evidence_id,
    jsonb_build_object('policy_id', v_ev.disclosure_policy_id),
    jsonb_build_object('policy_id', v_new_policy, 'default_visibility', 'PRIVATE')
  );

  RETURN v_new_policy;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_career_evidence_disclosure_policy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_career_evidence_disclosure_policy(uuid)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. resolve_authorized_career_evidence_disclosure
--    Fail closed unless subject, object, recipient, purpose, ACTIVE, effective,
--    not expired, and not revoked all hold. Affiliation / actor type / staff
--    role never grant access.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_authorized_career_evidence_disclosure(
  p_evidence_id      uuid,
  p_authorization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ev public.career_evidence%ROWTYPE;
  v_auth public.disclosure_authorizations%ROWTYPE;
  v_object_id text;
  v_ok boolean := false;
  v_reason text := 'authorization_not_active';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_ev FROM public.career_evidence WHERE id = p_evidence_id;
  SELECT * INTO v_auth FROM public.disclosure_authorizations WHERE id = p_authorization_id;

  IF v_ev.id IS NULL THEN
    v_reason := 'evidence_not_found';
  ELSIF v_auth.id IS NULL THEN
    v_reason := 'authorization_not_found';
  ELSIF v_auth.subject_id IS DISTINCT FROM v_ev.subject_id THEN
    v_reason := 'subject_mismatch';
  ELSIF v_uid IS DISTINCT FROM v_ev.subject_id THEN
    -- Owner-facing resolver. Recipients do not obtain Career Record access here.
    v_reason := 'caller_is_not_subject';
  ELSIF v_auth.state <> 'ACTIVE' THEN
    v_reason := 'state_not_active';
  ELSIF v_auth.revoked_at IS NOT NULL THEN
    v_reason := 'revoked';
  ELSIF v_auth.effective_at > now() THEN
    v_reason := 'not_yet_effective';
  ELSIF v_auth.expires_at IS NOT NULL AND v_auth.expires_at < now() THEN
    v_reason := 'expired';
  ELSE
    v_object_id := v_auth.object_ref ->> 'id';
    IF v_object_id IS NOT NULL AND v_object_id = p_evidence_id::text THEN
      v_ok := true;
    ELSIF v_auth.data_category IS NOT NULL AND v_auth.data_category = v_ev.category::text THEN
      v_ok := true;
    ELSE
      v_reason := 'object_or_category_mismatch';
    END IF;
  END IF;

  IF NOT v_ok THEN
    PERFORM public._write_audit_log(
      v_uid, 'career_evidence.disclosure_denied', 'career_evidence', p_evidence_id,
      NULL,
      jsonb_build_object(
        'result', 'DENIED',
        'reason', v_reason,
        'authorization_id', p_authorization_id
      )
    );
    RAISE EXCEPTION 'disclosure authorization is not active for this evidence'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM public._write_audit_log(
    v_uid, 'career_evidence.disclosure_allowed', 'career_evidence', p_evidence_id,
    NULL,
    jsonb_build_object(
      'result', 'ALLOWED',
      'authorization_id', p_authorization_id,
      'purpose_code', v_auth.purpose_code,
      'recipient_type', v_auth.recipient_type
    )
  );

  RETURN jsonb_build_object(
    'authorization_id', v_auth.id,
    'evidence_id', v_ev.id,
    'subject_id', v_ev.subject_id,
    'purpose_code', v_auth.purpose_code,
    'recipient_type', v_auth.recipient_type,
    'recipient_ref', v_auth.recipient_ref,
    'state', v_auth.state,
    'effective_at', v_auth.effective_at,
    'expires_at', v_auth.expires_at,
    'basis_type', v_auth.basis_type,
    'basis_ref', v_auth.basis_ref,
    'retention_policy_ref', v_auth.retention_policy_ref,
    'object_ref', v_auth.object_ref,
    'data_category', v_auth.data_category
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_authorized_career_evidence_disclosure(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_authorized_career_evidence_disclosure(uuid, uuid)
  TO authenticated, service_role;
