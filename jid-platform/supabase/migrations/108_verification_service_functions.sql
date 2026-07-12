-- P-102 — Verification service (Layer 2→3 backend)
-- Replaces claim approval that wrote companies.claimed_by / entity_state.
-- Deprecates review_claim / review_claim_request (callers listed in P-102 Execution Log).

-- ---------------------------------------------------------------------------
-- approve_verification_request
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
-- reject_verification_request
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
-- get_my_approved_verifications (P-105 wizard gate)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_approved_verifications()
RETURNS SETOF public.verification_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vr.*
  FROM public.verification_requests vr
  WHERE vr.applicant_user_id = auth.uid()
    AND vr.status = 'approved'
    AND vr.resulting_profile_id IS NULL;
$$;

-- ---------------------------------------------------------------------------
-- create_business_profile (Layer 2 → Layer 3)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_business_profile(
  p_verification_id uuid,
  p_display_name_ar text,
  p_display_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_profile_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
    AND applicant_user_id = v_actor_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF v_req.status <> 'approved' THEN
    RAISE EXCEPTION 'verification_not_approved';
  END IF;

  IF v_req.verification_type <> 'business' THEN
    RAISE EXCEPTION 'wrong_verification_type';
  END IF;

  IF v_req.resulting_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'profile_already_created';
  END IF;

  IF p_display_name_ar IS NULL OR length(trim(p_display_name_ar)) = 0 THEN
    RAISE EXCEPTION 'display_name_required';
  END IF;

  INSERT INTO public.business_profiles (
    directory_id,
    owner_user_id,
    display_name_ar,
    display_name_en,
    verified_domains,
    status
  )
  VALUES (
    v_req.directory_id,
    v_actor_id,
    trim(p_display_name_ar),
    NULLIF(trim(p_display_name_en), ''),
    COALESCE(v_req.verified_domains, '{}'::text[]),
    'draft'
  )
  RETURNING id INTO v_profile_id;

  UPDATE public.verification_requests
  SET
    resulting_profile_id = v_profile_id,
    resulting_profile_type = 'business',
    updated_at = now()
  WHERE id = p_verification_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.created',
    'business_profile',
    v_profile_id,
    NULL,
    jsonb_build_object(
      'directory_id', v_req.directory_id,
      'verification_id', p_verification_id,
      'actor_role', v_actor_role
    )
  );

  RETURN v_profile_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- create_university_profile (Layer 2 → Layer 3)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_university_profile(
  p_verification_id uuid,
  p_display_name_ar text,
  p_display_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_profile_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
    AND applicant_user_id = v_actor_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF v_req.status <> 'approved' THEN
    RAISE EXCEPTION 'verification_not_approved';
  END IF;

  IF v_req.verification_type <> 'university' THEN
    RAISE EXCEPTION 'wrong_verification_type';
  END IF;

  IF v_req.resulting_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'profile_already_created';
  END IF;

  IF p_display_name_ar IS NULL OR length(trim(p_display_name_ar)) = 0 THEN
    RAISE EXCEPTION 'display_name_required';
  END IF;

  INSERT INTO public.university_profiles (
    directory_id,
    owner_user_id,
    display_name_ar,
    display_name_en,
    verified_domains,
    status
  )
  VALUES (
    v_req.directory_id,
    v_actor_id,
    trim(p_display_name_ar),
    NULLIF(trim(p_display_name_en), ''),
    COALESCE(v_req.verified_domains, '{}'::text[]),
    'draft'
  )
  RETURNING id INTO v_profile_id;

  UPDATE public.verification_requests
  SET
    resulting_profile_id = v_profile_id,
    resulting_profile_type = 'university',
    updated_at = now()
  WHERE id = p_verification_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.created',
    'university_profile',
    v_profile_id,
    NULL,
    jsonb_build_object(
      'directory_id', v_req.directory_id,
      'verification_id', p_verification_id,
      'actor_role', v_actor_role
    )
  );

  RETURN v_profile_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- notify_claim_decision — retarget to verification_requests (structural fix)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_claim_decision(
  p_claim_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.verification_requests%ROWTYPE;
  v_company public.companies%ROWTYPE;
  v_category public.notification_category_enum;
  v_priority public.notification_priority_enum := 'normal';
  v_title_ar text;
  v_title_en text;
  v_body_ar text;
  v_body_en text;
  v_company_ar text;
  v_company_en text;
  v_reason text;
  v_idempotency_key text;
BEGIN
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'notify_claim_decision requires privileged staff'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_req
  FROM public.verification_requests vr
  WHERE vr.id = p_claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'verification request not found: %', p_claim_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_req.applicant_user_id = auth.uid() THEN
    RAISE EXCEPTION 'applicant cannot dispatch own verification decision notification'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_company
  FROM public.companies c
  WHERE c.id = v_req.directory_id;

  v_company_ar := COALESCE(v_company.name_ar, v_company.name, v_req.company_name);
  v_company_en := COALESCE(v_company.name, v_company.name_ar, v_req.company_name);
  v_reason := NULLIF(trim(COALESCE(p_reason, '')), '');

  IF p_decision IN ('approve', 'approved') THEN
    v_category := 'claim.approved';
    v_priority := 'high';
    v_title_ar := 'تمت الموافقة على طلب التحقق';
    v_title_en := 'Verification approved';
    v_body_ar := format(
      'وافقت إدارة جيد على طلب التحقق الخاص بـ %s. يمكنك الآن إنشاء ملفك التعريفي.',
      v_company_ar
    );
    v_body_en := format(
      'JID staff approved your verification for %s. You can now create your owned profile.',
      v_company_en
    );
  ELSIF p_decision IN ('reject', 'rejected') THEN
    v_category := 'claim.rejected';
    v_priority := 'high';
    v_title_ar := 'تم رفض طلب التحقق';
    v_title_en := 'Verification rejected';
    v_body_ar := format(
      'لم يُقبل طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالسبب: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'Your verification for %s was not approved.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nReason: %s', v_reason)
        ELSE ''
      END
    );
  ELSIF p_decision = 'needs_more_info' THEN
    v_category := 'claim.needs_more_info';
    v_title_ar := 'مطلوب معلومات إضافية لطلب التحقق';
    v_title_en := 'More information needed for verification';
    v_body_ar := format(
      'نحتاج مستندات أو توضيحات إضافية لإكمال مراجعة طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالتفاصيل: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'We need additional documents or clarification to complete the review of your verification for %s.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nDetails: %s', v_reason)
        ELSE ''
      END
    );
  ELSE
    RAISE EXCEPTION 'unsupported verification decision: %', p_decision
      USING ERRCODE = '22023';
  END IF;

  v_idempotency_key := format('verification.decision:%s:%s', p_claim_id, p_decision);

  RETURN public.dispatch_notification(
    p_recipient_id := v_req.applicant_user_id,
    p_category := v_category,
    p_title_ar := v_title_ar,
    p_title_en := v_title_en,
    p_body_ar := v_body_ar,
    p_body_en := v_body_en,
    p_priority := v_priority,
    p_action_url := '/settings',
    p_action_label_ar := 'عرض الإعدادات',
    p_action_label_en := 'View settings',
    p_related_resource_type := 'verification_request',
    p_related_resource_id := p_claim_id,
    p_idempotency_key := v_idempotency_key,
    p_metadata := jsonb_build_object(
      'verification_id', p_claim_id,
      'decision', p_decision,
      'directory_id', v_req.directory_id,
      'reason', v_reason
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Task 7 — Deprecate legacy claim review RPCs (P-108 migrates callers)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_claim(
  p_claim_id uuid,
  p_decision text,
  p_reason text,
  p_required_documents text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE WARNING 'review_claim is deprecated (P-102) — use approve_verification_request / reject_verification_request via lib/auth/verification.ts';
  RAISE EXCEPTION 'review_claim_deprecated: migrate caller to approve_verification_request / reject_verification_request (P-108)';
END;
$$;

CREATE OR REPLACE FUNCTION public.review_claim_request(
  p_claim_id uuid,
  p_decision text,
  p_review_notes text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE WARNING 'review_claim_request is deprecated (P-102) — use approve_verification_request / reject_verification_request';
  RAISE EXCEPTION 'review_claim_request_deprecated: migrate caller to approve_verification_request / reject_verification_request (P-108)';
END;
$$;

REVOKE ALL ON FUNCTION public.approve_verification_request(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_verification_request(uuid, text, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_verification_request(uuid, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_verification_request(uuid, text, text, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_approved_verifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_approved_verifications() TO authenticated;

REVOKE ALL ON FUNCTION public.create_business_profile(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_profile(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.create_university_profile(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_university_profile(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
