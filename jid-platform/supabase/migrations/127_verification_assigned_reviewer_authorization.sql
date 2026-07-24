-- Spec 02 / Session B — assigned-reviewer authorization + explicit override RPCs
-- CREATE OR REPLACE only for existing approve/reject (signatures unchanged).
-- New override RPCs are super_admin-only; admin never gets override.
-- No DROP. No RLS policy changes. No new tables/columns.

-- ---------------------------------------------------------------------------
-- approve_verification_request (existing signature; add assignment gate)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_verification_request(
  p_verification_id uuid,
  p_review_notes text,
  p_verified_domains text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_domain_matches boolean;
  v_email_domain text;
  v_granted_role public.user_role_enum;
  v_old_role public.user_role_enum;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  IF p_review_notes IS NULL OR length(trim(p_review_notes)) = 0 THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.applicant_user_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot_review_own_verification';
  END IF;

  -- Assigned-reviewer gate (applies to staff AND super_admin; no override here).
  IF v_req.assigned_staff_id IS NOT NULL AND v_req.assigned_staff_id <> v_actor_id THEN
    RAISE EXCEPTION 'not_assigned_reviewer';
  END IF;

  IF v_req.assigned_staff_id IS NULL THEN
    UPDATE public.verification_requests
    SET
      assigned_staff_id = v_actor_id,
      first_viewed_at = COALESCE(first_viewed_at, now()),
      first_viewed_by = COALESCE(first_viewed_by, v_actor_id),
      updated_at = now()
    WHERE id = p_verification_id;
    v_req.assigned_staff_id := v_actor_id;
  END IF;

  -- Mentor verifications use mentor_profiles (056), not verification_requests — no mentor branch.
  IF v_req.verification_type NOT IN ('business', 'university') THEN
    RAISE EXCEPTION 'unsupported_verification_type';
  END IF;

  v_email_domain := NULLIF(trim(split_part(v_req.business_email, '@', 2)), '');

  SELECT (
    v_email_domain IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = v_req.directory_id
        AND v_email_domain = ANY (c.domains)
    )
  ) INTO v_domain_matches;

  UPDATE public.verification_requests
  SET
    status = 'approved',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = trim(p_review_notes),
    rejection_reason = NULL,
    can_reapply_after = NULL,
    required_documents = '{}',
    verified_domains = COALESCE(
      p_verified_domains,
      CASE WHEN v_email_domain IS NOT NULL THEN ARRAY[v_email_domain] ELSE '{}'::text[] END
    ),
    updated_at = now()
  WHERE id = p_verification_id;

  v_granted_role := CASE v_req.verification_type
    WHEN 'business' THEN 'company_admin'::public.user_role_enum
    WHEN 'university' THEN 'university_admin'::public.user_role_enum
  END;

  SELECT role INTO v_old_role FROM public.profiles WHERE id = v_req.applicant_user_id;

  PERFORM public.set_user_role(v_req.applicant_user_id, v_granted_role);

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.approved',
    'verification_request',
    p_verification_id,
    jsonb_build_object(
      'status', v_req.status,
      'verification_type', v_req.verification_type,
      'role', v_old_role
    ),
    jsonb_build_object(
      'status', 'approved',
      'verification_type', v_req.verification_type,
      'granted_role', v_granted_role,
      'domain_matches_directory', v_domain_matches,
      'verified_domains', COALESCE(
        p_verified_domains,
        CASE WHEN v_email_domain IS NOT NULL THEN ARRAY[v_email_domain] ELSE '{}'::text[] END
      ),
      'reason', trim(p_review_notes)
    )
  );

  PERFORM public.notify_claim_decision(p_verification_id, 'approved', trim(p_review_notes));
END;
$$;

