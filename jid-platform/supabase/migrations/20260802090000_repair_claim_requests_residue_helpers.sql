-- Spec 09 / Session 09-D — repair P-101 claim_requests residue in live helpers.
-- Does not restore Claim workflow. Retargets SECURITY DEFINER helpers to
-- verification_requests + owned Profile directory anchors.

-- ---------------------------------------------------------------------------
-- viewer_approved_company_id — directory id for authenticated business actor
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.viewer_approved_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT bp.directory_id
      FROM public.business_profiles bp
      WHERE bp.owner_user_id = auth.uid()
      ORDER BY bp.updated_at DESC NULLS LAST, bp.created_at DESC
      LIMIT 1
    ),
    (
      SELECT vr.directory_id
      FROM public.verification_requests vr
      WHERE vr.applicant_user_id = auth.uid()
        AND vr.status = 'approved'
        AND vr.verification_type = 'business'
      ORDER BY vr.reviewed_at DESC NULLS LAST, vr.created_at DESC
      LIMIT 1
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- viewer_approved_university_id — directory id for authenticated university actor
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.viewer_approved_university_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT up.directory_id
      FROM public.university_profiles up
      WHERE up.owner_user_id = auth.uid()
      ORDER BY up.updated_at DESC NULLS LAST, up.created_at DESC
      LIMIT 1
    ),
    (
      SELECT vr.directory_id
      FROM public.verification_requests vr
      WHERE vr.applicant_user_id = auth.uid()
        AND vr.status = 'approved'
        AND vr.verification_type = 'university'
      ORDER BY vr.reviewed_at DESC NULLS LAST, vr.created_at DESC
      LIMIT 1
    )
  );
$$;

COMMENT ON FUNCTION public.viewer_approved_company_id() IS
  'Directory id for the viewer via owned business_profiles or approved business verification_requests. Never grants Directory write.';

COMMENT ON FUNCTION public.viewer_approved_university_id() IS
  'Directory id for the viewer via owned university_profiles or approved university verification_requests. Never grants Directory write.';

-- viewer_has_approved_company_claim remains a thin wrapper (028) and inherits the repair.

-- ---------------------------------------------------------------------------
-- assign_claim_to_self — retarget leftover helper to verification_requests
-- App assignment path updates verification_requests directly; keep RPC coherent.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_claim_to_self(p_claim_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'Only staff or super administrators can assign verification requests';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_claim_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'Verification request is not open for assignment';
  END IF;

  UPDATE public.verification_requests
  SET
    assigned_staff_id = v_actor_id,
    first_viewed_at = COALESCE(first_viewed_at, now()),
    first_viewed_by = COALESCE(first_viewed_by, v_actor_id),
    updated_at = now()
  WHERE id = p_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_claim_to_self(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_claim_to_self(uuid) TO authenticated;

COMMENT ON FUNCTION public.assign_claim_to_self(uuid) IS
  'Legacy name retained for compatibility; assigns verification_requests to the calling staff/super_admin.';
