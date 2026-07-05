-- Privileged auth/RBAC operations (SECURITY DEFINER)
-- Section 7

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public._write_audit_log(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_actor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_metadata,
    p_ip_address,
    p_user_agent
  );
END;
$$;

REVOKE ALL ON FUNCTION public._write_audit_log(uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role_enum
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_old_role public.user_role_enum;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role
  INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor profile not found';
  END IF;

  -- CRITICAL: staff cannot assign super_admin
  IF v_actor_role = 'staff' AND p_new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Staff members cannot assign the super_admin role';
  END IF;

  IF p_new_role = 'super_admin' AND v_actor_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin can assign the super_admin role';
  END IF;

  IF p_new_role = 'admin' AND v_actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admin or super_admin can assign the admin role';
  END IF;

  IF p_new_role = 'staff' AND v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to assign staff role';
  END IF;

  SELECT role
  INTO v_old_role
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  UPDATE public.profiles
  SET
    role = p_new_role,
    updated_at = now()
  WHERE id = p_target_user_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'user.role_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.user_role_enum)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.user_role_enum) TO authenticated;

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

  SELECT role
  INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

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
    updated_at = now()
  WHERE id = p_target_user_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'user.suspended',
    'profile',
    p_target_user_id,
    jsonb_build_object('locked_until', v_old_locked_until),
    jsonb_build_object('locked_until', p_locked_until),
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.suspend_user(uuid, timestamptz, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.suspend_user(uuid, timestamptz, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_phone_otp(
  p_user_id uuid,
  p_phone text,
  p_otp text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_attempt public.phone_verification_attempts%ROWTYPE;
  v_old_phone text;
  v_old_phone_verified_at timestamptz;
BEGIN
  IF v_actor_id IS NULL OR v_actor_id <> p_user_id THEN
    RAISE EXCEPTION 'Cannot verify phone for another user';
  END IF;

  IF p_phone !~ '^\+966[0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid Saudi phone number format';
  END IF;

  SELECT *
  INTO v_attempt
  FROM public.phone_verification_attempts
  WHERE user_id = p_user_id
    AND phone = p_phone
    AND is_verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'No active OTP verification attempt found';
  END IF;

  IF v_attempt.otp_hash <> extensions.crypt(p_otp, v_attempt.otp_hash) THEN
    RAISE EXCEPTION 'Invalid OTP code';
  END IF;

  UPDATE public.phone_verification_attempts
  SET
    is_verified = true,
    verified_at = now()
  WHERE id = v_attempt.id;

  SELECT phone, phone_verified_at
  INTO v_old_phone, v_old_phone_verified_at
  FROM public.profiles
  WHERE id = p_user_id;

  UPDATE public.profiles
  SET
    phone = p_phone,
    phone_verified_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  PERFORM public._write_audit_log(
    p_user_id,
    'user.phone_verified',
    'profile',
    p_user_id,
    jsonb_build_object(
      'phone', v_old_phone,
      'phone_verified_at', v_old_phone_verified_at
    ),
    jsonb_build_object(
      'phone', p_phone,
      'phone_verified_at', now()
    )
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_phone_otp(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(uuid, text, text) TO authenticated;