-- ---------------------------------------------------------------------------
-- reject_verification_request (existing signature; add assignment gate)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_verification_request(
  p_verification_id uuid,
  p_review_notes text,
  p_rejection_reason text DEFAULT NULL,
  p_required_documents text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_reason text;
  v_required_docs text[] := COALESCE(
    p_required_documents,
    ARRAY['commercial_registry', 'domain_ownership_proof', 'authorization_letter']::text[]
  );
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_reason := NULLIF(trim(COALESCE(p_rejection_reason, p_review_notes, '')), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.applicant_user_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot_review_own_verification';
  END IF;

  -- Assigned-reviewer gate (applies to staff AND super_admin; no override here).
  IF v_req.assigned_staff_id IS NOT NULL AND v_req.assigned_staff_id <> v_actor_id THEN
    RAISE EXCEPTION 'not_assigned_reviewer';
  END IF;

  IF v_req.assigned_staff_id IS NULL THEN
    UPDATE public.verification_requests
    SET
      assigned_staff_id = v_actor_id,
      first_viewed_at = COALESCE(first_viewed_at, now()),
      first_viewed_by = COALESCE(first_viewed_by, v_actor_id),
      updated_at = now()
    WHERE id = p_verification_id;
    v_req.assigned_staff_id := v_actor_id;
  END IF;

  UPDATE public.verification_requests
  SET
    status = 'rejected',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = v_reason,
    rejection_reason = v_reason,
    required_documents = v_required_docs,
    can_reapply_after = now() + interval '7 days',
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.rejected',
    'verification_request',
    p_verification_id,
    jsonb_build_object('status', v_req.status, 'verification_type', v_req.verification_type),
    jsonb_build_object(
      'status', 'rejected',
      'verification_type', v_req.verification_type,
      'reason', v_reason,
      'required_documents', v_required_docs,
      'can_reapply_after', now() + interval '7 days'
    )
  );

  PERFORM public.notify_claim_decision(p_verification_id, 'rejected', v_reason);
END;
$$;

-- ---------------------------------------------------------------------------
-- approve_verification_request_override (super_admin only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_verification_request_override(
  p_verification_id uuid,
  p_review_notes text,
  p_verified_domains text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_previous_assigned uuid;
  v_domain_matches boolean;
  v_email_domain text;
  v_granted_role public.user_role_enum;
  v_old_role public.user_role_enum;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  IF p_review_notes IS NULL OR length(trim(p_review_notes)) = 0 THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  -- Self-review denied before any override/assignment evaluation.
  IF v_req.applicant_user_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot_review_own_verification';
  END IF;

  v_previous_assigned := v_req.assigned_staff_id;

  IF v_req.verification_type NOT IN ('business', 'university') THEN
    RAISE EXCEPTION 'unsupported_verification_type';
  END IF;

  v_email_domain := NULLIF(trim(split_part(v_req.business_email, '@', 2)), '');

  SELECT (
    v_email_domain IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = v_req.directory_id
        AND v_email_domain = ANY (c.domains)
    )
  ) INTO v_domain_matches;

  UPDATE public.verification_requests
  SET
    status = 'approved',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = trim(p_review_notes),
    rejection_reason = NULL,
    can_reapply_after = NULL,
    required_documents = '{}',
    verified_domains = COALESCE(
      p_verified_domains,
      CASE WHEN v_email_domain IS NOT NULL THEN ARRAY[v_email_domain] ELSE '{}'::text[] END
    ),
    updated_at = now()
  WHERE id = p_verification_id;

  v_granted_role := CASE v_req.verification_type
    WHEN 'business' THEN 'company_admin'::public.user_role_enum
    WHEN 'university' THEN 'university_admin'::public.user_role_enum
  END;

  SELECT role INTO v_old_role FROM public.profiles WHERE id = v_req.applicant_user_id;

  PERFORM public.set_user_role(v_req.applicant_user_id, v_granted_role);

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.approved',
    'verification_request',
    p_verification_id,
    jsonb_build_object(
      'status', v_req.status,
      'verification_type', v_req.verification_type,
      'role', v_old_role
    ),
    jsonb_build_object(
      'status', 'approved',
      'verification_type', v_req.verification_type,
      'granted_role', v_granted_role,
      'domain_matches_directory', v_domain_matches,
      'verified_domains', COALESCE(
        p_verified_domains,
        CASE WHEN v_email_domain IS NOT NULL THEN ARRAY[v_email_domain] ELSE '{}'::text[] END
      ),
      'reason', trim(p_review_notes),
      'assignment_overridden', true,
      'previous_assigned_staff_id', v_previous_assigned
    )
  );

  PERFORM public.notify_claim_decision(p_verification_id, 'approved', trim(p_review_notes));
END;
$$;

-- ---------------------------------------------------------------------------
-- reject_verification_request_override (super_admin only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_verification_request_override(
  p_verification_id uuid,
  p_review_notes text,
  p_rejection_reason text DEFAULT NULL,
  p_required_documents text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_previous_assigned uuid;
  v_reason text;
  v_required_docs text[] := COALESCE(
    p_required_documents,
    ARRAY['commercial_registry', 'domain_ownership_proof', 'authorization_letter']::text[]
  );
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_reason := NULLIF(trim(COALESCE(p_rejection_reason, p_review_notes, '')), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  -- Self-review denied before any override/assignment evaluation.
  IF v_req.applicant_user_id = v_actor_id THEN
    RAISE EXCEPTION 'cannot_review_own_verification';
  END IF;

  v_previous_assigned := v_req.assigned_staff_id;

  UPDATE public.verification_requests
  SET
    status = 'rejected',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = v_reason,
    rejection_reason = v_reason,
    required_documents = v_required_docs,
    can_reapply_after = now() + interval '7 days',
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.rejected',
    'verification_request',
    p_verification_id,
    jsonb_build_object('status', v_req.status, 'verification_type', v_req.verification_type),
    jsonb_build_object(
      'status', 'rejected',
      'verification_type', v_req.verification_type,
      'reason', v_reason,
      'required_documents', v_required_docs,
      'can_reapply_after', now() + interval '7 days',
      'assignment_overridden', true,
      'previous_assigned_staff_id', v_previous_assigned
    )
  );

  PERFORM public.notify_claim_decision(p_verification_id, 'rejected', v_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_verification_request_override(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_verification_request_override(uuid, text, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_verification_request_override(uuid, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_verification_request_override(uuid, text, text, text[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
