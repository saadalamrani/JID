-- P-103 Task 5 — Profile moderation via audited SECURITY DEFINER functions (no staff UPDATE policy)

CREATE OR REPLACE FUNCTION public.suspend_profile(
  p_profile_id uuid,
  p_profile_type text,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_reason text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_reason := NULLIF(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  IF p_profile_type = 'business' THEN
    UPDATE public.business_profiles
    SET status = 'suspended', updated_at = now()
    WHERE id = p_profile_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found';
    END IF;
  ELSIF p_profile_type = 'university' THEN
    UPDATE public.university_profiles
    SET status = 'suspended', updated_at = now()
    WHERE id = p_profile_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_profile_type';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.suspended',
    p_profile_type || '_profile',
    p_profile_id,
    NULL,
    jsonb_build_object('reason', v_reason, 'profile_type', p_profile_type)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reinstate_profile(
  p_profile_id uuid,
  p_profile_type text,
  p_target_status text DEFAULT 'draft',
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_status text;
  v_reason text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_status := NULLIF(trim(p_target_status), '');
  IF v_status IS NULL OR v_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'invalid_target_status';
  END IF;

  v_reason := NULLIF(trim(COALESCE(p_reason, '')), '');

  IF p_profile_type = 'business' THEN
    UPDATE public.business_profiles
    SET status = v_status, updated_at = now()
    WHERE id = p_profile_id AND status = 'suspended';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found_or_not_suspended';
    END IF;
  ELSIF p_profile_type = 'university' THEN
    UPDATE public.university_profiles
    SET status = v_status, updated_at = now()
    WHERE id = p_profile_id AND status = 'suspended';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found_or_not_suspended';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_profile_type';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.reinstated',
    p_profile_type || '_profile',
    p_profile_id,
    jsonb_build_object('status', 'suspended'),
    jsonb_build_object('status', v_status, 'reason', v_reason, 'profile_type', p_profile_type)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.suspend_profile(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.suspend_profile(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reinstate_profile(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinstate_profile(uuid, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
