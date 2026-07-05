-- Auth/RBAC surface completion (Section 11 Steps 12-15)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

UPDATE public.profiles
SET suspended_at = locked_until
WHERE locked_until IS NOT NULL
  AND locked_until > now()
  AND suspended_at IS NULL;

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS required_documents text[] NOT NULL DEFAULT '{}';

-- Default required documents on reject (updated in review_claim_request below)
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
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_claim public.claim_requests%ROWTYPE;
  v_new_role public.user_role_enum;
  v_old_role public.user_role_enum;
  v_notes text;
  v_required_docs text[] := ARRAY[
    'commercial_registry',
    'domain_ownership_proof',
    'authorization_letter'
  ];
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to review claims';
  END IF;

  v_notes := NULLIF(trim(p_review_notes), '');
  IF v_notes IS NULL THEN
    RAISE EXCEPTION 'Review notes are required';
  END IF;

  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_claim FROM public.claim_requests WHERE id = p_claim_id FOR UPDATE;

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status NOT IN ('pending', 'pending_review', 'under_review') THEN
    RAISE EXCEPTION 'Claim is not pending review';
  END IF;

  IF p_decision = 'approve' THEN
    v_new_role := CASE
      WHEN v_claim.claim_type = 'university' THEN 'university_admin'::public.user_role_enum
      ELSE 'company_admin'::public.user_role_enum
    END;

    SELECT role INTO v_old_role FROM public.profiles WHERE id = v_claim.user_id;

    UPDATE public.claim_requests
    SET
      status = 'approved',
      review_notes = v_notes,
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      rejection_reason = NULL,
      can_reapply_after = NULL,
      required_documents = '{}',
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET is_verified = true, entity_state = 'claimed'
    WHERE id = v_claim.company_id;

    PERFORM set_config('jid.allow_role_change', 'on', true);
    UPDATE public.profiles SET role = v_new_role, updated_at = now() WHERE id = v_claim.user_id;

    PERFORM public._write_audit_log(
      v_actor_id, 'claim.approved', 'claim_request', p_claim_id,
      jsonb_build_object('status', v_claim.status, 'role', v_old_role),
      jsonb_build_object('status', 'approved', 'role', v_new_role, 'review_notes', v_notes, 'company_id', v_claim.company_id)
    );
  ELSE
    IF NULLIF(trim(COALESCE(p_rejection_reason, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    UPDATE public.claim_requests
    SET
      status = 'rejected',
      review_notes = v_notes,
      rejection_reason = trim(p_rejection_reason),
      required_documents = v_required_docs,
      can_reapply_after = now() + interval '7 days',
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET entity_state = 'unclaimed'
    WHERE id = v_claim.company_id AND entity_state = 'pending';

    PERFORM public._write_audit_log(
      v_actor_id, 'claim.rejected', 'claim_request', p_claim_id,
      jsonb_build_object('status', v_claim.status),
      jsonb_build_object(
        'status', 'rejected',
        'review_notes', v_notes,
        'rejection_reason', trim(p_rejection_reason),
        'required_documents', v_required_docs,
        'can_reapply_after', now() + interval '7 days'
      )
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.suspend_user(
  p_target_user_id uuid,
  p_locked_until timestamptz,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_target_role public.user_role_enum;
  v_old_locked_until timestamptz;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to suspend users';
  END IF;

  SELECT role, locked_until
  INTO v_target_role, v_old_locked_until
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_actor_role = 'staff' AND v_target_role IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Staff cannot suspend privileged accounts';
  END IF;

  IF v_actor_role = 'admin' AND v_target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Admin cannot suspend super_admin accounts';
  END IF;

  UPDATE public.profiles
  SET
    locked_until = p_locked_until,
    suspended_at = now(),
    updated_at = now()
  WHERE id = p_target_user_id;

  PERFORM public._write_audit_log(
    v_actor_id, 'user.suspended', 'profile', p_target_user_id,
    jsonb_build_object('locked_until', v_old_locked_until),
    jsonb_build_object('locked_until', p_locked_until),
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

-- active_sessions RLS
CREATE POLICY active_sessions_select_own
  ON public.active_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY active_sessions_update_own
  ON public.active_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.revoke_active_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.active_sessions
  SET revoked_at = now()
  WHERE id = p_session_id
    AND user_id = v_user_id
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  PERFORM public._write_audit_log(
    v_user_id,
    'session.revoked',
    'active_session',
    p_session_id,
    NULL,
    jsonb_build_object('revoked_at', now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_active_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_active_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_active_session(
  p_session_token_hash text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_label text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.active_sessions (
    user_id,
    session_token_hash,
    ip_address,
    user_agent,
    device_label,
    expires_at
  )
  VALUES (
    v_user_id,
    p_session_token_hash,
    p_ip_address,
    p_user_agent,
    p_device_label,
    COALESCE(p_expires_at, now() + interval '30 days')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_active_session(text, inet, text, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_active_session(text, inet, text, text, timestamptz) TO authenticated;

-- audit_logs: staff own actions; admin/super_admin see all
DROP POLICY IF EXISTS audit_logs_select_staff ON public.audit_logs;

CREATE POLICY audit_logs_select_staff_own
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'staff'
    AND actor_id = auth.uid()
  );

CREATE POLICY audit_logs_select_admin_all
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above());
