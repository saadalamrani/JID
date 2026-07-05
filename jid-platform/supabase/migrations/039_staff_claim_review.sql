-- Staff claim review workflow (Section 6 / Step 10)

ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'company_admin';
ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'university_admin';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS entity_state text NOT NULL DEFAULT 'unclaimed'
    CHECK (entity_state IN ('unclaimed', 'pending', 'claimed', 'suspended'));

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS can_reapply_after timestamptz;

CREATE POLICY companies_update_staff
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

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
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET
      is_verified = true,
      entity_state = 'claimed'
    WHERE id = v_claim.company_id;

    PERFORM set_config('jid.allow_role_change', 'on', true);

    UPDATE public.profiles
    SET
      role = v_new_role,
      updated_at = now()
    WHERE id = v_claim.user_id;

    PERFORM public._write_audit_log(
      v_actor_id,
      'claim.approved',
      'claim_request',
      p_claim_id,
      jsonb_build_object('status', v_claim.status, 'role', v_old_role),
      jsonb_build_object(
        'status', 'approved',
        'role', v_new_role,
        'review_notes', v_notes,
        'company_id', v_claim.company_id
      )
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
      can_reapply_after = now() + interval '7 days',
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET entity_state = 'unclaimed'
    WHERE id = v_claim.company_id
      AND entity_state = 'pending';

    PERFORM public._write_audit_log(
      v_actor_id,
      'claim.rejected',
      'claim_request',
      p_claim_id,
      jsonb_build_object('status', v_claim.status),
      jsonb_build_object(
        'status', 'rejected',
        'review_notes', v_notes,
        'rejection_reason', trim(p_rejection_reason),
        'can_reapply_after', now() + interval '7 days'
      )
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_claim_request(uuid, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_claim_request(uuid, text, text, text) TO authenticated;
